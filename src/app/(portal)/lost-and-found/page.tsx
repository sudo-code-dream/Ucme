import Link from "next/link";
import { Prisma, ReportStatus } from "@prisma/client";
import { FilePlus, PackageSearch, Search, X } from "lucide-react";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { CATEGORIES, LOCATIONS } from "@/lib/constants";
import Pagination from "@/components/Pagination";

type SP = { q?: string; type?: string; category?: string; location?: string; date?: string; status?: string; sort?: string; page?: string };
const PER = 20;
const STATUSES: Record<string, { label: string; status: ReportStatus }> = {
  active: { label: "Active", status: "ACTIVE" }, matched: { label: "Ready for pickup", status: "MATCHED" }, resolved: { label: "Resolved", status: "RESOLVED" },
};
const SORTS: Record<string, { label: string; orderBy: Prisma.ReportOrderByWithRelationInput }> = {
  newest: { label: "Newest reported", orderBy: { createdAt: "desc" } }, oldest: { label: "Oldest reported", orderBy: { createdAt: "asc" } },
  recent: { label: "Most recent date lost/found", orderBy: { occurredOn: "desc" } }, earliest: { label: "Earliest date lost/found", orderBy: { occurredOn: "asc" } },
};
const fmt = (d: Date) => d.toLocaleDateString("en-PH", { year: "numeric", month: "short", day: "numeric" });

export default async function Browse({ searchParams: sp }: { searchParams: SP }) {
  await requireUser();
  const type = sp.type === "LOST" || sp.type === "FOUND" ? sp.type : undefined;
  const category = CATEGORIES.includes(sp.category ?? "") ? sp.category : undefined;
  const location = LOCATIONS.includes(sp.location ?? "") ? sp.location : undefined;
  const date = sp.date && !isNaN(Date.parse(sp.date)) ? sp.date : undefined;
  const status = STATUSES[sp.status ?? ""];
  const sort = SORTS[sp.sort ?? ""] ?? SORTS.newest;
  const q = sp.q?.trim().slice(0, 60) || undefined;

  const where: Prisma.ReportWhereInput = {
    status: status ? status.status : { in: ["ACTIVE", "MATCHED", "RESOLVED"] }, hidden: false,
    ...(type ? { type } : {}), ...(category ? { category } : {}), ...(location ? { location } : {}),
    ...(date ? { occurredOn: { gte: new Date(date) } } : {}),
    // only public fields are searchable; distinctive features never are
    ...(q ? { OR: ["title", "location", "ref", "description"].map((f) => ({ [f]: { contains: q, mode: "insensitive" } })) as Prisma.ReportWhereInput[] } : {}),
  };
  const page = Math.max(1, parseInt(sp.page ?? "1") || 1);
  const [total, rows] = await Promise.all([
    db.report.count({ where }),
    db.report.findMany({ where, orderBy: sort.orderBy, skip: (page - 1) * PER, take: PER,
      select: { id: true, ref: true, type: true, status: true, title: true, category: true, location: true, occurredOn: true, photoUrl: true } }),
  ]);

  const href = (over: Partial<SP>) => {
    const p = new URLSearchParams();
    Object.entries({ q, type, category, location, date, status: status ? sp.status : undefined, sort: sp.sort, ...over }).forEach(([k, v]) => { if (v) p.set(k, String(v)); });
    const s = p.toString();
    return `/lost-and-found${s ? `?${s}` : ""}`;
  };
  const chips = [
    q && { label: `Search: ${q}`, to: href({ q: undefined }) }, category && { label: category, to: href({ category: undefined }) },
    location && { label: location, to: href({ location: undefined }) }, date && { label: `From ${fmt(new Date(date))}`, to: href({ date: undefined }) },
    status && { label: status.label, to: href({ status: undefined }) },
  ].filter(Boolean) as { label: string; to: string }[];

  const tab = (label: string, value?: "LOST" | "FOUND") => (
    <Link href={href({ type: value })} className={`rounded-md border px-3 py-1.5 text-sm font-semibold ${type === value ? "border-uc bg-uc text-white" : "border-uc-line bg-white hover:border-uc"}`}>{label}</Link>);
  const sel = (name: string, label: string, opts: [string, string][], current?: string) => (
    <select name={name} defaultValue={current ?? ""} aria-label={label} className="input"><option value="">{label}</option>{opts.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select>);
  const thumb = (url: string | null) => url ? <img src={url} alt="" className="h-10 w-10 shrink-0 rounded border border-uc-line object-cover" />
    : <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded border border-dashed border-uc-line text-[9px] text-uc-muted">No photo</span>;
  const typeBadge = (t: string) => <span className={`badge ${t === "LOST" ? "bg-red-50 text-red-700" : "bg-green-50 text-green-700"}`}>{t === "LOST" ? "Lost" : "Found"}</span>;
  const statusText = (s: string) => s === "MATCHED" ? "Ready for pickup" : s === "RESOLVED" ? "Resolved" : "";

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="page-title">Lost &amp; Found</h1>
        <div className="flex gap-2">{tab("All")}{tab("Lost", "LOST")}{tab("Found", "FOUND")}</div>
      </div>

      <form className="card grid gap-2 p-4 sm:grid-cols-2 lg:grid-cols-6">
        {type && <input type="hidden" name="type" value={type} />}
        <div className="relative sm:col-span-2"><Search size={16} className="absolute left-3 top-2.5 text-uc-muted" />
          <input name="q" defaultValue={q} placeholder="Item, place, description or reference no." aria-label="Search" className="input pl-9" /></div>
        {sel("category", "All categories", CATEGORIES.map((c) => [c, c]), category)}
        {sel("location", "All locations", LOCATIONS.map((c) => [c, c]), location)}
        {sel("status", "Any status", Object.entries(STATUSES).map(([v, s]) => [v, s.label]), status ? sp.status : undefined)}
        <input name="date" type="date" defaultValue={date} aria-label="On or after date" className="input" />
        <div className="sm:col-span-2 lg:col-span-3">{sel("sort", "Sort: newest reported", Object.entries(SORTS).map(([v, s]) => [v, s.label]), sp.sort)}</div>
        <div className="flex gap-2 sm:col-span-2 lg:col-span-3"><button className="btn">Apply</button><Link href={href({ q: undefined, category: undefined, location: undefined, date: undefined, status: undefined, sort: undefined })} className="btn-ghost">Clear</Link></div>
      </form>

      {chips.length > 0 && <div className="flex flex-wrap gap-2">{chips.map((c) => (
        <Link key={c.label} href={c.to} className="inline-flex items-center gap-1 rounded-full border border-uc-line bg-white px-3 py-1 text-xs font-semibold hover:border-uc" aria-label={`Remove filter ${c.label}`}>{c.label}<X size={12} /></Link>))}</div>}

      {rows.length === 0 ? (
        <div className="card p-10 text-center">
          <p className="font-semibold">No reports match{chips.length || type ? " your filters" : " yet"}</p>
          <p className="mb-4 mt-1 text-sm text-uc-muted">Try fewer filters, or report the item yourself so it can be matched.</p>
          <div className="flex flex-wrap justify-center gap-2">
            {(chips.length > 0 || type) && <Link href="/lost-and-found" className="btn-ghost">Clear all filters</Link>}
            <Link href="/report/lost" className="btn"><FilePlus size={16} />Report lost item</Link>
            <Link href="/report/found" className="btn-ghost"><PackageSearch size={16} />Report found item</Link>
          </div>
        </div>
      ) : (<>
        <div className="card hidden overflow-x-auto md:block">
          <table className="w-full text-left text-sm">
            <thead className="bg-uc-bg"><tr>{["", "Type", "Item", "Category", "Location", "Date", "Action"].map((h, i) => <th key={i} className="th">{h}</th>)}</tr></thead>
            <tbody className="divide-y divide-uc-line">{rows.map((r) => (
              <tr key={r.id} className="hover:bg-uc-bg/60">
                <td className="py-2 pl-4">{thumb(r.photoUrl)}</td>
                <td className="px-4 py-3">{typeBadge(r.type)}</td>
                <td className="px-4 py-3 font-semibold">{r.title}<div className="text-xs font-normal text-uc-muted">{r.ref}{statusText(r.status) && ` · ${statusText(r.status)}`}</div></td>
                <td className="px-4 py-3">{r.category}</td><td className="px-4 py-3">{r.location}</td>
                <td className="whitespace-nowrap px-4 py-3">{fmt(r.occurredOn)}</td>
                <td className="px-4 py-3"><Link href={`/lost-and-found/${r.id}`} className="font-semibold text-uc hover:underline">View</Link></td>
              </tr>))}</tbody>
          </table>
        </div>
        <ul className="card divide-y divide-uc-line md:hidden">{rows.map((r) => (
          <li key={r.id}><Link href={`/lost-and-found/${r.id}`} className="flex items-center gap-3 p-3">
            {thumb(r.photoUrl)}
            <span className="min-w-0 flex-1"><span className="flex items-center gap-2"><span className="truncate font-semibold">{r.title}</span>{typeBadge(r.type)}</span>
              <span className="block truncate text-xs text-uc-muted">{r.location} · {fmt(r.occurredOn)}{statusText(r.status) && ` · ${statusText(r.status)}`}</span></span>
          </Link></li>))}</ul>
      </>)}
      <Pagination page={page} total={total} per={PER} path="/lost-and-found" params={{ q, type, category, location, date, status: status ? sp.status : undefined, sort: sp.sort }} />
    </div>
  );
}
