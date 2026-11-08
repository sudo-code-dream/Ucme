import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
const COOKIE = "ucme_session";
const key = () => new TextEncoder().encode(process.env.SESSION_SECRET);

/** `version` must match User.sessionVersion; bumping it signs the user out everywhere. */
export async function createSession(userId: string, version = 0) {
  const token = await new SignJWT({ userId, v: version }).setProtectedHeader({ alg: "HS256" }).setExpirationTime("7d").sign(key());
  cookies().set(COOKIE, token, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: 60 * 60 * 24 * 7 });
}
export async function getSession(): Promise<{ userId: string; v: number } | null> {
  const t = cookies().get(COOKIE)?.value;
  if (!t) return null;
  try { const { payload } = await jwtVerify(t, key()); return { userId: payload.userId as string, v: (payload.v as number) ?? 0 }; } catch { return null; }
}
export async function getUserId() { return (await getSession())?.userId ?? null; }
export function destroySession() { cookies().delete(COOKIE); }
