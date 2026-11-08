"use server";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { deleteImage } from "@/lib/cloudinary";
import { notify } from "@/lib/notify";
import { canDelete } from "@/lib/report-rules";

/** A lost-item owner can close their own report ("I found it"). Found items are closed by office staff only. */
export async function markResolved(reportId: string): Promise<void> {
  const user = await requireUser();
  await db.report.updateMany({ where: { id: reportId, userId: user.id, type: "LOST" }, data: { status: "RESOLVED" } }); // ownership enforced in the query
  revalidatePath("/my-reports"); revalidatePath("/dashboard");
}

export async function markAllRead(): Promise<void> {
  const user = await requireUser();
  await db.notification.updateMany({ where: { userId: user.id, read: false }, data: { read: true } });
  revalidatePath("/notifications");
}

/** Owner-only delete. People with pending claims are told the report was withdrawn (no details shared). */
export async function deleteOwnReport(reportId: string): Promise<void> {
  const user = await requireUser();
  const r = await db.report.findUnique({ where: { id: reportId } });
  if (!r || r.userId !== user.id || !canDelete(r)) return;
  const claimants = await db.claim.findMany({ where: { reportId, status: "PENDING" }, select: { claimantId: true } });
  await db.$transaction([
    db.claim.deleteMany({ where: { reportId } }), db.savedItem.deleteMany({ where: { reportId } }),
    db.flag.deleteMany({ where: { reportId } }), db.report.delete({ where: { id: reportId } }),
  ]);
  if (r.photoUrl) await deleteImage(r.photoUrl).catch(() => {});
  await notify(claimants.map((c) => ({ userId: c.claimantId, message: `A report you claimed (${r.ref}) was withdrawn by the finder.` })));
  revalidatePath("/my-reports"); revalidatePath("/dashboard"); revalidatePath("/lost-and-found");
}
