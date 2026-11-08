import Link from "next/link";
export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <div className="card max-w-md p-8 text-center">
        <p className="text-sm font-semibold uppercase tracking-widest text-uc-gold">404</p>
        <h1 className="mt-1 text-2xl font-bold text-uc-dark">Page not found</h1>
        <p className="my-3 text-sm text-uc-muted">The page you&apos;re looking for doesn&apos;t exist, or you don&apos;t have access to it.</p>
        <Link href="/dashboard" className="btn">Go to dashboard</Link>
      </div>
    </main>
  );
}
