"use server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { consumeToken, sendReset, sendVerification } from "@/lib/tokens";

export type RecState = { error?: string; ok?: boolean };

/** Always answers the same way, so it can't be used to find out which emails are registered. */
export async function forgotPassword(_: RecState, fd: FormData): Promise<RecState> {
  const email = z.string().trim().email().safeParse(fd.get("email"));
  if (!email.success) return { error: "Enter a valid email address." };
  const user = await db.user.findUnique({ where: { email: email.data } });
  if (user && !user.suspendedAt) {
    const recent = await db.authToken.count({ where: { userId: user.id, type: "RESET_PASSWORD", createdAt: { gte: new Date(Date.now() - 3_600_000) } } });
    if (recent < 3) await sendReset(user).catch((e) => console.error(e));
  }
  return { ok: true };
}

export async function resetPassword(token: string, _: RecState, fd: FormData): Promise<RecState> {
  const p = z.object({ password: z.string().min(8, "At least 8 characters"), confirm: z.string() }).refine((d) => d.password === d.confirm, { message: "Passwords do not match" }).safeParse(Object.fromEntries(fd));
  if (!p.success) return { error: p.error.issues[0].message }; // validate first so a typo doesn't burn the link
  const userId = await consumeToken(token, "RESET_PASSWORD");
  if (!userId) return { error: "This link is invalid or has expired. Request a new one." };
  const user = await db.user.findUnique({ where: { id: userId } });
  if (!user) return { error: "This link is invalid or has expired." };
  await db.user.update({ where: { id: userId }, data: { passwordHash: await bcrypt.hash(p.data.password, 12), sessionVersion: { increment: 1 }, emailVerified: user.emailVerified ?? new Date() } });
  await db.authToken.deleteMany({ where: { userId, type: "RESET_PASSWORD", usedAt: null } });
  await db.loginAttempt.deleteMany({ where: { ucId: user.ucId } });
  return { ok: true };
}

export async function resendVerification(): Promise<RecState> {
  const user = await requireUser();
  if (user.emailVerified) return { ok: true };
  const last = await db.authToken.findFirst({ where: { userId: user.id, type: "VERIFY_EMAIL" }, orderBy: { createdAt: "desc" } });
  if (last && Date.now() - last.createdAt.getTime() < 60_000) return { error: "Please wait a minute before requesting another email." };
  try { await sendVerification(user); } catch { return { error: "Could not send the email. Try again later." }; }
  return { ok: true };
}
