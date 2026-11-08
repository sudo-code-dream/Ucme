import Link from "next/link";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

export default async function Audit() {
  await requireAdmin();
  const logs = await db.auditLog.findMany({ orderBy: { createdAt: "desc" }, take: 100 });
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2"><h1 className="page-title">Audit log</h1><Link href="/admin" className="text-sm font-semibold text-uc hover:underline">← Moderation</Link></div>
      <div className="card overflow-x-auto">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="bg-uc-bg"><tr>{["When", "Staff", "Action", "Target", "Detail"].map((h) => <th key={h} className="th">{h}</th>)}</tr></thead>
          <tbody className="divide-y divide-uc-line">
            {logs.length === 0 && <tr><td colSpan={5} className="px-4 py-8 text-center text-uc-muted">No admin actions recorded yet.</td></tr>}
            {logs.map((l) => (<tr key={l.id}>
              <td className="whitespace-nowrap px-4 py-2">{l.createdAt.toLocaleString("en-PH", { dateStyle: "medium", timeStyle: "short" })}</td>
              <td className="px-4 py-2">{l.actorName}</td><td className="px-4 py-2 font-medium">{l.action}</td>
              <td className="px-4 py-2 text-xs text-uc-muted">{l.targetType} {l.targetId.slice(-6)}</td><td className="px-4 py-2">{l.detail}</td></tr>))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
