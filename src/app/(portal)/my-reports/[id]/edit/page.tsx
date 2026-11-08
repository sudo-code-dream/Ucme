import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { canEdit } from "@/lib/report-rules";
import ReportForm from "@/components/ReportForm";

export default async function EditReport({ params }: { params: { id: string } }) {
  const user = await requireUser();
  const r = await db.report.findUnique({ where: { id: params.id }, include: { _count: { select: { claims: true } } } });
  if (!r || r.userId !== user.id) notFound(); // never reveal other people's reports
  const editable = canEdit({ status: r.status, claimCount: r._count.claims });
  return (
    <div className="max-w-3xl space-y-4">
      <div><h1 className="page-title">Edit {r.type === "LOST" ? "lost" : "found"} report</h1><p className="text-sm text-uc-muted">{r.ref}</p></div>
      {editable
        ? <ReportForm type={r.type} edit={{ id: r.id, photoUrl: r.photoUrl, values: { title: r.title, category: r.category, location: r.location, occurredOn: r.occurredOn.toISOString().slice(0, 10), approxTime: r.approxTime ?? "", description: r.description, features: r.features } }} />
        : <div className="card p-6 text-sm"><p className="mb-3">This report can no longer be edited, because it has been matched, resolved, expired, or someone has made a claim on it.</p><Link href="/my-reports" className="btn">Back to My Reports</Link></div>}
    </div>
  );
}
