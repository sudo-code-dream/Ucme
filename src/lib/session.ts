import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
const COOKIE = "ucme_session";
const key = () => new TextEncoder().encode(process.env.SESSION_SECRET);

export async function createSession(userId: string) {
  const token = await new SignJWT({ userId }).setProtectedHeader({ alg: "HS256" }).setExpirationTime("7d").sign(key());
  cookies().set(COOKIE, token, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: 60 * 60 * 24 * 7 });
}
export async function getUserId(): Promise<string | null> {
  const t = cookies().get(COOKIE)?.value;
  if (!t) return null;
  try { return (await jwtVerify(t, key())).payload.userId as string; } catch { return null; }
}
export function destroySession() { cookies().delete(COOKIE); }
