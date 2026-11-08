import Link from "next/link";
import { notFound } from "next/navigation";
import { Bookmark, BookmarkCheck, FilePlus } from "lucide-react";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { toggleSave } from "@/app/actions/reports";
import ClaimForm from "@/components/ClaimForm";
import { findMatches } from "@/lib/matching";
import FlagForm from "@/components/FlagForm";
import OfficeInfo from "@/components/OfficeInfo";
import { DROPOFF_DAYS } from "@/lib/office";

export default async function Details({ params }: { params: { id: string } }) {
  const user = await requireUser();
  const r = await db.report.findUnique({ where: { id: params.id } });
  if (!r || ((r.status === "PENDING" || r.status === "EXPIRED" || r.hidden) && r.userId !== user.id && user.role !== "ADMIN")) notFound();
  const owner = r.userId === user.id;
  const matches = owner && r.status === "ACTIVE" ? await findMatches(r) : [];
  const saved = !!(await db.savedItem.findUnique({ where: { userId_reportId: { userId: user.id, reportId: r.id } } }));
  const rows: [string, string][] = [["Reference no.", r.ref], ["Category", r.category], [r.type === "LOST" ? "Last known location" : "Found location", r.location],
    ["Date", r.occurredOn.toLocaleDateString("en-PH", { dateStyle: "long" }) + (r.approxTime ? `, ${r.approxTime}` : "")], ["Status", r.status.charAt(0) + r.status.slice(1).toLowerCase()]];
  return (
    <div className="max-w-3xl space-y-4">
      <Link href="/lost-and-found" className="text-sm text-uc hover:underline">← Back to Lost &amp; Found</Link>
      {r.type === "FOUND" && r.status === "PENDING" && <OfficeInfo deadline={new Date(r.createdAt.getTime() + DROPOFF_DAYS * 86_400_000)} />}
      {r.status === "EXPIRED" && <p className="rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-800">This report expired because the item was not dropped off in time. If you still have it, bring it to the office and staff can reinstate it.</p>}
      {r.hidden && <p className="rounded border border-amber-300 bg-amber-50 p-3 text-sm text-amber-800">This report is hidden from public view by a moderator.</p>}
      <div className="card p-5">
        <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
          <div><span className={`badge ${r.type === "LOST" ? "bg-red-50 text-red-700" : "bg-green-50 text-green-700"}`}>{r.type === "LOST" ? "Lost" : "Found"}</span>
            <h1 className="page-title mt-1">{r.title}</h1></div>
          <div className="flex gap-2">
            <form action={toggleSave.bind(null, r.id)}><button className="btn-ghost">{saved ? <BookmarkCheck size={16} /> : <Bookmark size={16} />}{saved ? "Saved" : "Save item"}</button></form>
            <Link href={`/report/${r.type.toLowerCase()}`} className="btn-ghost"><FilePlus size={16} />Report similar item</Link>
          </div>
        </div>
        {r.photoUrl
          ? <img src={r.photoUrl} alt={r.title} className="mb-4 max-h-80 w-full rounded border border-uc-line bg-uc-bg object-contain" />
          : <div className="mb-4 flex h-40 items-center justify-center rounded border border-dashed border-uc-line text-sm text-uc-muted">No photo available</div>}
        <dl className="grid gap-x-6 gap-y-3 text-sm sm:grid-cols-2">{rows.map(([k, v]) => <div key={k}><dt className="text-xs text-uc-muted">{k}</dt><dd className="font-medium">{v}</dd></div>)}</dl>
        {r.type === "FOUND" && <p className="mt-4 text-sm"><span className="text-xs text-uc-muted">Held at</span><br /><b>Prefect of Discipline Office</b></p>}
        <h2 className="mt-4 text-sm font-semibold">Description</h2><p className="whitespace-pre-line text-sm">{r.description}</p>
        <h2 className="mt-4 text-sm font-semibold">Distinctive features</h2>
        {owner ? <p className="whitespace-pre-line text-sm">{r.features}</p>
          : <p className="text-sm text-uc-muted">Withheld to protect ownership verification.</p>}
      </div>
      {matches.length > 0 && (
        <div className="card border-l-4 border-l-uc p-5">
          <h2 className="mb-2 font-semibold text-uc-dark">Possible matches</h2>
          <ul className="divide-y divide-uc-line text-sm">{matches.map((m) => (
            <li key={m.id}><Link href={`/lost-and-found/${m.id}`} className="flex justify-between gap-3 py-2 hover:text-uc"><span><b>{m.title}</b> <span className="text-xs text-uc-muted">{m.ref} · {m.location}</span></span><span className="text-uc">View</span></Link></li>))}</ul>
        </div>)}
      {r.type === "FOUND" && !owner && !r.hidden && r.status === "ACTIVE" && <div className="card p-5"><h2 className="mb-2 font-semibold text-uc-dark">Is this yours?</h2><p className="mb-3 text-sm text-uc-muted">Describe your item below. Office staff verify ownership in person, so bring your UC ID to the Prefect of Discipline Office.</p><ClaimForm reportId={r.id} /></div>}
      {!owner && <FlagForm reportId={r.id} />}
    </div>
  );
}
