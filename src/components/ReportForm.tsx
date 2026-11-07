"use client";
import Link from "next/link";
import { useFormState, useFormStatus } from "react-dom";
import { CheckCircle2 } from "lucide-react";
import { createReport, ReportState } from "@/app/actions/reports";
import { CATEGORIES, LOCATIONS } from "@/lib/constants";

function Submit({ text }: { text: string }) { const { pending } = useFormStatus(); return <button className="btn" disabled={pending}>{pending ? "Submitting…" : text}</button>; }

export default function ReportForm({ type }: { type: "LOST" | "FOUND" }) {
  const lost = type === "LOST";
  const [s, action] = useFormState<ReportState, FormData>(createReport.bind(null, type), {});
  const err = (k: string) => s.fieldErrors?.[k] && <p className="mt-1 text-xs text-red-600">{s.fieldErrors[k]}</p>;

  if (s.ok) return (
    <div className="card p-6 text-center">
      <CheckCircle2 className="mx-auto mb-2 text-green-600" size={36} />
      <h2 className="text-lg font-semibold">Report submitted</h2>
      <p className="mt-1 text-sm text-uc-muted">Your reference number</p>
      <p className="my-2 text-xl font-bold tracking-wide text-uc-dark">{s.ref}</p>
      <p className="mb-4 text-sm text-uc-muted">Keep this number to follow up on your report.</p>
      <div className="flex justify-center gap-2"><Link href="/lost-and-found" className="btn">Browse Lost &amp; Found</Link><Link href="/dashboard" className="btn-ghost">Dashboard</Link></div>
    </div>
  );

  return (
    <form action={action} className="card space-y-4 p-5">
      {s.error && <p role="alert" className="rounded border border-red-200 bg-red-50 p-2 text-sm text-red-700">{s.error}</p>}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2"><label className="label" htmlFor="title">Item name</label><input id="title" name="title" className="input" placeholder="e.g. Black umbrella" />{err("title")}</div>
        <div><label className="label" htmlFor="category">Category</label><select id="category" name="category" className="input" defaultValue=""><option value="" disabled>Select…</option>{CATEGORIES.map((c) => <option key={c}>{c}</option>)}</select>{err("category")}</div>
        <div><label className="label" htmlFor="location">{lost ? "Last known location" : "Found location"}</label><select id="location" name="location" className="input" defaultValue=""><option value="" disabled>Select…</option>{LOCATIONS.map((c) => <option key={c}>{c}</option>)}</select>{err("location")}</div>
        <div><label className="label" htmlFor="occurredOn">{lost ? "Date lost" : "Date found"}</label><input id="occurredOn" name="occurredOn" type="date" className="input" />{err("occurredOn")}</div>
        <div><label className="label" htmlFor="approxTime">Approximate time</label><input id="approxTime" name="approxTime" type="time" className="input" /></div>
        <div className="sm:col-span-2"><label className="label" htmlFor="description">Description</label><textarea id="description" name="description" rows={3} className="input" placeholder="General description (this is shown publicly)" />{err("description")}</div>
        <div className="sm:col-span-2"><label className="label" htmlFor="features">Distinctive features</label><textarea id="features" name="features" rows={2} className="input" placeholder="Scratches, stickers, contents, serial no. (kept private; used to verify ownership)" />{err("features")}</div>
        {!lost && <div className="sm:col-span-2"><label className="label" htmlFor="keptAt">Where the item is currently kept</label><input id="keptAt" name="keptAt" className="input" placeholder="e.g. Guard house, Main Building" />{err("keptAt")}</div>}
        <div className="sm:col-span-2"><label className="label" htmlFor="photo">Item photo (optional)</label><input id="photo" name="photo" type="file" accept="image/jpeg,image/png,image/webp" className="input file:mr-3 file:rounded file:border-0 file:bg-uc-bg file:px-3 file:py-1 file:text-sm" /><p className="mt-1 text-xs text-uc-muted">JPG, PNG or WebP, up to 5 MB. Photos are public. Do not show faces, ID numbers, or other personal details.</p>{err("photo")}</div>
      </div>
      <div className="flex justify-end gap-2"><Link href="/dashboard" className="btn-ghost">Cancel</Link><Submit text={lost ? "Submit lost report" : "Submit found report"} /></div>
    </form>
  );
}
