"use client";
import { useFormState, useFormStatus } from "react-dom";
import { Flag } from "lucide-react";
import { flagReport, ModState } from "@/app/actions/moderation";
import { FLAG_REASONS } from "@/lib/moderation";

function Send() { const { pending } = useFormStatus(); return <button className="btn-ghost" disabled={pending}>{pending ? "Sending…" : "Send report"}</button>; }

export default function FlagForm({ reportId }: { reportId: string }) {
  const [s, action] = useFormState<ModState, FormData>(flagReport.bind(null, reportId), {});
  return (
    <details className="text-sm">
      <summary className="inline-flex cursor-pointer items-center gap-1 text-uc-muted hover:text-uc-text"><Flag size={14} />Report this post</summary>
      {s.ok ? <p className="mt-2 rounded border border-green-200 bg-green-50 p-2 text-green-800">Thanks. A moderator will review this report.</p> : (
        <form action={action} className="card mt-2 max-w-sm space-y-2 p-3">
          {s.error && <p role="alert" className="text-xs text-red-600">{s.error}</p>}
          <select name="reason" className="input" defaultValue="" aria-label="Reason"><option value="" disabled>Select a reason…</option>{FLAG_REASONS.map((r) => <option key={r}>{r}</option>)}</select>
          <textarea name="note" rows={2} maxLength={300} className="input" placeholder="Details (optional)" />
          <Send />
        </form>)}
    </details>
  );
}
