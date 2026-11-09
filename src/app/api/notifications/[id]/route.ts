import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/session";

/** Marks ONE of your own notifications as read, then opens the report it is about. */
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session) return NextResponse.redirect(new URL("/login", req.url));
  const n = await db.notification.findFirst({ where: { id: params.id, userId: session.userId } }); // only your own
  if (!n) return NextResponse.redirect(new URL("/notifications", req.url));
  if (!n.read) await db.notification.update({ where: { id: n.id }, data: { read: true } });
  return NextResponse.redirect(new URL(n.reportId ? `/lost-and-found/${n.reportId}` : "/notifications", req.url));
}
