"use server";
import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { createSession, destroySession } from "@/lib/session";
import { sendVerification } from "@/lib/tokens";
import { loginSchema, signupSchema } from "@/lib/validation";

export type FormState = { error?: string; fieldErrors?: Record<string, string> };

export async function login(_: FormState, fd: FormData): Promise<FormState> {
  const p = loginSchema.safeParse(Object.fromEntries(fd));
  if (!p.success) return { error: p.error.issues[0].message };
  // Throttle: max 5 failed attempts per UC ID in 15 minutes
  const fails = await db.loginAttempt.count({ where: { ucId: p.data.ucId, createdAt: { gte: new Date(Date.now() - 15 * 60 * 1000) } } });
  if (fails >= 5) return { error: "Too many failed attempts. Please try again in 15 minutes." };
  const user = await db.user.findUnique({ where: { ucId: p.data.ucId } });
  const ok = user && (await bcrypt.compare(p.data.password, user.passwordHash));
  if (!user || !ok) {
    await db.loginAttempt.create({ data: { ucId: p.data.ucId } });
    return { error: "Invalid UC ID or password." }; // same message for both: no account enumeration
  }
  await db.loginAttempt.deleteMany({ where: { ucId: p.data.ucId } });
  if (user.suspendedAt) return { error: "This account is suspended. Please contact the Prefect of Discipline Office." };
  await createSession(user.id, user.sessionVersion);
  redirect("/dashboard");
}

export async function signup(data: Record<string, string>): Promise<FormState> {
  const p = signupSchema.safeParse(data);
  if (!p.success) {
    const fieldErrors: Record<string, string> = {};
    p.error.issues.forEach((i) => (fieldErrors[String(i.path[0])] ??= i.message));
    return { error: "Please fix the highlighted fields.", fieldErrors };
  }
  const { confirm, consent, password, ...rest } = p.data;
  const exists = await db.user.findFirst({ where: { OR: [{ ucId: rest.ucId }, { email: rest.email }] } });
  if (exists) return { error: "An account with this UC ID or email already exists." };
  const user = await db.user.create({ data: { ...rest, passwordHash: await bcrypt.hash(password, 12) } });
  await sendVerification(user).catch((e) => console.error(e)); // signup must not fail if email does
  await createSession(user.id, user.sessionVersion);
  redirect("/dashboard");
}

export async function logout() { destroySession(); redirect("/login"); }
