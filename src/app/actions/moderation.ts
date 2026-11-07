"use server";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireAdmin, requireUser } from "@/lib/auth";
import { deleteImage } from "@/lib/cloudinary";
import { FLAG_REASONS } from "@/lib/moderation";

export type ModState = { error?: string; ok?: boolean };
const refresh = () => { revalidatePath("/admin"); revalidatePath("/lost-and-found"); revalidatePath("/dashboard"); };

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

export async function adminReviewClaim(claimId: string, decision: "APPROVED" | "REJECTED"): Promise<void> {
  await requireAdmin();
  const c = await db.claim.findUnique({ where: { id: claimId }, include: { report: true } });
  if (!c || c.status !== "PENDING") return;
  await db.claim.update({ where: { id: claimId }, data: { status: decision } });
  if (decision === "APPROVED") await db.report.update({ where: { id: c.reportId }, data: { status: "MATCHED" } });
  await db.notification.createMany({ data: [
    { userId: c.claimantId, message: decision === "APPROVED" ? `Your claim for ${c.report.ref} was approved by a moderator. The item is kept at: ${c.report.keptAt ?? "the finder will tell you"}.` : `Your claim for ${c.report.ref} was not approved by a moderator.` },
    { userId: c.report.userId, message: `A moderator ${decision === "APPROVED" ? "approved" : "rejected"} a claim on your report ${c.report.ref}.` },
  ] });
  refresh();
}
