"use client";
import Link from "next/link";

// The error text is intentionally not shown to users; details stay in the server logs.
export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <div className="card max-w-md p-8 text-center">
        <h1 className="text-2xl font-bold text-uc-dark">Something went wrong</h1>
        <p className="my-3 text-sm text-uc-muted">We couldn&apos;t load this page. Please try again. If it keeps happening, tell the office.</p>
        <div className="flex justify-center gap-2"><button className="btn" onClick={reset}>Try again</button><Link href="/dashboard" className="btn-ghost">Dashboard</Link></div>
      </div>
    </main>
  );
}
