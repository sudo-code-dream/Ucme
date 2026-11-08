"use server";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { logAdmin } from "@/lib/audit";

export async function suspendUser(userId: string, fd: FormData): Promise<void> {
  const admin = await requireAdmin();
  const reason = String(fd.get("reason") ?? "").trim().slice(0, 200);
  if (reason.length < 5) return;
  const target = await db.user.findUnique({ where: { id: userId } });
  if (!target || target.role === "ADMIN" || target.id === admin.id) return; // admins cannot be suspended here
  await db.user.update({ where: { id: userId }, data: { suspendedAt: new Date(), suspendedReason: reason, sessionVersion: { increment: 1 } } }); // also signs them out
  await logAdmin(admin, "user.suspend", "User", userId, reason);
  revalidatePath("/admin/users");
}
export async function unsuspendUser(userId: string): Promise<void> {
  const admin = await requireAdmin();
  await db.user.update({ where: { id: userId }, data: { suspendedAt: null, suspendedReason: null } });
  await logAdmin(admin, "user.unsuspend", "User", userId);
  revalidatePath("/admin/users");
}
