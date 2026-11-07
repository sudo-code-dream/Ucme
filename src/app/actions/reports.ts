"use server";
import { randomBytes } from "crypto";
import { revalidatePath } from "next/cache";
import { ZodError } from "zod";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { claimSchema, reportSchema } from "@/lib/report-validation";
import { uploadImage } from "@/lib/cloudinary";
import { findMatches } from "@/lib/matching";

export type ReportState = { error?: string; fieldErrors?: Record<string, string>; ref?: string; ok?: boolean };
const fieldErrs = (e: ZodError) => { const f: Record<string, string> = {}; e.issues.forEach((i) => (f[String(i.path[0])] ??= i.message)); return f; };

export async function createReport(type: "LOST" | "FOUND", _: ReportState, fd: FormData): Promise<ReportState> {
  const user = await requireUser(); // identity always comes from the session, never from the form
  const p = reportSchema.safeParse(Object.fromEntries(fd));
  if (!p.success) return { error: "Please fix the highlighted fields.", fieldErrors: fieldErrs(p.error) };
  if (type === "FOUND" && !p.data.keptAt) return { error: "Please fix the highlighted fields.", fieldErrors: { keptAt: "Tell us where the item is kept" } };
  let photoUrl: string | null = null;
  const photo = fd.get("photo");
  if (photo instanceof File && photo.size > 0) {
    try { photoUrl = await uploadImage(photo); }
    catch (e) { return { error: "Please fix the highlighted fields.", fieldErrors: { photo: e instanceof Error ? e.message : "Upload failed" } }; }
  }
  const ref = `${type === "LOST" ? "LST" : "FND"}-${new Date().toISOString().slice(2, 7).replace("-", "")}-${randomBytes(2).toString("hex").toUpperCase()}`;
  const { occurredOn, keptAt, ...rest } = p.data;
  const created = await db.report.create({ data: { ...rest, photoUrl, ref, type, userId: user.id, occurredOn: new Date(occurredOn), keptAt: type === "FOUND" ? keptAt : null } });
  try { // matching must never block a submission
    const matches = await findMatches(created);
    if (matches.length) {
      await db.notification.create({ data: { userId: user.id, message: `A possible match was found for your ${type === "LOST" ? "lost" : "found"} item (${created.ref}). Check Lost & Found.` } });
      const owners = await db.report.findMany({ where: { id: { in: matches.map((m) => m.id) } }, select: { userId: true, ref: true } });
      await db.notification.createMany({ data: owners.map((o) => ({ userId: o.userId, message: `A possible match was found for your ${type === "LOST" ? "found" : "lost"} item (${o.ref}).` })) });
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
  const p = claimSchema.safeParse(Object.fromEntries(fd));
  if (!p.success) return { error: p.error.issues[0].message };
  const report = await db.report.findUnique({ where: { id: reportId } });
  if (!report || report.type !== "FOUND" || report.status === "RESOLVED" || report.status === "PENDING" || report.hidden) return { error: "This item cannot be claimed." };
  if (report.userId === user.id) return { error: "You cannot claim your own report." };
  if (await db.claim.findFirst({ where: { reportId, claimantId: user.id, status: "PENDING" } })) return { error: "You already have a pending claim for this item." };
  await db.claim.create({ data: { reportId, claimantId: user.id, verification: p.data.verification } });
  await db.notification.create({ data: { userId: report.userId, message: `Someone submitted a claim for your found item (${report.ref}).` } });
  return { ok: true };
}
