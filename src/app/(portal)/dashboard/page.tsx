import Link from "next/link";
import { Bell, Bookmark, CheckCircle2, FilePlus, FileText, PackageSearch, Search, Sparkles, ShieldCheck, Inbox } from "lucide-react";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { countPossibleMatches } from "@/lib/matching";

const greeting = () => { const h = new Date().getHours(); return h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening"; };
const STATUS: Record<string, string> = { ACTIVE: "Active", MATCHED: "Matched", RESOLVED: "Resolved", PENDING: "Pending" };

export default async function Dashboard() {
  const user = await requireUser();
  const [mine, saved, matches, resolved, pendingClaims, unread, recent] = await Promise.all([
    db.report.count({ where: { userId: user.id } }),
    db.savedItem.count({ where: { userId: user.id, report: { hidden: false } } }),
    countPossibleMatches(user.id),
    db.report.count({ where: { userId: user.id, status: "RESOLVED" } }),
    db.report.count({ where: { userId: user.id, type: "FOUND", status: "PENDING" } }),
    db.notification.count({ where: { userId: user.id, read: false } }),
    db.report.findMany({
      where: { status: { not: "PENDING" }, hidden: false }, orderBy: { createdAt: "desc" }, take: 8,
      select: { id: true, ref: true, type: true, status: true, title: true, category: true, location: true, createdAt: true }, // no private fields
    }),
  ]);

  const stats = [
    { label: "My Reports", n: mine, Icon: FileText }, { label: "Saved Items", n: saved, Icon: Bookmark },
    { label: "Possible Matches", n: matches, Icon: Sparkles }, { label: "Resolved", n: resolved, Icon: CheckCircle2 },
  ];
  const attention = [
    { n: pendingClaims, text: "found items to drop off at the office", href: "/my-reports", Icon: Inbox },
    { n: unread, text: "unread notifications", href: "/notifications", Icon: Bell },
    { n: matches, text: "possible matches for your reports", href: "/my-reports", Icon: Sparkles },
  ].filter((a) => a.n > 0);

  return (
    <div className="space-y-6">
      <section className="flex flex-wrap items-center justify-between gap-4 rounded-md bg-uc-dark p-6 text-white">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-uc-gold">{new Date().toLocaleDateString("en-PH", { weekday: "long", month: "long", day: "numeric" })}</p>
          <h1 className="mt-1 text-2xl font-bold">{greeting()}, {user.firstName}.</h1>
          <p className="text-sm text-blue-100">Here&apos;s an overview of your lost and found activity.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/report/lost" className="btn-gold"><FilePlus size={16} />Report Lost Item</Link>
          <Link href="/report/found" className="inline-flex items-center gap-2 rounded-md border border-white/40 px-4 py-2 text-sm font-semibold hover:bg-white/10"><PackageSearch size={16} />Report Found Item</Link>
          <Link href="/lost-and-found" className="inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-semibold text-blue-100 hover:text-white"><Search size={16} />Browse</Link>
        </div>
      </section>

      <section className="card grid grid-cols-2 divide-x divide-y divide-uc-line lg:grid-cols-4 lg:divide-y-0">
        {stats.map(({ label, n, Icon }) => (
          <div key={label} className="flex items-center gap-3 p-4">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-50 text-uc"><Icon size={20} /></span>
            <div><p className="text-2xl font-bold leading-none text-uc-dark">{n}</p><p className="mt-1 text-xs text-uc-muted">{label}</p></div>
          </div>
        ))}
      </section>

      <div className="grid gap-6 lg:grid-cols-3">
        <section className="card lg:col-span-2">
          <div className="flex items-center justify-between border-b border-uc-line px-4 py-3">
            <h2 className="font-bold text-uc-dark">Recent Lost &amp; Found</h2>
            <Link href="/lost-and-found" className="text-sm font-semibold text-uc hover:underline">View all</Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="bg-uc-bg"><tr>{["Status", "Item", "Category", "Location", "Date Reported", "Action"].map((h) => <th key={h} className="th">{h}</th>)}</tr></thead>
              <tbody className="divide-y divide-uc-line">
                {recent.length === 0 && (
                  <tr><td colSpan={6} className="px-4 py-10 text-center">
                    <p className="font-semibold">No reports yet</p><p className="mb-3 text-uc-muted">Be the first to report a lost or found item.</p>
                    <Link href="/report/lost" className="btn">Report Lost Item</Link></td></tr>
                )}
                {recent.map((r) => (
                  <tr key={r.id} className="hover:bg-uc-bg/60">
                    <td className="px-4 py-3"><span className={`badge ${r.type === "LOST" ? "bg-red-50 text-red-700" : "bg-green-50 text-green-700"}`}>{r.type === "LOST" ? "Lost" : "Found"}</span>
                      <span className="ml-2 text-xs text-uc-muted">{STATUS[r.status]}</span></td>
                    <td className="px-4 py-3 font-semibold">{r.title}<div className="text-xs font-normal text-uc-muted">{r.ref}</div></td>
                    <td className="px-4 py-3">{r.category}</td><td className="px-4 py-3">{r.location}</td>
                    <td className="whitespace-nowrap px-4 py-3">{r.createdAt.toLocaleDateString("en-PH", { year: "numeric", month: "short", day: "numeric" })}</td>
                    <td className="px-4 py-3"><Link href={`/lost-and-found/${r.id}`} className="font-semibold text-uc hover:underline">View</Link></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <aside className="space-y-6">
          <section className="card border-t-4 border-t-uc-gold p-4">
            <h2 className="mb-3 font-bold text-uc-dark">Needs your attention</h2>
            {attention.length === 0 ? <p className="text-sm text-uc-muted">You&apos;re all caught up.</p> : (
              <ul className="space-y-1">{attention.map(({ n, text, href, Icon }) => (
                <li key={text}><Link href={href} className="flex items-center gap-3 rounded-md p-2 text-sm hover:bg-uc-bg"><Icon size={18} className="shrink-0 text-uc" /><span><b>{n}</b> {text}</span></Link></li>))}</ul>)}
          </section>
          <section className="card p-4">
            <h2 className="mb-3 font-bold text-uc-dark">How it works</h2>
            <ol className="space-y-3 text-sm">
              {["Report what you lost or found.", "We suggest possible matches.", "Owners claim it and collect it from the Prefect of Discipline Office."].map((t, i) => (
                <li key={i} className="flex gap-3"><span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-uc text-xs font-bold text-white">{i + 1}</span><span dangerouslySetInnerHTML={{ __html: t }} /></li>))}
            </ol>
            <p className="mt-3 flex items-start gap-2 rounded-md bg-uc-bg p-2 text-xs text-uc-muted"><ShieldCheck size={14} className="mt-0.5 shrink-0" />Private details are never shown on public reports.</p>
          </section>
        </aside>
      </div>
    </div>
  );
}
