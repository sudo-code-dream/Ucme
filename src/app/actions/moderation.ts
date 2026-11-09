"use server";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireAdmin, requireUser } from "@/lib/auth";
import { deleteImage } from "@/lib/cloudinary";
import { FLAG_REASONS } from "@/lib/moderation";
import { logAdmin } from "@/lib/audit";
import { notify } from "@/lib/notify";
import { rateLimit } from "@/lib/ratelimit";
import { findMatches } from "@/lib/matching";

export type ModState = { error?: string; ok?: boolean };
const refresh = () => { revalidatePath("/admin"); revalidatePath("/lost-and-found"); revalidatePath("/dashboard"); revalidatePath("/my-reports"); };

export async function flagReport(reportId: string, _: ModState, fd: FormData): Promise<ModState> {
  const user = await requireUser();
  if (!(await rateLimit(`flag:${user.id}`, 10, 3_600_000))) return { error: "You've flagged several posts recently. Please try again later." };
  const reason = String(fd.get("reason") ?? "");
  if (!FLAG_REASONS.includes(reason)) return { error: "Choose a reason." };
  const note = String(fd.get("note") ?? "").trim().slice(0, 300);
  const report = await db.report.findUnique({ where: { id: reportId }, select: { userId: true } });
  if (!report || report.userId === user.id) return { error: "You cannot flag this report." };
  const full = note ? `${reason}: ${note}` : reason;
  await db.flag.upsert({ where: { reportId_reporterId: { reportId, reporterId: user.id } },
    update: { reason: full, resolved: false }, create: { reportId, reporterId: user.id, reason: full } });
  return { ok: true };
}

export async function setHidden(reportId: string, hidden: boolean): Promise<void> {
  const admin = await requireAdmin();
  const r = await db.report.update({ where: { id: reportId }, data: { hidden } });
  if (hidden) {
    await db.flag.updateMany({ where: { reportId }, data: { resolved: true } });
    await notify([{ userId: r.userId, reportId, email: true, message: `Your report ${r.ref} was hidden by a moderator because it may break the portal guidelines.` }]);
  }
  await logAdmin(admin, hidden ? "report.hide" : "report.unhide", "Report", reportId);
  refresh();
}

export async function dismissFlags(reportId: string): Promise<void> {
  const admin = await requireAdmin();
  await db.flag.updateMany({ where: { reportId }, data: { resolved: true } });
  await logAdmin(admin, "flags.dismiss", "Report", reportId);
  refresh();
}

export async function deleteReport(reportId: string): Promise<void> {
  const admin = await requireAdmin();
  const r = await db.report.findUnique({ where: { id: reportId } });
  if (!r) return;
  await db.$transaction([
    db.claim.deleteMany({ where: { reportId } }), db.savedItem.deleteMany({ where: { reportId } }),
    db.flag.deleteMany({ where: { reportId } }), db.report.delete({ where: { id: reportId } }),
  ]);
  await notify([{ userId: r.userId, email: true, message: `Your report ${r.ref} was removed by a moderator.` }]);
  if (r.photoUrl) await deleteImage(r.photoUrl).catch(() => {});
  await logAdmin(admin, "report.delete", "Report", reportId, r.ref);
  refresh();
}

/** Office staff confirm they physically received a found item; only then does the report go public. */
export async function confirmReceipt(reportId: string): Promise<void> {
  const admin = await requireAdmin();
  const r = await db.report.findUnique({ where: { id: reportId } });
  if (!r || r.type !== "FOUND" || (r.status !== "PENDING" && r.status !== "EXPIRED")) return; // staff may still accept a late drop-off
  await db.report.update({ where: { id: reportId }, data: { status: "ACTIVE" } });
  await notify([{ userId: r.userId, reportId, email: true, message: `The office confirmed it received your found item (${r.ref}). Thank you! It is now listed in Lost & Found.` }]);
  try { // matching must never block confirmation
    const matches = await findMatches(r);
    if (matches.length) {
      const owners = await db.report.findMany({ where: { id: { in: matches.map((m) => m.id) } }, select: { id: true, userId: true, ref: true } });
      await notify([
        { userId: r.userId, reportId, email: true, message: `A possible match was found for your found item (${r.ref}).` },
        ...owners.map((o) => ({ userId: o.userId, reportId: o.id, email: true, message: `A possible match was found for your lost item (${o.ref}).` })),
      ]);
    }
  } catch {}
  await logAdmin(admin, "dropoff.confirm", "Report", reportId, r.ref);
  refresh();
}

/** Staff verified the claimant in person. Approving closes the other pending claims on the same item. */
export async function adminReviewClaim(claimId: string, decision: "APPROVED" | "REJECTED"): Promise<void> {
  const admin = await requireAdmin();
  const c = await db.claim.findUnique({ where: { id: claimId }, include: { report: true } });
  if (!c || c.status !== "PENDING" || c.report.status !== "ACTIVE") return;
  await db.claim.update({ where: { id: claimId }, data: { status: decision } });
  const notes = [{ userId: c.claimantId, message: decision === "APPROVED"
    ? `Your claim for ${c.report.ref} was approved. Bring your UC ID to the Prefect of Discipline Office to collect it.`
    : `Your claim for ${c.report.ref} was not approved.` }];
  if (decision === "APPROVED") {
    await db.report.update({ where: { id: c.reportId }, data: { status: "MATCHED" } });
    const others = await db.claim.findMany({ where: { reportId: c.reportId, status: "PENDING", id: { not: claimId } }, select: { claimantId: true } });
    await db.claim.updateMany({ where: { reportId: c.reportId, status: "PENDING", id: { not: claimId } }, data: { status: "REJECTED" } });
    others.forEach((o) => notes.push({ userId: o.claimantId, message: `Your claim for ${c.report.ref} was not approved.` }));
  }
  await notify(notes.map((n) => ({ ...n, reportId: c.reportId, email: true })));
  await logAdmin(admin, `claim.${decision.toLowerCase()}`, "Claim", claimId, c.report.ref);
  refresh();
}

/** The item was physically handed to the verified owner. */
export async function markReturned(reportId: string): Promise<void> {
  const admin = await requireAdmin();
  const r = await db.report.findUnique({ where: { id: reportId }, include: { claims: { where: { status: "APPROVED" }, take: 1 } } });
  if (!r || r.type !== "FOUND" || r.status !== "MATCHED") return;
  await db.report.update({ where: { id: reportId }, data: { status: "RESOLVED" } });
  const notes = [{ userId: r.userId, message: `Your found item (${r.ref}) was returned to its owner. Thank you for helping!` }];
  if (r.claims[0]) notes.push({ userId: r.claims[0].claimantId, message: `Your item (${r.ref}) has been marked as returned.` });
  await notify(notes.map((n) => ({ ...n, reportId: r.id, email: true })));
  await logAdmin(admin, "report.returned", "Report", reportId, r.ref);
  refresh();
}
