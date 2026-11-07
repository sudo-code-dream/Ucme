"use client";
import Link from "next/link";
import { useFormState, useFormStatus } from "react-dom";
import { login, FormState } from "@/app/actions/auth";
import AuthCard from "@/components/AuthCard";

function Submit() { const { pending } = useFormStatus(); return <button className="btn w-full" disabled={pending}>{pending ? "Signing in…" : "Sign in"}</button>; }

export default function LoginPage() {
  const [state, action] = useFormState<FormState, FormData>(login, {});
  return (
    <AuthCard title="Sign in to your account">
      <form action={action} className="space-y-4">
        {state.error && <p role="alert" className="rounded border border-red-200 bg-red-50 p-2 text-sm text-red-700">{state.error}</p>}
        <div><label className="label" htmlFor="ucId">UC ID Number</label><input id="ucId" name="ucId" className="input" placeholder="8-digit UC ID" inputMode="numeric" maxLength={8} required /></div>
        <div><label className="label" htmlFor="password">Password</label><input id="password" name="password" type="password" className="input" required /></div>
        <Submit />
        <div className="flex justify-between text-sm"><span className="text-uc-muted" title="Not yet implemented">Forgot password?</span><Link href="/signup" className="text-uc hover:underline">Create account</Link></div>
      </form>
    </AuthCard>
  );
}
