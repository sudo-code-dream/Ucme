import Link from "next/link";
import { db } from "@/lib/db";
import { maskUcId, requireAdmin } from "@/lib/auth";
import { suspendUser, unsuspendUser } from "@/app/actions/users";

export default async function Users({ searchParams }: { searchParams: { q?: string } }) {
  await requireAdmin();
  const q = (searchParams.q ?? "").trim().slice(0, 40);
  const users = await db.user.findMany({
    where: q ? { OR: [{ ucId: q }, { firstName: { contains: q, mode: "insensitive" } }, { lastName: { contains: q, mode: "insensitive" } }] } : {},
    orderBy: { createdAt: "desc" }, take: 30,
    select: { id: true, firstName: true, lastName: true, ucId: true, role: true, emailVerified: true, suspendedAt: true, suspendedReason: true, _count: { select: { reports: true } } },
  });
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2"><h1 className="page-title">Users</h1><Link href="/admin" className="text-sm font-semibold text-uc hover:underline">← Moderation</Link></div>
      <form className="flex gap-2"><input name="q" defaultValue={q} placeholder="Name or exact UC ID" className="input max-w-sm" /><button className="btn">Search</button></form>
      <div className="card divide-y divide-uc-line">
        {users.length === 0 && <p className="p-6 text-center text-sm text-uc-muted">No users found.</p>}
        {users.map((u) => (
          <div key={u.id} className="flex flex-wrap items-start gap-3 p-4 text-sm">
            <div className="min-w-0 flex-1"><p className="font-semibold">{u.firstName} {u.lastName} <span className="text-xs font-normal text-uc-muted">{maskUcId(u.ucId)} · {u._count.reports} reports · {u.emailVerified ? "verified" : "unverified"}{u.role === "ADMIN" ? " · staff" : ""}</span></p>
              {u.suspendedAt && <p className="text-red-700">Suspended: {u.suspendedReason}</p>}</div>
            {u.role !== "ADMIN" && (u.suspendedAt
              ? <form action={unsuspendUser.bind(null, u.id)}><button className="btn-ghost">Unsuspend</button></form>
              : <details><summary className="cursor-pointer text-red-600 hover:underline">Suspend</summary>
                  <form action={suspendUser.bind(null, u.id)} className="mt-2 flex gap-2"><input name="reason" required minLength={5} maxLength={200} placeholder="Reason (required)" className="input" /><button className="btn !bg-red-600 hover:!bg-red-700">Confirm</button></form></details>)}
          </div>))}
      </div>
    </div>
  );
}
