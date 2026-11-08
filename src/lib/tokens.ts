import { createHash, randomBytes } from "crypto";
import { db } from "./db";
import { sendEmail } from "./email";
import { renderEmail } from "./email-template";

type TokenType = "VERIFY_EMAIL" | "RESET_PASSWORD";
const hash = (t: string) => createHash("sha256").update(t).digest("hex"); // only the hash is stored
export const appUrl = () => process.env.APP_URL ?? "http://localhost:3000";

export async function createToken(userId: string, type: TokenType, ttlMs: number) {
  const raw = randomBytes(32).toString("base64url");
  await db.authToken.create({ data: { userId, type, tokenHash: hash(raw), expiresAt: new Date(Date.now() + ttlMs) } });
  return raw;
}
/** Single use: returns the user id if the token is valid, and burns it atomically. */
export async function consumeToken(raw: string, type: TokenType): Promise<string | null> {
  if (!raw) return null;
  const t = await db.authToken.findUnique({ where: { tokenHash: hash(raw) } });
  if (!t || t.type !== type || t.usedAt || t.expiresAt < new Date()) return null;
  const r = await db.authToken.updateMany({ where: { id: t.id, usedAt: null }, data: { usedAt: new Date() } });
  return r.count === 1 ? t.userId : null;
}
export async function sendVerification(u: { id: string; email: string; firstName: string }) {
  const raw = await createToken(u.id, "VERIFY_EMAIL", 24 * 3_600_000);
  const { html, text } = renderEmail({
    preheader: "Confirm your email to start using UCme.",
    title: "Verify your email",
    paragraphs: [`Hi ${u.firstName},`, "Welcome to UCme, the University of Cebu lost-and-found portal. Please confirm your email address so you can report and claim items."],
    button: { label: "Verify my email", url: `${appUrl()}/verify-email?token=${raw}` },
    note: "This link expires in 24 hours. If you didn't create a UCme account, you can safely ignore this email.",
  });
  await sendEmail(u.email, "Verify your UCme email", html, text);
}
export async function sendReset(u: { id: string; email: string; firstName: string }) {
  const raw = await createToken(u.id, "RESET_PASSWORD", 3_600_000);
  const { html, text } = renderEmail({
    preheader: "Use this link to choose a new password.",
    title: "Reset your password",
    paragraphs: [`Hi ${u.firstName},`, "We received a request to reset your UCme password. Choose a new one with the button below."],
    button: { label: "Choose a new password", url: `${appUrl()}/reset-password?token=${raw}` },
    note: "This link expires in 1 hour and works once. If you didn't ask for this, ignore this email and your password will stay the same.",
  });
  await sendEmail(u.email, "Reset your UCme password", html, text);
}
