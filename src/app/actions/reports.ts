"use server";
import { randomBytes } from "crypto";
import { revalidatePath } from "next/cache";
import { ZodError } from "zod";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { claimSchema, reportSchema } from "@/lib/report-validation";
import { deleteImage, uploadImage } from "@/lib/cloudinary";
import { canEdit } from "@/lib/report-rules";
import { rateLimit } from "@/lib/ratelimit";
import { findMatches } from "@/lib/matching";
import { notify } from "@/lib/notify";

export type ReportState = { error?: string; fieldErrors?: Record<string, string>; ref?: string; ok?: boolean };
const fieldErrs = (e: ZodError) => { const f: Record<string, string> = {}; e.issues.forEach((i) => (f[String(i.path[0])] ??= i.message)); return f; };

export async function createReport(type: "LOST" | "FOUND", _: ReportState, fd: FormData): Promise<ReportState> {
  const user = await requireUser(); // identity always comes from the session, never from the form
  if (!user.emailVerified) return { error: "Please verify your email before submitting a report. Use the banner at the top of the page." };
  if (!(await rateLimit(`report:${user.id}`, 10, 3_600_000))) return { error: "You've submitted several reports recently. Please try again in a while." };
  const p = reportSchema.safeParse(Object.fromEntries(fd));
  if (!p.success) return { error: "Please fix the highlighted fields.", fieldErrors: fieldErrs(p.error) };
  let photoUrl: string | null = null;
  const photo = fd.get("photo");
  if (photo instanceof File && photo.size > 0) {
    try { photoUrl = await uploadImage(photo); }
    catch (e) { return { error: "Please fix the highlighted fields.", fieldErrors: { photo: e instanceof Error ? e.message : "Upload failed" } }; }
  }
  const ref = `${type === "LOST" ? "LST" : "FND"}-${new Date().toISOString().slice(2, 7).replace("-", "")}-${randomBytes(2).toString("hex").toUpperCase()}`;
  const { occurredOn, keptAt, ...rest } = p.data;
  const created = await db.report.create({ data: { ...rest, photoUrl, ref, type, userId: user.id, occurredOn: new Date(occurredOn), keptAt: type === "FOUND" ? "Prefect of Discipline Office" : null, status: type === "FOUND" ? "PENDING" : "ACTIVE" } });
  if (type === "FOUND") await db.notification.create({ data: { userId: user.id, message: `Please bring your found item (${created.ref}) to the Prefect of Discipline Office. It will be listed once staff confirm receipt.` } });
  try { // matching must never block a submission
    const matches = type === "LOST" ? await findMatches(created) : []; // found items are matched once the office confirms receipt
    if (matches.length) {
      await db.notification.create({ data: { userId: user.id, message: `A possible match was found for your ${type === "LOST" ? "lost" : "found"} item (${created.ref}). Check Lost & Found.` } });
      const owners = await db.report.findMany({ where: { id: { in: matches.map((m) => m.id) } }, select: { userId: true, ref: true } });
      await notify(owners.map((o) => ({ userId: o.userId, email: true, message: `A possible match was found for your ${type === "LOST" ? "found" : "lost"} item (${o.ref}).` })));
    }
  } catch {}
  revalidatePath("/dashboard");
  return { ok: true, ref };
}

export async function toggleSave(reportId: string): Promise<void> {
  const user = await requireUser();
  const key = { userId_reportId: { userId: user.id, reportId } };
  if (await db.savedItem.findUnique({ where: key })) await db.savedItem.delete({ where: key });
  else if (await db.report.findUnique({ where: { id: reportId }, select: { id: true } })) await db.savedItem.create({ data: { userId: user.id, reportId } });
  revalidatePath(`/lost-and-found/${reportId}`);
}

export async function submitClaim(reportId: string, _: ReportState, fd: FormData): Promise<ReportState> {
  const user = await requireUser();
  if (!user.emailVerified) return { error: "Please verify your email before submitting a claim." };
  if (!(await rateLimit(`claim:${user.id}`, 5, 3_600_000))) return { error: "You've submitted several claims recently. Please try again in a while." };
  const p = claimSchema.safeParse(Object.fromEntries(fd));
  if (!p.success) return { error: p.error.issues[0].message };
  const report = await db.report.findUnique({ where: { id: reportId } });
  if (!report || report.type !== "FOUND" || report.status !== "ACTIVE" || report.hidden) return { error: "This item cannot be claimed." };
  if (report.userId === user.id) return { error: "You cannot claim your own report." };
  if (await db.claim.findFirst({ where: { reportId, claimantId: user.id, status: "PENDING" } })) return { error: "You already have a pending claim for this item." };
  await db.claim.create({ data: { reportId, claimantId: user.id, verification: p.data.verification } });
  return { ok: true };
}

/** Owner-only edit. Status, reference, owner and (for found items) the kept-at location never change here. */
export async function updateReport(reportId: string, _: ReportState, fd: FormData): Promise<ReportState> {
  const user = await requireUser();
  const r = await db.report.findUnique({ where: { id: reportId }, include: { _count: { select: { claims: true } } } });
  if (!r || r.userId !== user.id) return { error: "Report not found." };
  if (!canEdit({ status: r.status, claimCount: r._count.claims })) return { error: "This report can no longer be edited." };
  const p = reportSchema.safeParse(Object.fromEntries(fd));
  if (!p.success) return { error: "Please fix the highlighted fields.", fieldErrors: fieldErrs(p.error) };

  let photoUrl = r.photoUrl;
  const photo = fd.get("photo");
  if (photo instanceof File && photo.size > 0) {
    try { photoUrl = await uploadImage(photo); }
    catch (e) { return { error: "Please fix the highlighted fields.", fieldErrors: { photo: e instanceof Error ? e.message : "Upload failed" } }; }
  } else if (fd.get("removePhoto") === "on") photoUrl = null;

  const { occurredOn, keptAt, ...rest } = p.data;
  await db.report.update({ where: { id: reportId }, data: { ...rest, photoUrl, occurredOn: new Date(occurredOn) } });
  if (r.photoUrl && r.photoUrl !== photoUrl) await deleteImage(r.photoUrl).catch(() => {});
  revalidatePath("/my-reports"); revalidatePath(`/lost-and-found/${reportId}`); revalidatePath("/dashboard");
  return { ok: true, ref: r.ref };
}
