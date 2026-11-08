import Link from "next/link";
import { Prisma } from "@prisma/client";
import { Search } from "lucide-react";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { CATEGORIES, LOCATIONS } from "@/lib/constants";

type SP = { q?: string; type?: string; category?: string; location?: string; date?: string };

export default async function Browse({ searchParams: sp }: { searchParams: SP }) {
  await requireUser();
  const where: Prisma.ReportWhereInput = {
    status: { in: ["ACTIVE", "MATCHED", "RESOLVED"] }, hidden: false,
    ...(sp.type === "LOST" || sp.type === "FOUND" ? { type: sp.type } : {}),
    ...(CATEGORIES.includes(sp.category ?? "") ? { category: sp.category } : {}),
    ...(LOCATIONS.includes(sp.location ?? "") ? { location: sp.location } : {}),
    ...(sp.date && !isNaN(Date.parse(sp.date)) ? { occurredOn: { gte: new Date(sp.date) } } : {}),
    ...(sp.q ? { OR: ["title", "location", "ref"].map((f) => ({ [f]: { contains: sp.q!.slice(0, 60), mode: "insensitive" } })) as Prisma.ReportWhereInput[] } : {}),
  };
  const rows = await db.report.findMany({ where, orderBy: { createdAt: "desc" }, take: 50,
    select: { id: true, ref: true, type: true, title: true, category: true, location: true, occurredOn: true } });
  const sel = (name: keyof SP, label: string, opts: string[]) => (
    <select name={name} defaultValue={sp[name] ?? ""} aria-label={label} className="input"><option value="">{label}</option>{opts.map((o) => <option key={o}>{o}</option>)}</select>);
  return (
    <div className="space-y-4">
      <h1 className="page-title">Lost &amp; Found</h1>
      <form className="card grid gap-2 p-4 sm:grid-cols-2 lg:grid-cols-6">
        <div className="relative sm:col-span-2"><Search size={16} className="absolute left-3 top-2.5 text-uc-muted" /><input name="q" defaultValue={sp.q} placeholder="Item, location or reference no." className="input pl-9" /></div>
        <select name="type" defaultValue={sp.type ?? ""} aria-label="Type" className="input"><option value="">All types</option><option value="LOST">Lost</option><option value="FOUND">Found</option></select>
        {sel("category", "All categories", CATEGORIES)}{sel("location", "All locations", LOCATIONS)}
        <input name="date" type="date" defaultValue={sp.date} aria-label="On or after date" className="input" />
        <div className="flex gap-2 sm:col-span-2 lg:col-span-6"><button className="btn">Apply filters</button><Link href="/lost-and-found" className="btn-ghost">Reset</Link></div>
      </form>
      <div className="card overflow-x-auto">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="bg-uc-bg text-xs uppercase tracking-wide text-uc-muted"><tr>{["Type", "Item", "Category", "Location", "Date", "Action"].map((h) => <th key={h} className="px-4 py-2.5 font-medium">{h}</th>)}</tr></thead>
          <tbody className="divide-y divide-uc-line">
            {rows.length === 0 && <tr><td colSpan={6} className="px-4 py-10 text-center text-uc-muted">No reports match your filters.</td></tr>}
            {rows.map((r) => (<tr key={r.id} className="hover:bg-uc-bg/60">
              <td className="px-4 py-3"><span className={`badge ${r.type === "LOST" ? "bg-red-50 text-red-700" : "bg-green-50 text-green-700"}`}>{r.type === "LOST" ? "Lost" : "Found"}</span></td>
              <td className="px-4 py-3 font-medium">{r.title}<div className="text-xs font-normal text-uc-muted">{r.ref}</div></td>
              <td className="px-4 py-3">{r.category}</td><td className="px-4 py-3">{r.location}</td>
              <td className="whitespace-nowrap px-4 py-3">{r.occurredOn.toLocaleDateString("en-PH", { year: "numeric", month: "short", day: "numeric" })}</td>
              <td className="px-4 py-3"><Link href={`/lost-and-found/${r.id}`} className="text-uc hover:underline">View</Link></td></tr>))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
