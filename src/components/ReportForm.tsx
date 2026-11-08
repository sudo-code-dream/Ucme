"use client";
import Link from "next/link";
import { useFormState, useFormStatus } from "react-dom";
import { CheckCircle2 } from "lucide-react";
import { createReport, updateReport, ReportState } from "@/app/actions/reports";
import { CATEGORIES, LOCATIONS } from "@/lib/constants";
import { DROPOFF_DAYS } from "@/lib/office";
import OfficeInfo from "./OfficeInfo";

type Edit = { id: string; photoUrl: string | null; values: { title: string; category: string; location: string; occurredOn: string; approxTime: string; description: string; features: string } };

function Submit({ text }: { text: string }) { const { pending } = useFormStatus(); return <button className="btn" disabled={pending}>{pending ? "Saving…" : text}</button>; }

export default function ReportForm({ type, edit }: { type: "LOST" | "FOUND"; edit?: Edit }) {
  const lost = type === "LOST";
  const v = edit?.values;
  const [s, action] = useFormState<ReportState, FormData>(edit ? updateReport.bind(null, edit.id) : createReport.bind(null, type), {});
  const err = (k: string) => s.fieldErrors?.[k] && <p className="mt-1 text-xs text-red-600">{s.fieldErrors[k]}</p>;

  if (s.ok && edit) return (
    <div className="card p-6 text-center">
      <CheckCircle2 className="mx-auto mb-2 text-green-600" size={36} />
      <h2 className="text-lg font-semibold">Changes saved</h2>
      <div className="mt-4 flex justify-center gap-2"><Link href="/my-reports" className="btn">Back to My Reports</Link><Link href={`/lost-and-found/${edit.id}`} className="btn-ghost">View report</Link></div>
    </div>
  );
  if (s.ok) return (
    <div className="card p-6 text-center">
      <CheckCircle2 className="mx-auto mb-2 text-green-600" size={36} />
      <h2 className="text-lg font-semibold">Report submitted</h2>
      <p className="mt-1 text-sm text-uc-muted">Your reference number</p>
      <p className="my-2 text-xl font-bold tracking-wide text-uc-dark">{s.ref}</p>
      <p className="mb-4 text-sm text-uc-muted">{lost ? "Keep this number to follow up on your report." : `Bring the item and this reference number to the Prefect of Discipline Office within ${DROPOFF_DAYS} days. Your report is listed once staff confirm receipt.`}</p>
      {!lost && <OfficeInfo className="mb-4 text-left" />}
      <div className="flex justify-center gap-2"><Link href="/lost-and-found" className="btn">Browse Lost &amp; Found</Link><Link href="/dashboard" className="btn-ghost">Dashboard</Link></div>
    </div>
  );

  return (
    <form action={action} className="card space-y-4 p-5">
      {s.error && <p role="alert" className="rounded border border-red-200 bg-red-50 p-2 text-sm text-red-700">{s.error}</p>}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2"><label className="label" htmlFor="title">Item name</label><input id="title" name="title" defaultValue={v?.title} className="input" placeholder="e.g. Black umbrella" />{err("title")}</div>
        <div><label className="label" htmlFor="category">Category</label><select id="category" name="category" className="input" defaultValue={v?.category ?? ""}><option value="" disabled>Select…</option>{CATEGORIES.map((c) => <option key={c}>{c}</option>)}</select>{err("category")}</div>
        <div><label className="label" htmlFor="location">{lost ? "Last known location" : "Found location"}</label><select id="location" name="location" className="input" defaultValue={v?.location ?? ""}><option value="" disabled>Select…</option>{LOCATIONS.map((c) => <option key={c}>{c}</option>)}</select>{err("location")}</div>
        <div><label className="label" htmlFor="occurredOn">{lost ? "Date lost" : "Date found"}</label><input id="occurredOn" name="occurredOn" type="date" defaultValue={v?.occurredOn} className="input" />{err("occurredOn")}</div>
        <div><label className="label" htmlFor="approxTime">Approximate time</label><input id="approxTime" name="approxTime" type="time" defaultValue={v?.approxTime} className="input" /></div>
        <div className="sm:col-span-2"><label className="label" htmlFor="description">Description</label><textarea id="description" name="description" rows={3} defaultValue={v?.description} className="input" placeholder="General description (this is shown publicly)" />{err("description")}</div>
        <div className="sm:col-span-2"><label className="label" htmlFor="features">Distinctive features</label><textarea id="features" name="features" rows={2} defaultValue={v?.features} className="input" placeholder="Scratches, stickers, contents, serial no. (kept private; used to verify ownership)" />{err("features")}</div>
        {!lost && !edit && <OfficeInfo className="sm:col-span-2" />}
        <div className="sm:col-span-2">
          <label className="label" htmlFor="photo">{edit?.photoUrl ? "Replace photo (optional)" : "Item photo (optional)"}</label>
          {edit?.photoUrl && <div className="mb-2 flex items-center gap-3"><img src={edit.photoUrl} alt="Current photo" className="h-16 w-16 rounded border border-uc-line object-cover" /><label className="flex items-center gap-2 text-sm"><input type="checkbox" name="removePhoto" />Remove current photo</label></div>}
          <input id="photo" name="photo" type="file" accept="image/jpeg,image/png,image/webp" className="input file:mr-3 file:rounded file:border-0 file:bg-uc-bg file:px-3 file:py-1 file:text-sm" />
          <p className="mt-1 text-xs text-uc-muted">JPG, PNG or WebP, up to 5 MB. Photos are public. Do not show faces, ID numbers, or other personal details.</p>{err("photo")}
        </div>
      </div>
      <div className="flex justify-end gap-2"><Link href={edit ? "/my-reports" : "/dashboard"} className="btn-ghost">Cancel</Link><Submit text={edit ? "Save changes" : lost ? "Submit lost report" : "Submit found report"} /></div>
    </form>
  );
}
