import { notFound, redirect } from "next/navigation";
import { db } from "./db";
import { getSession } from "./session";

/** Server-side guard. Use in every portal page and server action. */
export async function requireUser() {
  const session = await getSession();
  const user = session ? await db.user.findUnique({ where: { id: session.userId } }) : null;
  if (!session || !user || user.sessionVersion !== session.v) redirect("/login"); // v mismatch = signed out everywhere
  if (user.suspendedAt) redirect("/suspended");
  return user;
}
/** 12345678 -> *****678 (never show the full ID publicly) */
export const maskUcId = (id: string) => (id.length > 3 ? "*".repeat(id.length - 3) + id.slice(-3) : id);

/** Server-side admin guard. Non-admins get a 404 so the page's existence is not revealed. */
export async function requireAdmin() {
  const user = await requireUser();
  if (user.role !== "ADMIN") notFound();
  return user;
}
