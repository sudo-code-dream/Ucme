"use client";
import Link from "next/link";
import { useState, useTransition } from "react";
import { signup } from "@/app/actions/auth";
import AuthCard from "@/components/AuthCard";
import { UC_ID } from "@/lib/validation";

const STEPS = ["UC ID", "Personal", "University", "Security"];
const FIELDS: Record<number, [string, string, boolean?, string?][]> = {
  1: [["firstName", "First name"], ["middleName", "Middle name (optional)", true], ["lastName", "Last name"], ["suffix", "Suffix (optional)", true], ["email", "Email address", false, "email"], ["contact", "Contact number", false, "tel"]],
  2: [["college", "College / Department"], ["program", "Program"], ["yearLevel", "Year level"], ["section", "Section (if applicable)", true]],
  3: [["password", "Password", false, "password"], ["confirm", "Confirm password", false, "password"]],
};

export default function SignupPage() {
  const [step, setStep] = useState(0);
  const [d, setD] = useState<Record<string, string>>({ campus: "University of Cebu Lapu-Lapu and Mandaue" });
  const [errs, setErrs] = useState<Record<string, string>>({});
  const [msg, setMsg] = useState("");
  const [pending, start] = useTransition();
  const set = (k: string, v: string) => setD((p) => ({ ...p, [k]: v }));

  function next() {
    const e: Record<string, string> = {};
    if (step === 0 && !UC_ID.test(d.ucId ?? "")) e.ucId = "UC ID must be 8 digits";
    (FIELDS[step] ?? []).forEach(([k, , optional]) => { if (!optional && !d[k]?.trim()) e[k] = "Required"; });
    if (step === 3 && d.consent !== "yes") e.consent = "Please accept the privacy notice";
    setErrs(e);
    if (!Object.keys(e).length) { if (step < 3) setStep(step + 1); else submit(); }
  }
  function submit() {
    start(async () => {
      const r = await signup(d); // redirects to /dashboard on success
      if (r?.error) { setMsg(r.error); setErrs(r.fieldErrors ?? {}); }
    });
  }
  const field = (k: string, label: string, type = "text") => (
    <div key={k}><label className="label" htmlFor={k}>{label}</label>
      <input id={k} type={type} className="input" value={d[k] ?? ""} onChange={(e) => set(k, e.target.value)} />
      {errs[k] && <p className="mt-1 text-xs text-red-600">{errs[k]}</p>}</div>
  );

  return (
    <AuthCard title="Create your account">
      <ol className="mb-5 flex gap-1 text-xs">{STEPS.map((s, i) => (
        <li key={s} className={`flex-1 border-b-2 pb-1 text-center ${i <= step ? "border-uc font-medium text-uc" : "border-uc-line text-uc-muted"}`}>{i + 1}. {s}</li>))}</ol>
      <div className="space-y-4">
        {msg && <p role="alert" className="rounded border border-red-200 bg-red-50 p-2 text-sm text-red-700">{msg}</p>}
        {step === 0 && <>
          {field("ucId", "UC ID Number")}
          <p className="rounded border border-amber-200 bg-amber-50 p-2 text-xs text-amber-800"><b>Demo verification:</b> UCme only checks the ID format. It is not verified against any official University of Cebu database.</p></>}
        {step === 1 && FIELDS[1].map(([k, l, , t]) => field(k, l, t))}
        {step === 2 && <>
          <div><label className="label">Campus</label><select className="input" value={d.campus} onChange={(e) => set("campus", e.target.value)}><option>University of Cebu Lapu-Lapu and Mandaue</option></select></div>
          {FIELDS[2].map(([k, l, , t]) => field(k, l, t))}</>}
        {step === 3 && <>{FIELDS[3].map(([k, l, , t]) => field(k, l, t))}<p className="text-xs text-uc-muted">Minimum 8 characters.</p>
          <label className="flex items-start gap-2 text-xs text-uc-muted">
            <input type="checkbox" className="mt-0.5" checked={d.consent === "yes"} onChange={(e) => set("consent", e.target.checked ? "yes" : "")} />
            <span>I agree that UCme may collect and process my name, UC ID, email, contact number and university details only for lost-and-found coordination, in line with the Data Privacy Act of 2012 (RA 10173). My contact details are never shown on public reports.</span>
          </label>
          {errs.consent && <p className="text-xs text-red-600">{errs.consent}</p>}</>}
        <div className="flex justify-between gap-2">
          <button type="button" className="btn-ghost" disabled={step === 0 || pending} onClick={() => setStep(step - 1)}>Back</button>
          <button type="button" className="btn" disabled={pending} onClick={next}>{step === 3 ? (pending ? "Creating…" : "Create account") : "Continue"}</button></div>
        <p className="text-center text-sm">Already registered? <Link href="/login" className="text-uc hover:underline">Sign in</Link></p>
      </div>
    </AuthCard>
  );
}
