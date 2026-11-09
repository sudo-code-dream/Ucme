"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Bell } from "lucide-react";
import { getRecentNotifications } from "@/app/actions/notifications";
import { markAllRead } from "@/app/actions/manage";

type Item = { id: string; message: string; read: boolean; reportId: string | null; createdAt: string };

const ago = (iso: string) => {
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)} min ago`;
  if (s < 86400) return `${Math.floor(s / 3600)} h ago`;
  if (s < 604800) return `${Math.floor(s / 86400)} d ago`;
  return new Date(iso).toLocaleDateString("en-PH", { month: "short", day: "numeric" });
};

export default function NotificationBell({ unread }: { unread: number }) {
  const path = usePathname();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<Item[] | null>(null);
  const [count, setCount] = useState(unread);
  const [error, setError] = useState(false);

  useEffect(() => setCount(unread), [unread]);
  useEffect(() => setOpen(false), [path]);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  async function toggle() {
    const next = !open;
    setOpen(next);
    if (!next) return;
    setError(false);
    try { const r = await getRecentNotifications(); setItems(r.items); setCount(r.unread); }
    catch { setError(true); }
  }
  async function readAll() {
    await markAllRead();
    setItems((cur) => cur && cur.map((i) => ({ ...i, read: true })));
    setCount(0);
  }

  return (
    <div className="relative">
      <button onClick={toggle} aria-label={`Notifications${count ? `, ${count} unread` : ""}`} aria-expanded={open} aria-haspopup="true" className="relative rounded-md p-2 text-uc-muted hover:bg-uc-bg">
        <Bell size={20} />
        {count > 0 && <span className="absolute right-0.5 top-0.5 h-2.5 w-2.5 rounded-full border-2 border-white bg-red-600" />}
      </button>
      {open && <>
        <button aria-label="Close notifications" className="fixed inset-0 z-10 cursor-default" onClick={() => setOpen(false)} />
        <div className="card fixed inset-x-3 top-16 z-20 sm:absolute sm:inset-x-auto sm:right-0 sm:top-auto sm:mt-2 sm:w-96">
          <div className="flex items-center justify-between border-b border-uc-line px-4 py-3">
            <h2 className="font-bold text-uc-dark">Notifications{count > 0 && <span className="ml-2 rounded-full bg-uc-gold px-2 text-xs font-bold text-uc-dark">{count}</span>}</h2>
            {count > 0 && <button onClick={readAll} className="text-xs font-semibold text-uc hover:underline">Mark all as read</button>}
          </div>
          <div className="max-h-96 overflow-y-auto">
            {error && <p className="p-6 text-center text-sm text-red-600">Couldn&apos;t load notifications. Try again.</p>}
            {!error && items === null && <p className="p-6 text-center text-sm text-uc-muted">Loading…</p>}
            {!error && items?.length === 0 && <p className="p-6 text-center text-sm text-uc-muted">No notifications yet.</p>}
            {!error && items && items.length > 0 && (
              <ul className="divide-y divide-uc-line">{items.map((n) => (
                <li key={n.id}><a href={n.reportId ? `/api/notifications/${n.id}` : "/notifications"} className={`flex gap-3 px-4 py-3 text-sm hover:bg-uc-bg ${n.read ? "" : "bg-blue-50/60"}`}>
                  <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${n.read ? "bg-transparent" : "bg-uc"}`} />
                  <div><p>{n.message}</p><p className="text-xs text-uc-muted">{ago(n.createdAt)}</p></div>
                </a></li>))}</ul>)}
          </div>
          <Link href="/notifications" onClick={() => setOpen(false)} className="block border-t border-uc-line px-4 py-3 text-center text-sm font-semibold text-uc hover:bg-uc-bg">View all notifications</Link>
        </div>
      </>}
    </div>
  );
}
