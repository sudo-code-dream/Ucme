"use client";
import { useFormState, useFormStatus } from "react-dom";
import { AccState, changePassword, deleteAccount, updateProfile } from "@/app/actions/account";

function Save({ text }: { text: string }) { const { pending } = useFormStatus(); return <button className="btn" disabled={pending}>{pending ? "Saving…" : text}</button>; }
const Msg = ({ s, ok }: { s: AccState; ok: string }) => s.error ? <p role="alert" className="rounded border border-red-200 bg-red-50 p-2 text-sm text-red-700">{s.error}</p>
  : s.ok ? <p className="rounded border border-green-200 bg-green-50 p-2 text-sm text-green-800">{ok}</p> : null;

type P = { email: string; contact: string; college: string; program: string; yearLevel: string; section: string };
export function ProfileForm({ v }: { v: P }) {
  const [s, action] = useFormState<AccState, FormData>(updateProfile, {});
  const f: [keyof P, string][] = [["email", "Email address"], ["contact", "Contact number"], ["college", "College / Department"], ["program", "Program"], ["yearLevel", "Year level"], ["section", "Section"]];
  return (
    <form action={action} className="space-y-4">
      <Msg s={s} ok="Profile updated." />
      <div className="grid gap-4 sm:grid-cols-2">{f.map(([k, l]) => <div key={k}><label className="label" htmlFor={k}>{l}</label><input id={k} name={k} defaultValue={v[k]} className="input" /></div>)}</div>
      <Save text="Save changes" />
    </form>
  );
}
export function PasswordForm() {
  const [s, action] = useFormState<AccState, FormData>(changePassword, {});
  return (
    <form action={action} className="max-w-sm space-y-3">
      <Msg s={s} ok="Password changed." />
      {[["current", "Current password"], ["next", "New password"], ["confirm", "Confirm new password"]].map(([k, l]) => (
        <div key={k}><label className="label" htmlFor={k}>{l}</label><input id={k} name={k} type="password" className="input" autoComplete={k === "current" ? "current-password" : "new-password"} /></div>))}
      <Save text="Change password" />
    </form>
  );
}

export function DeleteAccountForm() {
  const [s, action] = useFormState<AccState, FormData>(deleteAccount, {});
  return (
    <form action={action} className="max-w-sm space-y-3">
      <Msg s={s} ok="" />
      <div><label className="label" htmlFor="del-password">Password</label><input id="del-password" name="password" type="password" className="input" autoComplete="current-password" /></div>
      <div><label className="label" htmlFor="del-confirm">Type DELETE to confirm</label><input id="del-confirm" name="confirm" className="input" autoComplete="off" /></div>
      <DeleteBtn />
    </form>
  );
}
function DeleteBtn() { const { pending } = useFormStatus(); return <button className="btn !bg-red-600 hover:!bg-red-700" disabled={pending}>{pending ? "Deleting…" : "Delete my account"}</button>; }
