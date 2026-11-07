import { db } from "./db";

type Subject = { id: string; type: "LOST" | "FOUND"; title: string; category: string; location: string; occurredOn: Date; userId: string };
const DAY = 86_400_000;
const words = (s: string) => new Set(s.toLowerCase().split(/[^a-z0-9]+/).filter((w) => w.length > 2));

/**
 * Simple heuristic: opposite type, same category, active, someone else's report, dates within 14 days.
 * Score = same location (2) + up to 2 shared title words (2 each). Needs score >= 3.
 * Uses public fields only; never touches distinctive features.
 */
export async function findMatches(r: Subject) {
  const pool = await db.report.findMany({
    where: { type: r.type === "LOST" ? "FOUND" : "LOST", status: "ACTIVE", hidden: false, category: r.category, userId: { not: r.userId },
      occurredOn: { gte: new Date(r.occurredOn.getTime() - 14 * DAY), lte: new Date(r.occurredOn.getTime() + 14 * DAY) } },
    select: { id: true, ref: true, type: true, title: true, location: true, occurredOn: true }, take: 50,
  });
  const mine = words(r.title);
  return pool
    .map((c) => ({ c, score: (c.location === r.location ? 2 : 0) + Math.min([...words(c.title)].filter((w) => mine.has(w)).length, 2) * 2 }))
    .filter((x) => x.score >= 3)
    .sort((a, b) => b.score - a.score).slice(0, 5).map((x) => x.c);
}

export async function countPossibleMatches(userId: string) {
  const mine = await db.report.findMany({ where: { userId, status: "ACTIVE" }, take: 20,
    select: { id: true, type: true, title: true, category: true, location: true, occurredOn: true, userId: true } });
  const ids = new Set<string>();
  for (const r of mine) (await findMatches(r)).forEach((m) => ids.add(m.id));
  return ids.size;
}
