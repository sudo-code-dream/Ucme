"use server";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";

/** Latest notifications for the signed-in user only. */
export async function getRecentNotifications() {
  const user = await requireUser();
  const [items, unread] = await Promise.all([
    db.notification.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" }, take: 6, select: { id: true, message: true, read: true, reportId: true, createdAt: true } }),
    db.notification.count({ where: { userId: user.id, read: false } }),
  ]);
  return { items: items.map((i) => ({ ...i, createdAt: i.createdAt.toISOString() })), unread };
}
