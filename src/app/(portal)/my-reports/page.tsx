import Link from "next/link";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { deleteOwnReport, markResolved } from "@/app/actions/manage";
import { DROPOFF_DAYS } from "@/lib/office";
import { canDelete, canEdit } from "@/lib/report-rules";
import Pagination from "@/components/Pagination";

const FILTERS = ["all", "lost", "found", "active", "resolved"];
const PER = 15;

export default async function MyReports({ searchParams }: { searchParams: { filter?: string; page?: string } }) {
  const user = await requireUser();
  const f = FILTERS.includes(searchParams.filter ?? "") ? searchParams.filter! : "all";
  const page = Math.max(1, parseInt(searchParams.page ?? "1") || 1);
  const where: Prisma.ReportWhereInput = { userId: user.id,
    ...(f === "lost" ? { type: "LOST" } : f === "found" ? { type: "FOUND" } : {}),
    ...(f === "active" ? { status: { in: ["PENDING", "ACTIVE", "MATCHED"] } } : f === "resolved" ? { status: "RESOLVED" } : {}) };
  const [total, rows] = await Promise.all([
    db.report.count({ where }),
    db.report.findMany({ where, orderBy: { createdAt: "desc" }, skip: (page - 1) * PER, take: PER, include: { _count: { select: { claims: true } } } }),
  ]);
  const label = (r: (typeof rows)[number]) =>
    r.type === "FOUND" && r.status === "PENDING" ? `Awaiting drop-off (by ${new Date(r.createdAt.getTime() + DROPOFF_DAYS * 86_400_000).toLocaleDateString("en-PH", { month: "short", day: "numeric" })})`
    : r.status === "EXPIRED" ? "Expired (not dropped off)" : r.type === "FOUND" && r.status === "MATCHED" ? "Ready for pickup" : r.status.charAt(0) + r.status.slice(1).toLowerCase();
  return (
    <div className="space-y-4">
      <h1 className="page-title">My Reports</h1>
      <div className="flex flex-wrap gap-2">{FILTERS.map((x) => (
        <Link key={x} href={`/my-reports?filter=${x}`} className={`rounded-md border px-3 py-1 text-sm capitalize ${f === x ? "border-uc bg-uc text-white" : "border-uc-line bg-white hover:border-uc"}`}>{x}</Link>))}</div>
      <div className="card overflow-x-auto">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead className="bg-uc-bg"><tr>{["Reference", "Item", "Type", "Status", "Submitted", "Action"].map((h) => <th key={h} className="th">{h}</th>)}</tr></thead>
          <tbody className="divide-y divide-uc-line">
            {rows.length === 0 && <tr><td colSpan={6} className="px-4 py-10 text-center text-uc-muted">No reports found.</td></tr>}
            {rows.map((r) => (<tr key={r.id}>
              <td className="px-4 py-3 text-xs">{r.ref}</td><td className="px-4 py-3 font-medium">{r.title}</td>
              <td className="px-4 py-3 capitalize">{r.type.toLowerCase()}</td><td className="px-4 py-3">{label(r)}</td>
              <td className="whitespace-nowrap px-4 py-3">{r.createdAt.toLocaleDateString("en-PH", { dateStyle: "medium" })}</td>
              <td className="px-4 py-3"><div className="flex flex-wrap items-start gap-3">
                <Link href={`/lost-and-found/${r.id}`} className="text-uc hover:underline">View</Link>
                {canEdit({ status: r.status, claimCount: r._count.claims }) && <Link href={`/my-reports/${r.id}/edit`} className="text-uc hover:underline">Edit</Link>}
                {r.type === "LOST" && r.status !== "RESOLVED" && <form action={markResolved.bind(null, r.id)}><button className="text-uc hover:underline">Mark resolved</button></form>}
                {canDelete(r) && <details><summary className="cursor-pointer text-red-600 hover:underline">Delete</summary>
                  <form action={deleteOwnReport.bind(null, r.id)}><button className="btn mt-1 !bg-red-600 hover:!bg-red-700">Confirm delete</button></form></details>}
              </div></td>
            </tr>))}
          </tbody>
        </table>
      </div>
      <Pagination page={page} total={total} per={PER} path="/my-reports" params={{ filter: f }} />
    </div>
  );
}
