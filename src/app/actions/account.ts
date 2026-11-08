"use server";
import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { deleteImage } from "@/lib/cloudinary";
import { createSession, destroySession } from "@/lib/session";
import { sendVerification } from "@/lib/tokens";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";

export type AccState = { error?: string; ok?: boolean };
const profileSchema = z.object({
  email: z.string().trim().email("Invalid email"),
  contact: z.string().regex(/^(09|\+639)\d{9}$/, "Use 09XXXXXXXXX"),
  college: z.string().trim().min(1, "College is required"), program: z.string().trim().min(1, "Program is required"),
  yearLevel: z.string().trim().min(1, "Year level is required"), section: z.string().trim().optional(),
});
const pwSchema = z.object({ current: z.string().min(1), next: z.string().min(8, "New password needs at least 8 characters"), confirm: z.string() })
  .refine((d) => d.next === d.confirm, { path: ["confirm"], message: "Passwords do not match" });

export async function updateProfile(_: AccState, fd: FormData): Promise<AccState> {
  const user = await requireUser();
  const p = profileSchema.safeParse(Object.fromEntries(fd));
  if (!p.success) return { error: p.error.issues[0].message };
  if (await db.user.findFirst({ where: { email: p.data.email, NOT: { id: user.id } } })) return { error: "That email is already in use." };
  const emailChanged = p.data.email !== user.email;
  await db.user.update({ where: { id: user.id }, data: { ...p.data, ...(emailChanged ? { emailVerified: null } : {}) } }); // name and UC ID are not editable
  if (emailChanged) {
    await db.authToken.deleteMany({ where: { userId: user.id, type: "VERIFY_EMAIL" } });
    await sendVerification({ id: user.id, email: p.data.email, firstName: user.firstName }).catch(() => {});
  }
  revalidatePath("/profile");
  return { ok: true };
}

export async function changePassword(_: AccState, fd: FormData): Promise<AccState> {
  const user = await requireUser();
  const p = pwSchema.safeParse(Object.fromEntries(fd));
  if (!p.success) return { error: p.error.issues[0].message };
  if (!(await bcrypt.compare(p.data.current, user.passwordHash))) return { error: "Current password is incorrect." };
  const updated = await db.user.update({ where: { id: user.id }, data: { passwordHash: await bcrypt.hash(p.data.next, 12), sessionVersion: { increment: 1 } } });
  await createSession(updated.id, updated.sessionVersion); // keep this device signed in, sign out all others
  return { ok: true };
}

/** Permanently erases the signed-in user's account and everything they submitted. */
export async function deleteAccount(_: AccState, fd: FormData): Promise<AccState> {
  const user = await requireUser();
  if (fd.get("confirm") !== "DELETE") return { error: "Type DELETE to confirm." };
  if (!(await bcrypt.compare(String(fd.get("password") ?? ""), user.passwordHash))) return { error: "Password is incorrect." };

  const reports = await db.report.findMany({ where: { userId: user.id }, select: { id: true, photoUrl: true } });
  const ids = reports.map((r) => r.id);
  await db.$transaction([
    db.claim.deleteMany({ where: { OR: [{ claimantId: user.id }, { reportId: { in: ids } }] } }),
    db.savedItem.deleteMany({ where: { OR: [{ userId: user.id }, { reportId: { in: ids } }] } }),
    db.report.deleteMany({ where: { userId: user.id } }),
    db.notification.deleteMany({ where: { userId: user.id } }),
    db.loginAttempt.deleteMany({ where: { ucId: user.ucId } }),
    db.user.delete({ where: { id: user.id } }),
  ]);
  await Promise.all(reports.map((r) => (r.photoUrl ? deleteImage(r.photoUrl).catch(() => {}) : null)));
  destroySession();
  redirect("/login");
}

export async function updateAlerts(_: AccState, fd: FormData): Promise<AccState> {
  const user = await requireUser();
  await db.user.update({ where: { id: user.id }, data: { emailAlerts: fd.get("emailAlerts") === "on" } });
  return { ok: true };
}
