import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { markAllRead } from "@/app/actions/manage";

export default async function Notifications() {
  const user = await requireUser();
  const list = await db.notification.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" }, take: 50 });
  return (
    <div className="max-w-3xl space-y-4">
      <div className="flex items-center justify-between"><h1 className="page-title">Notifications</h1>
        {list.some((n) => !n.read) && <form action={markAllRead}><button className="btn-ghost">Mark all as read</button></form>}</div>
      <div className="card divide-y divide-uc-line">
        {list.length === 0 && <p className="p-10 text-center text-sm text-uc-muted">No notifications yet.</p>}
        {list.map((n) => (
          <div key={n.id} className={`flex gap-3 p-4 text-sm ${n.read ? "" : "bg-blue-50/60"}`}>
            <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${n.read ? "bg-transparent" : "bg-uc"}`} />
            <div><p>{n.message}</p><p className="text-xs text-uc-muted">{n.createdAt.toLocaleString("en-PH", { dateStyle: "medium", timeStyle: "short" })}</p></div>
          </div>))}
      </div>
    </div>
  );
}
