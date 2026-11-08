import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { DROPOFF_DAYS } from "@/lib/office";

/** Daily job: closes found reports that were not dropped off in time. Vercel Cron sends `Authorization: Bearer $CRON_SECRET`. */
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const cutoff = new Date(Date.now() - DROPOFF_DAYS * 86_400_000);
  const stale = await db.report.findMany({ where: { type: "FOUND", status: "PENDING", createdAt: { lt: cutoff } }, select: { id: true, ref: true, userId: true } });
  if (stale.length) {
    await db.$transaction([
      db.report.updateMany({ where: { id: { in: stale.map((s) => s.id) } }, data: { status: "EXPIRED" } }),
      db.notification.createMany({ data: stale.map((s) => ({ userId: s.userId,
        message: `Your found report ${s.ref} expired because the item wasn't dropped off within ${DROPOFF_DAYS} days. If you still have it, bring it to the office and staff can reinstate it.` })) }),
    ]);
  }
  return NextResponse.json({ expired: stale.length });
}
