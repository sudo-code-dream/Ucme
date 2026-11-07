import Link from "next/link";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";

export default async function Saved() {
  const user = await requireUser();
  const items = await db.savedItem.findMany({ where: { userId: user.id, report: { hidden: false } }, include: { report: { select: { id: true, ref: true, type: true, title: true, category: true, location: true } } } });
  return (
    <div className="space-y-4">
      <h1 className="page-title">Saved Items</h1>
      <div className="card divide-y divide-uc-line">
        {items.length === 0 && <p className="p-10 text-center text-sm text-uc-muted">You haven&apos;t saved anything yet. <Link href="/lost-and-found" className="text-uc hover:underline">Browse Lost &amp; Found</Link></p>}
        {items.map(({ report: r }) => (
          <Link key={r.id} href={`/lost-and-found/${r.id}`} className="flex items-center justify-between gap-3 p-4 text-sm hover:bg-uc-bg/60">
            <span><b>{r.title}</b><span className="block text-xs text-uc-muted">{r.ref} · {r.category} · {r.location}</span></span>
            <span className={`badge ${r.type === "LOST" ? "bg-red-50 text-red-700" : "bg-green-50 text-green-700"}`}>{r.type === "LOST" ? "Lost" : "Found"}</span>
          </Link>))}
      </div>
    </div>
  );
}
