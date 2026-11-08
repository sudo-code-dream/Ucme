// One place for "who may do what to a report", used by both the pages and the server actions.
/** Editable while pending/active, and only if nobody has made a claim (so claim answers can't be gamed). */
export const canEdit = (r: { status: string; claimCount: number }) => ["PENDING", "ACTIVE"].includes(r.status) && r.claimCount === 0;
/** Not while an approved claim awaits pickup. Resolved found items stay on record with the office. */
export const canDelete = (r: { status: string; type: string }) => ["PENDING", "ACTIVE", "EXPIRED"].includes(r.status) || (r.type === "LOST" && r.status === "RESOLVED");
