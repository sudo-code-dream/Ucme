import { headers } from "next/headers";
import { db } from "./db";

/** Best-effort client IP. On Vercel the first x-forwarded-for entry is the visitor. */
export function clientIp(): string {
  const h = headers();
  return (h.get("x-forwarded-for") ?? "").split(",")[0].trim() || h.get("x-real-ip") || "unknown";
}

/**
 * Sliding-window limit stored in the database (works across serverless instances).
 * Returns true if the action may proceed, and records it. Fails open if the database check itself errors,
 * so a limiter problem never locks everyone out.
 */
export async function rateLimit(key: string, max: number, windowMs: number): Promise<boolean> {
  try {
    const n = await db.rateLimit.count({ where: { key, createdAt: { gte: new Date(Date.now() - windowMs) } } });
    if (n >= max) return false;
    await db.rateLimit.create({ data: { key } });
    return true;
  } catch (e) {
    console.error("rate limit check failed:", e);
    return true;
  }
}
