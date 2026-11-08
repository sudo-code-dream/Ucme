"use client";
import Link from "next/link";
import { useFormState, useFormStatus } from "react-dom";
import { forgotPassword, resendVerification, resetPassword, RecState } from "@/app/actions/recovery";

const Err = ({ s }: { s: RecState }) => s.error ? <p role="alert" className="rounded-md border border-red-200 bg-red-50 p-2 text-sm text-red-700">{s.error}</p> : null;
function Btn({ text }: { text: string }) { const { pending } = useFormStatus(); return <button className="btn w-full" disabled={pending}>{pending ? "Please wait…" : text}</button>; }

export function ForgotForm() {
  const [s, action] = useFormState<RecState, FormData>(forgotPassword, {});
  if (s.ok) return <p className="text-sm">If an account exists for that email, we&apos;ve sent a reset link. It expires in 1 hour. <Link href="/login" className="text-uc hover:underline">Back to sign in</Link></p>;
  return (
    <form action={action} className="space-y-4">
      <Err s={s} /><p className="text-sm text-uc-muted">Enter the email you registered with and we&apos;ll send you a link.</p>
      <div><label className="label" htmlFor="email">Email address</label><input id="email" name="email" type="email" className="input" required /></div>
      <Btn text="Send reset link" /><p className="text-center text-sm"><Link href="/login" className="text-uc hover:underline">Back to sign in</Link></p>
    </form>
  );
}
export function ResetForm({ token }: { token: string }) {
  const [s, action] = useFormState<RecState, FormData>(resetPassword.bind(null, token), {});
  if (s.ok) return <p className="text-sm">Your password was changed. <Link href="/login" className="font-semibold text-uc hover:underline">Sign in</Link></p>;
  return (
    <form action={action} className="space-y-4">
      <Err s={s} />
      {["password", "confirm"].map((k) => <div key={k}><label className="label" htmlFor={k}>{k === "password" ? "New password" : "Confirm new password"}</label><input id={k} name={k} type="password" className="input" autoComplete="new-password" /></div>)}
      <Btn text="Change password" />
    </form>
  );
}
export function ResendButton() {
  const [s, action] = useFormState<RecState, FormData>(async () => resendVerification(), {});
  return (
    <form action={action} className="flex flex-wrap items-center gap-2">
      <button className="font-semibold underline">Resend email</button>
      {s.ok && <span>Sent. Check your inbox.</span>}{s.error && <span>{s.error}</span>}
    </form>
  );
}
