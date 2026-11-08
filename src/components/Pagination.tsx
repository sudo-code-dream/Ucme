import Link from "next/link";

export default function Pagination({ page, total, per, path, params }: { page: number; total: number; per: number; path: string; params: Record<string, string | undefined> }) {
  const pages = Math.max(1, Math.ceil(total / per));
  const href = (p: number) => {
    const q = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => { if (v && k !== "page") q.set(k, v); });
    q.set("page", String(p));
    return `${path}?${q}`;
  };
  return (
    <nav aria-label="Pagination" className="flex flex-wrap items-center justify-between gap-2 text-sm text-uc-muted">
      <span>{total} result{total === 1 ? "" : "s"}{pages > 1 ? ` · page ${Math.min(page, pages)} of ${pages}` : ""}</span>
      {pages > 1 && <div className="flex gap-2">
        {page > 1 && <Link href={href(page - 1)} className="btn-ghost">Previous</Link>}
        {page < pages && <Link href={href(page + 1)} className="btn-ghost">Next</Link>}
      </div>}
    </nav>
  );
}
