import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/session";
import { logAdmin } from "@/lib/audit";
import { maskUcId } from "@/lib/auth";

// Spreadsheet-safe CSV: quotes escaped, and cells starting with = + - @ are neutralised so they can't run as formulas.
const cell = (v: unknown) => {
  let s = v instanceof Date ? v.toISOString() : String(v ?? "");
  if (/^[=+\-@\t\r]/.test(s)) s = "'" + s;
  return `"${s.replace(/"/g, '""')}"`;
};
const csv = (head: string[], rows: unknown[][]) => "\uFEFF" + [head, ...rows].map((r) => r.map(cell).join(",")).join("\r\n"); // BOM so Excel reads UTF-8
const day = (d: Date) => d.toISOString().slice(0, 10);
const person = (u?: { firstName: string; lastName: string; ucId: string }) => (u ? [`${u.firstName} ${u.lastName}`, maskUcId(u.ucId)] : ["", ""]);

export async function GET(req: NextRequest) {
  const session = await getSession();
  const admin = session ? await db.user.findUnique({ where: { id: session.userId } }) : null;
  if (!session || !admin || admin.sessionVersion !== session.v || admin.suspendedAt || admin.role !== "ADMIN") return new NextResponse("Not found", { status: 404 });

  const kind = req.nextUrl.searchParams.get("kind");
  let body: string;
  if (kind === "reports") {
    const rows = await db.report.findMany({ orderBy: { createdAt: "desc" }, take: 5000,
      select: { ref: true, type: true, status: true, hidden: true, title: true, category: true, location: true, occurredOn: true, approxTime: true, createdAt: true,
        user: { select: { firstName: true, lastName: true, ucId: true } },
        claims: { where: { status: "APPROVED" }, take: 1, select: { claimant: { select: { firstName: true, lastName: true, ucId: true } } } } } });
    // Deliberately excluded: description, distinctive features, photo, email, contact number, claim answers.
    body = csv(["Reference", "Type", "Status", "Hidden", "Item", "Category", "Location", "Date lost/found", "Time", "Reported on", "Reporter", "Reporter ID (masked)", "Approved claimant", "Claimant ID (masked)"],
      rows.map((r) => [r.ref, r.type, r.status, r.hidden ? "yes" : "no", r.title, r.category, r.location, day(r.occurredOn), r.approxTime, day(r.createdAt), ...person(r.user), ...person(r.claims[0]?.claimant)]));
  } else if (kind === "audit") {
    const rows = await db.auditLog.findMany({ orderBy: { createdAt: "desc" }, take: 5000 });
    body = csv(["When", "Staff", "Action", "Target type", "Target id", "Detail"], rows.map((l) => [l.createdAt, l.actorName, l.action, l.targetType, l.targetId, l.detail]));
  } else return new NextResponse("Unknown export", { status: 400 });

  await logAdmin(admin, `export.${kind}`, "Export", kind); // exports leave the system, so they are recorded
  return new NextResponse(body, { headers: {
    "Content-Type": "text/csv; charset=utf-8", "Cache-Control": "no-store",
    "Content-Disposition": `attachment; filename="ucme-${kind}-${day(new Date())}.csv"`,
  } });
}
