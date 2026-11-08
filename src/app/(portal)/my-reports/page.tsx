import Link from "next/link";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { markResolved } from "@/app/actions/manage";
import { DROPOFF_DAYS } from "@/lib/office";

const FILTERS = ["all", "lost", "found", "active", "resolved"];
export default async function MyReports({ searchParams }: { searchParams: { filter?: string } }) {
  const user = await requireUser();
  const f = FILTERS.includes(searchParams.filter ?? "") ? searchParams.filter! : "all";
  const where: Prisma.ReportWhereInput = { userId: user.id,
    ...(f === "lost" ? { type: "LOST" } : f === "found" ? { type: "FOUND" } : {}),
    ...(f === "active" ? { status: { in: ["PENDING", "ACTIVE", "MATCHED"] } } : f === "resolved" ? { status: "RESOLVED" } : {}) };
  const rows = await db.report.findMany({ where, orderBy: { createdAt: "desc" } });
  return (
    <div className="space-y-4">
      <h1 className="page-title">My Reports</h1>
      <div className="flex flex-wrap gap-2">{FILTERS.map((x) => (
        <Link key={x} href={`/my-reports?filter=${x}`} className={`rounded border px-3 py-1 text-sm capitalize ${f === x ? "border-uc bg-uc text-white" : "border-uc-line bg-white hover:border-uc"}`}>{x}</Link>))}</div>
      <div className="card overflow-x-auto">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="bg-uc-bg text-xs uppercase tracking-wide text-uc-muted"><tr>{["Reference", "Item", "Type", "Status", "Submitted", "Action"].map((h) => <th key={h} className="px-4 py-2.5 font-medium">{h}</th>)}</tr></thead>
          <tbody className="divide-y divide-uc-line">
            {rows.length === 0 && <tr><td colSpan={6} className="px-4 py-10 text-center text-uc-muted">No reports found.</td></tr>}
            {rows.map((r) => (<tr key={r.id}>
              <td className="px-4 py-3 text-xs">{r.ref}</td><td className="px-4 py-3 font-medium">{r.title}</td>
              <td className="px-4 py-3 capitalize">{r.type.toLowerCase()}</td><td className="px-4 py-3">{r.type === "FOUND" && r.status === "PENDING" ? `Awaiting drop-off (by ${new Date(r.createdAt.getTime() + DROPOFF_DAYS * 86_400_000).toLocaleDateString("en-PH", { month: "short", day: "numeric" })})` : r.status === "EXPIRED" ? "Expired (not dropped off)" : r.type === "FOUND" && r.status === "MATCHED" ? "Ready for pickup" : r.status.charAt(0) + r.status.slice(1).toLowerCase()}</td>
              <td className="whitespace-nowrap px-4 py-3">{r.createdAt.toLocaleDateString("en-PH", { dateStyle: "medium" })}</td>
              <td className="flex gap-3 px-4 py-3"><Link href={`/lost-and-found/${r.id}`} className="text-uc hover:underline">View</Link>
                {r.type === "LOST" && r.status !== "RESOLVED" && <form action={markResolved.bind(null, r.id)}><button className="text-uc hover:underline">Mark resolved</button></form>}</td>
            </tr>))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
