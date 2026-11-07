"use client";
import { useFormState, useFormStatus } from "react-dom";
import { submitClaim, ReportState } from "@/app/actions/reports";

function Submit() { const { pending } = useFormStatus(); return <button className="btn" disabled={pending}>{pending ? "Submitting…" : "Submit claim"}</button>; }

export default function ClaimForm({ reportId }: { reportId: string }) {
  const [s, action] = useFormState<ReportState, FormData>(submitClaim.bind(null, reportId), {});
  if (s.ok) return <p className="rounded border border-green-200 bg-green-50 p-3 text-sm text-green-800">Claim submitted. The finder will review your details.</p>;
  return (
    <form action={action} className="space-y-3">
      {s.error && <p role="alert" className="rounded border border-red-200 bg-red-50 p-2 text-sm text-red-700">{s.error}</p>}
      <label className="label" htmlFor="verification">Prove ownership</label>
      <textarea id="verification" name="verification" rows={4} className="input" placeholder="Describe details only the owner would know (marks, contents, serial number, lock screen…). Only the finder sees this." />
      <Submit />
    </form>
  );
}
