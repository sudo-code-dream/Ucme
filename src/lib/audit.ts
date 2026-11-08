import { db } from "./db";
export async function logAdmin(admin: { id: string; firstName: string; lastName: string }, action: string, targetType: string, targetId: string, detail?: string) {
  try { await db.auditLog.create({ data: { actorId: admin.id, actorName: `${admin.firstName} ${admin.lastName}`, action, targetType, targetId, detail } }); }
  catch (e) { console.error("audit log failed", e); }
}
