import Link from "next/link";
import { db } from "@/lib/db";
import { maskUcId, requireAdmin } from "@/lib/auth";
import { adminReviewClaim, confirmReceipt, deleteReport, dismissFlags, markReturned, setHidden } from "@/app/actions/moderation";

function Actions({ id, hidden }: { id: string; hidden: boolean }) {
  return (
    <div className="flex flex-wrap items-start gap-3 text-sm">
      <form action={setHidden.bind(null, id, !hidden)}><button className="text-uc hover:underline">{hidden ? "Unhide" : "Hide"}</button></form>
      <details><summary className="cursor-pointer text-red-600 hover:underline">Delete</summary>
        <form action={deleteReport.bind(null, id)}><button className="btn mt-1 !bg-red-600 hover:!bg-red-700">Confirm delete</button></form></details>
    </div>
  );
}
const Thumb = ({ url }: { url: string | null }) => url ? <img src={url} alt="" className="h-12 w-12 rounded border border-uc-line object-cover" /> : <span className="flex h-12 w-12 items-center justify-center rounded border border-dashed border-uc-line text-[10px] text-uc-muted">No photo</span>;

export default async function Admin() {
  await requireAdmin();
  const [flagged, claims, recent] = await Promise.all([
    db.report.findMany({ where: { flags: { some: { resolved: false } } }, include: { flags: { where: { resolved: false }, select: { reason: true } }, user: { select: { firstName: true, ucId: true } } } }),
    db.claim.findMany({ where: { status: "PENDING" }, orderBy: { createdAt: "desc" }, take: 20,
      include: { report: { select: { ref: true, title: true, features: true } }, claimant: { select: { firstName: true, lastName: true, ucId: true } } } }),
    db.report.findMany({ orderBy: { createdAt: "desc" }, take: 20, select: { id: true, ref: true, title: true, type: true, hidden: true, photoUrl: true } }),
  ]);
  const [dropoffs, pickups] = await Promise.all([
    db.report.findMany({ where: { type: "FOUND", status: { in: ["PENDING", "EXPIRED"] } }, orderBy: { createdAt: "asc" },
      select: { id: true, ref: true, title: true, status: true, photoUrl: true, user: { select: { firstName: true, lastName: true, ucId: true } } } }),
    db.report.findMany({ where: { type: "FOUND", status: "MATCHED" },
      select: { id: true, ref: true, title: true, photoUrl: true, claims: { where: { status: "APPROVED" }, take: 1, select: { claimant: { select: { firstName: true, lastName: true, ucId: true } } } } } }),
  ]);
  return (
    <div className="space-y-6">
      <div><h1 className="page-title">Moderation</h1><p className="text-sm text-uc-muted">Admin only. Private details shown here must not be shared outside this review.</p></div>
      <div className="flex gap-2"><Link href="/admin/users" className="btn-ghost">Manage users</Link><Link href="/admin/audit" className="btn-ghost">Audit log</Link></div>

      <section className="card"><h2 className="border-b border-uc-line px-4 py-3 font-semibold text-uc-dark">Awaiting drop-off ({dropoffs.length})</h2>
        {dropoffs.length === 0 && <p className="p-6 text-center text-sm text-uc-muted">No items waiting to be dropped off.</p>}
        <ul className="divide-y divide-uc-line">{dropoffs.map((r) => (
          <li key={r.id} className="flex flex-wrap items-center gap-3 p-4 text-sm">
            <Thumb url={r.photoUrl} />
            <div className="min-w-0 flex-1"><Link href={`/lost-and-found/${r.id}`} className="font-medium text-uc hover:underline">{r.title}</Link>
              <span className="ml-2 text-xs text-uc-muted">{r.ref}{r.status === "EXPIRED" ? " · EXPIRED" : ""} · finder {r.user.firstName} {r.user.lastName} ({maskUcId(r.user.ucId)})</span></div>
            <form action={confirmReceipt.bind(null, r.id)}><button className="btn">Confirm received</button></form>
          </li>))}</ul></section>

      <section className="card"><h2 className="border-b border-uc-line px-4 py-3 font-semibold text-uc-dark">Ready for pickup ({pickups.length})</h2>
        {pickups.length === 0 && <p className="p-6 text-center text-sm text-uc-muted">No approved claims waiting for pickup.</p>}
        <ul className="divide-y divide-uc-line">{pickups.map((r) => (
          <li key={r.id} className="flex flex-wrap items-center gap-3 p-4 text-sm">
            <Thumb url={r.photoUrl} />
            <div className="min-w-0 flex-1"><Link href={`/lost-and-found/${r.id}`} className="font-medium text-uc hover:underline">{r.title}</Link>
              <span className="ml-2 text-xs text-uc-muted">{r.ref}{r.claims[0] ? ` · owner ${r.claims[0].claimant.firstName} ${r.claims[0].claimant.lastName} (${maskUcId(r.claims[0].claimant.ucId)})` : ""}</span></div>
            <form action={markReturned.bind(null, r.id)}><button className="btn">Mark returned</button></form>
          </li>))}</ul></section>

      <section className="card"><h2 className="border-b border-uc-line px-4 py-3 font-semibold text-uc-dark">Flagged reports ({flagged.length})</h2>
        {flagged.length === 0 && <p className="p-6 text-center text-sm text-uc-muted">Nothing flagged.</p>}
        <ul className="divide-y divide-uc-line">{flagged.map((r) => (
          <li key={r.id} className="flex flex-wrap items-start gap-3 p-4 text-sm">
            <Thumb url={r.photoUrl} />
            <div className="min-w-0 flex-1"><Link href={`/lost-and-found/${r.id}`} className="font-medium text-uc hover:underline">{r.title}</Link>
              <span className="ml-2 text-xs text-uc-muted">{r.ref} · {r.user.firstName} ({maskUcId(r.user.ucId)}){r.hidden ? " · hidden" : ""}</span>
              <ul className="mt-1 list-disc pl-5 text-uc-muted">{r.flags.map((f, i) => <li key={i}>{f.reason}</li>)}</ul></div>
            <div className="space-y-2"><Actions id={r.id} hidden={r.hidden} />
              <form action={dismissFlags.bind(null, r.id)}><button className="text-sm text-uc-muted hover:underline">Dismiss flags</button></form></div>
          </li>))}</ul></section>

      <section className="card"><h2 className="border-b border-uc-line px-4 py-3 font-semibold text-uc-dark">Pending claims ({claims.length})</h2>
        {claims.length === 0 && <p className="p-6 text-center text-sm text-uc-muted">No pending claims.</p>}
        <ul className="divide-y divide-uc-line">{claims.map((c) => (
          <li key={c.id} className="space-y-2 p-4 text-sm">
            <p><b>{c.report.title}</b> <span className="text-xs text-uc-muted">{c.report.ref} · claimant {c.claimant.firstName} {c.claimant.lastName} ({maskUcId(c.claimant.ucId)})</span></p>
            <div className="grid gap-2 sm:grid-cols-2">
              <p className="rounded bg-uc-bg p-2"><span className="block text-xs text-uc-muted">Claimant says</span>{c.verification}</p>
              <p className="rounded bg-uc-bg p-2"><span className="block text-xs text-uc-muted">Finder recorded</span>{c.report.features}</p></div>
            <div className="flex gap-2">
              <form action={adminReviewClaim.bind(null, c.id, "APPROVED")}><button className="btn">Approve</button></form>
              <form action={adminReviewClaim.bind(null, c.id, "REJECTED")}><button className="btn-ghost">Reject</button></form></div>
          </li>))}</ul></section>

      <section className="card"><h2 className="border-b border-uc-line px-4 py-3 font-semibold text-uc-dark">Recent reports</h2>
        <ul className="divide-y divide-uc-line">{recent.map((r) => (
          <li key={r.id} className="flex flex-wrap items-center gap-3 p-4 text-sm">
            <Thumb url={r.photoUrl} />
            <div className="min-w-0 flex-1"><Link href={`/lost-and-found/${r.id}`} className="font-medium hover:text-uc">{r.title}</Link>
              <span className="ml-2 text-xs text-uc-muted">{r.ref} · {r.type.toLowerCase()}{r.hidden ? " · hidden" : ""}</span></div>
            <Actions id={r.id} hidden={r.hidden} />
          </li>))}</ul></section>
    </div>
  );
}
