"use server";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";

/** Only the owner of the FOUND report may review its claims. */
export async function reviewClaim(claimId: string, decision: "APPROVED" | "REJECTED"): Promise<void> {
  const user = await requireUser();
  const c = await db.claim.findUnique({ where: { id: claimId }, include: { report: true } });
  if (!c || c.report.userId !== user.id || c.status !== "PENDING") return;
  await db.claim.update({ where: { id: claimId }, data: { status: decision } });
  if (decision === "APPROVED") await db.report.update({ where: { id: c.reportId }, data: { status: "MATCHED" } });
  await db.notification.create({ data: { userId: c.claimantId, message: decision === "APPROVED"
    ? `Your claim for ${c.report.ref} was approved. The item is kept at: ${c.report.keptAt ?? "the finder will tell you"}.`
    : `Your claim for ${c.report.ref} was not approved.` } });
  revalidatePath("/my-reports"); revalidatePath("/dashboard");
}

export async function markResolved(reportId: string): Promise<void> {
  const user = await requireUser();
  await db.report.updateMany({ where: { id: reportId, userId: user.id }, data: { status: "RESOLVED" } }); // ownership enforced in the query
  revalidatePath("/my-reports"); revalidatePath("/dashboard");
}

export async function markAllRead(): Promise<void> {
  const user = await requireUser();
  await db.notification.updateMany({ where: { userId: user.id, read: false }, data: { read: true } });
  revalidatePath("/notifications");
}
