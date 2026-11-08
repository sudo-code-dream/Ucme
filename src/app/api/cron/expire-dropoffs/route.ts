import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { DROPOFF_DAYS } from "@/lib/office";
import { notify } from "@/lib/notify";

/** Daily job: closes found reports that were not dropped off in time. Vercel Cron sends `Authorization: Bearer $CRON_SECRET`. */
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const cutoff = new Date(Date.now() - DROPOFF_DAYS * 86_400_000);
  const stale = await db.report.findMany({ where: { type: "FOUND", status: "PENDING", createdAt: { lt: cutoff } }, select: { id: true, ref: true, userId: true } });
  if (stale.length) {
    await db.report.updateMany({ where: { id: { in: stale.map((s) => s.id) } }, data: { status: "EXPIRED" } });
    await notify(stale.map((s) => ({ userId: s.userId, email: true,
      message: `Your found report ${s.ref} expired because the item wasn't dropped off within ${DROPOFF_DAYS} days. If you still have it, bring it to the office and staff can reinstate it.` })));
  }
  // Housekeeping: keep only what is still useful
  const day = 86_400_000;
  await Promise.all([
    db.rateLimit.deleteMany({ where: { createdAt: { lt: new Date(Date.now() - 2 * day) } } }),
    db.loginAttempt.deleteMany({ where: { createdAt: { lt: new Date(Date.now() - day) } } }),
    db.authToken.deleteMany({ where: { OR: [{ expiresAt: { lt: new Date(Date.now() - 7 * day) } }, { usedAt: { lt: new Date(Date.now() - 7 * day) } }] } }),
  ]);
  return NextResponse.json({ expired: stale.length });
}
