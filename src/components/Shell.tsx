"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Bell, Bookmark, ChevronDown, FileText, LayoutDashboard, LogOut, Menu, Search, Settings, Shield, User, X } from "lucide-react";
import { logout } from "@/app/actions/auth";
import Brand from "./Brand";
import MobileTabs from "./MobileTabs";

type Item = { href: string; label: string; Icon: typeof Bell };
const MAIN: Item[] = [
  { href: "/dashboard", label: "Dashboard", Icon: LayoutDashboard }, { href: "/lost-and-found", label: "Lost & Found", Icon: Search },
  { href: "/my-reports", label: "My Reports", Icon: FileText }, { href: "/saved", label: "Saved Items", Icon: Bookmark },
];
const ACCOUNT: Item[] = [
  { href: "/notifications", label: "Notifications", Icon: Bell }, { href: "/profile", label: "My Profile", Icon: User }, { href: "/settings", label: "Settings", Icon: Settings },
];
type Props = { isAdmin: boolean; name: string; initials: string; maskedId: string; unread: number; children: React.ReactNode };

export default function Shell({ isAdmin, name, initials, maskedId, unread, children }: Props) {
  const path = usePathname();
  const [open, setOpen] = useState(false);
  const [menu, setMenu] = useState(false);

  const group = (label: string, items: Item[]) => (
    <div className="mb-2">
      <p className="px-5 pb-1 pt-4 text-[11px] font-semibold uppercase tracking-widest text-blue-200/60">{label}</p>
      {items.map(({ href, label: l, Icon }) => {
        const active = path === href || (href !== "/dashboard" && path.startsWith(href));
        return (
          <Link key={href} href={href} onClick={() => setOpen(false)} aria-current={active ? "page" : undefined}
            className={`flex items-center gap-3 border-l-4 px-4 py-2.5 text-sm ${active ? "border-uc-gold bg-white/10 font-semibold text-white" : "border-transparent text-blue-100/80 hover:bg-white/5 hover:text-white"}`}>
            <Icon size={18} />{l}
            {href === "/notifications" && unread > 0 && <span className="ml-auto rounded-full bg-uc-gold px-1.5 text-[11px] font-bold text-uc-dark">{unread}</span>}
          </Link>
        );
      })}
    </div>
  );

  return (
    <div className="min-h-screen">
      <header className="fixed left-0 right-0 top-0 z-30 flex h-14 items-center gap-3 border-b border-uc-line bg-white px-4 md:left-64">
        <button className="md:hidden" aria-label="Open menu" onClick={() => setOpen(true)}><Menu /></button>
        <form action="/lost-and-found" className="relative max-w-md flex-1">
          <Search size={16} className="absolute left-3 top-2.5 text-uc-muted" />
          <input name="q" placeholder="Search lost &amp; found items…" aria-label="Search items" className="input bg-uc-bg pl-9" />
        </form>
        <div className="ml-auto flex items-center gap-3">
          <Link href="/notifications" aria-label="Notifications" className="relative rounded-md p-2 text-uc-muted hover:bg-uc-bg">
            <Bell size={20} />{unread > 0 && <span className="absolute right-0.5 top-0.5 h-2.5 w-2.5 rounded-full border-2 border-white bg-red-600" />}
          </Link>
          <div className="relative">
            <button className="flex items-center gap-2 rounded-md p-1 hover:bg-uc-bg" onClick={() => setMenu(!menu)} aria-expanded={menu}>
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-uc text-xs font-bold text-white">{initials}</span>
              <span className="hidden text-left text-sm leading-tight sm:block"><span className="font-semibold">{name}</span><span className="block text-[11px] text-uc-muted">{maskedId}</span></span>
              <ChevronDown size={14} className="text-uc-muted" />
            </button>
            {menu && <>
              <button aria-label="Close menu" className="fixed inset-0 z-10 cursor-default" onClick={() => setMenu(false)} />
              <div className="card absolute right-0 z-20 mt-2 w-44 py-1 text-sm">
                <Link className="block px-3 py-2 hover:bg-uc-bg" href="/profile" onClick={() => setMenu(false)}>My Profile</Link>
                <Link className="block px-3 py-2 hover:bg-uc-bg" href="/settings" onClick={() => setMenu(false)}>Settings</Link>
                <form action={logout}><button className="w-full border-t border-uc-line px-3 py-2 text-left hover:bg-uc-bg">Logout</button></form>
              </div></>}
          </div>
        </div>
      </header>

      {open && <button aria-label="Close navigation" className="fixed inset-0 z-30 bg-black/40 md:hidden" onClick={() => setOpen(false)} />}
      <aside className={`fixed inset-y-0 left-0 z-40 w-64 flex-col bg-uc-dark ${open ? "flex" : "hidden"} md:flex`}>
        <div className="flex items-center justify-between px-5 py-4">
          <Link href="/dashboard" onClick={() => setOpen(false)}><Brand light /></Link>
          <button className="text-white md:hidden" aria-label="Close menu" onClick={() => setOpen(false)}><X size={20} /></button>
        </div>
        <nav className="flex-1 overflow-y-auto">{group("Menu", MAIN)}{group("Account", isAdmin ? [...ACCOUNT, { href: "/admin", label: "Admin", Icon: Shield }] : ACCOUNT)}</nav>
        <form action={logout} className="border-t border-white/10 p-3">
          <button className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm text-blue-100/80 hover:bg-white/5 hover:text-white"><LogOut size={18} />Logout</button>
        </form>
      </aside>

      <main className="px-4 pb-28 pt-20 md:ml-64 md:px-8 md:pb-10"><div className="mx-auto max-w-6xl">{children}</div></main>
      <MobileTabs unread={unread} />
    </div>
  );
}
