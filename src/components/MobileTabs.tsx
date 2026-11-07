"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, FileText, LayoutDashboard, Plus, Search } from "lucide-react";

const TABS = [
  { href: "/dashboard", label: "Home", Icon: LayoutDashboard }, { href: "/lost-and-found", label: "Browse", Icon: Search },
  { href: "/report/lost", label: "Report", Icon: Plus }, { href: "/my-reports", label: "Mine", Icon: FileText }, { href: "/notifications", label: "Alerts", Icon: Bell },
];

/** App-style bottom navigation, shown on phones only. */
export default function MobileTabs({ unread }: { unread: number }) {
  const path = usePathname();
  return (
    <nav aria-label="Primary" className="fixed inset-x-0 bottom-0 z-30 flex border-t border-uc-line bg-white pb-[env(safe-area-inset-bottom)] md:hidden">
      {TABS.map(({ href, label, Icon }) => {
        const center = href === "/report/lost";
        const active = !center && (path === href || (href !== "/dashboard" && path.startsWith(href)));
        return (
          <Link key={href} href={href} aria-current={active ? "page" : undefined} className="relative flex flex-1 flex-col items-center justify-center gap-0.5 py-2 text-[11px]">
            {center
              ? <span className="-mt-5 flex h-12 w-12 items-center justify-center rounded-full bg-uc-gold text-uc-dark shadow-md"><Icon size={24} strokeWidth={2.5} /></span>
              : <Icon size={22} className={active ? "text-uc" : "text-uc-muted"} />}
            <span className={active ? "font-semibold text-uc" : "text-uc-muted"}>{label}</span>
            {href === "/notifications" && unread > 0 && <span className="absolute right-[28%] top-1.5 h-2.5 w-2.5 rounded-full border-2 border-white bg-red-600" />}
          </Link>
        );
      })}
    </nav>
  );
}
