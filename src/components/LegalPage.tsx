import Link from "next/link";
import Brand from "./Brand";
import { LEGAL } from "@/lib/legal";

export function Sec({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-7">
      <h2 className="text-lg font-bold text-uc-dark">{title}</h2>
      <div className="mt-2 space-y-2 text-sm leading-relaxed [&_ul]:list-disc [&_ul]:space-y-1 [&_ul]:pl-5">{children}</div>
    </section>
  );
}

export default function LegalPage({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <main className="min-h-screen px-4 py-8">
      <div className="mx-auto max-w-3xl">
        <div className="mb-6 flex items-center justify-between"><Brand /><Link href="/" className="text-sm font-semibold text-uc hover:underline">← Back to UCme</Link></div>
        <article className="card p-6 sm:p-8">
          <h1 className="page-title">{title}</h1>
          <p className="mt-1 text-xs text-uc-muted">Last updated: {LEGAL.updated}</p>
          {!LEGAL.reviewed && (
            <p className="mt-4 rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900"><b>Draft.</b> This text has not yet been reviewed by the university&apos;s Data Protection Officer or legal office. It is not legal advice, and items in [brackets] still need to be filled in.</p>
          )}
          {children}
        </article>
        <p className="mt-4 text-center text-xs text-uc-muted"><Link href="/privacy" className="hover:underline">Privacy Notice</Link> · <Link href="/terms" className="hover:underline">Terms of Use</Link></p>
      </div>
    </main>
  );
}
