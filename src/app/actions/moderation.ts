"use server";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireAdmin, requireUser } from "@/lib/auth";
import { deleteImage } from "@/lib/cloudinary";
import { FLAG_REASONS } from "@/lib/moderation";
import { findMatches } from "@/lib/matching";

export type ModState = { error?: string; ok?: boolean };
const refresh = () => { revalidatePath("/admin"); revalidatePath("/lost-and-found"); revalidatePath("/dashboard"); revalidatePath("/my-reports"); };

export async function flagReport(reportId: string, _: ModState, fd: FormData): Promise<ModState> {
  const user = await requireUser();
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
  await requireAdmin();
  const r = await db.report.update({ where: { id: reportId }, data: { hidden } });
  if (hidden) {
    await db.flag.updateMany({ where: { reportId }, data: { resolved: true } });
    await db.notification.create({ data: { userId: r.userId, message: `Your report ${r.ref} was hidden by a moderator because it may break the portal guidelines.` } });
  }
  refresh();
}

export async function dismissFlags(reportId: string): Promise<void> {
  await requireAdmin();
  await db.flag.updateMany({ where: { reportId }, data: { resolved: true } });
  refresh();
}

export async function deleteReport(reportId: string): Promise<void> {
  await requireAdmin();
  const r = await db.report.findUnique({ where: { id: reportId } });
  if (!r) return;
  await db.$transaction([
    db.claim.deleteMany({ where: { reportId } }), db.savedItem.deleteMany({ where: { reportId } }),
    db.flag.deleteMany({ where: { reportId } }), db.report.delete({ where: { id: reportId } }),
    db.notification.create({ data: { userId: r.userId, message: `Your report ${r.ref} was removed by a moderator.` } }),
  ]);
  if (r.photoUrl) await deleteImage(r.photoUrl).catch(() => {});
  refresh();
}

/** Office staff confirm they physically received a found item; only then does the report go public. */
export async function confirmReceipt(reportId: string): Promise<void> {
  await requireAdmin();
  const r = await db.report.findUnique({ where: { id: reportId } });
  if (!r || r.type !== "FOUND" || r.status !== "PENDING") return;
  await db.report.update({ where: { id: reportId }, data: { status: "ACTIVE" } });
  await db.notification.create({ data: { userId: r.userId, message: `The office confirmed it received your found item (${r.ref}). Thank you! It is now listed in Lost & Found.` } });
  try { // matching must never block confirmation
    const matches = await findMatches(r);
    if (matches.length) {
      const owners = await db.report.findMany({ where: { id: { in: matches.map((m) => m.id) } }, select: { userId: true, ref: true } });
      await db.notification.createMany({ data: [
        { userId: r.userId, message: `A possible match was found for your found item (${r.ref}).` },
        ...owners.map((o) => ({ userId: o.userId, message: `A possible match was found for your lost item (${o.ref}).` })),
      ] });
    }
  } catch {}
  refresh();
}

/** Staff verified the claimant in person. Approving closes the other pending claims on the same item. */
export async function adminReviewClaim(claimId: string, decision: "APPROVED" | "REJECTED"): Promise<void> {
  await requireAdmin();
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
  await db.notification.createMany({ data: notes });
  refresh();
}

/** The item was physically handed to the verified owner. */
export async function markReturned(reportId: string): Promise<void> {
  await requireAdmin();
  const r = await db.report.findUnique({ where: { id: reportId }, include: { claims: { where: { status: "APPROVED" }, take: 1 } } });
  if (!r || r.type !== "FOUND" || r.status !== "MATCHED") return;
  await db.report.update({ where: { id: reportId }, data: { status: "RESOLVED" } });
  const notes = [{ userId: r.userId, message: `Your found item (${r.ref}) was returned to its owner. Thank you for helping!` }];
  if (r.claims[0]) notes.push({ userId: r.claims[0].claimantId, message: `Your item (${r.ref}) has been marked as returned.` });
  await db.notification.createMany({ data: notes });
  refresh();
}
