import { Bell, Search, ShieldCheck } from "lucide-react";
import Brand from "./Brand";

const POINTS = [
  [Search, "Search items reported across campus"],
  [Bell, "Get notified when a possible match appears"],
  [ShieldCheck, "Private ownership checks keep items safe"],
] as const;

export default function AuthCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <main className="flex min-h-screen">
      <aside className="hidden w-[440px] shrink-0 flex-col justify-between bg-uc-dark p-10 text-white lg:flex">
        <Brand light />
        <div>
          <div className="mb-5 h-1 w-12 rounded bg-uc-gold" />
          <h2 className="mb-6 text-3xl font-bold leading-tight">Lost something on campus?<br />Let&apos;s help you find it.</h2>
          <ul className="space-y-4">{POINTS.map(([Icon, text]) => (
            <li key={text} className="flex items-center gap-3 text-sm text-blue-50"><Icon size={18} className="shrink-0 text-uc-gold" />{text}</li>))}</ul>
        </div>
        <p className="text-xs text-blue-200">Prototype · Not an official University of Cebu system.</p>
      </aside>
      <div className="flex flex-1 flex-col items-center justify-center p-4 sm:p-8">
        <div className="w-full max-w-md">
          <div className="mb-6 flex justify-center lg:hidden"><Brand /></div>
          <div className="card p-6 sm:p-8">
            <h1 className="mb-5 text-xl font-bold text-uc-dark">{title}</h1>
            {children}
          </div>
        </div>
      </div>
    </main>
  );
}
