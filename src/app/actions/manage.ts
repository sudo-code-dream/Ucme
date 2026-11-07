"use server";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";

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
