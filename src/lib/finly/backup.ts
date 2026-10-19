import { getLesson } from "./curriculum";
import { GOALS } from "./plan";

// Device backup of learning data. Only Finly learning keys — never auth tokens or secrets.
export const BACKUP_KEYS = { progress: "finly.progress.v1", plan: "finly.plan.v1", lastLesson: "finly.last-opened-lesson" } as const;

type Obj = Record<string, unknown>;
const isObj = (v: unknown): v is Obj => typeof v === "object" && v !== null && !Array.isArray(v);
const num = (v: unknown, max: number) => (typeof v === "number" && Number.isFinite(v) ? Math.max(0, Math.min(max, Math.round(v))) : 0);

export type Backup = { app: "finly"; version: 1; exportedAt: string; progress: Obj | null; plan: Obj | null };

export function parseBackup(text: string): { ok: true; data: Backup; lessonCount: number } | { ok: false; error: string } {
  let raw: unknown;
  try { raw = JSON.parse(text); } catch { return { ok: false, error: "This file is not valid JSON." }; }
  if (!isObj(raw) || raw.app !== "finly" || raw.version !== 1) return { ok: false, error: "This is not a Finly backup file (version 1)." };
  let progress: Obj | null = null;
  if (raw.progress != null) {
    const p = raw.progress;
    if (!isObj(p) || !isObj(p.lessons)) return { ok: false, error: "The progress section is damaged." };
    const lessons: Obj = {};
    for (const [id, r] of Object.entries(p.lessons)) {
      if (!getLesson(id) || !isObj(r)) continue;
      const total = num(r.total, 100);
      lessons[id] = { correct: Math.min(num(r.correct, 100), total), total, xp: num(r.xp, 1000), completedAt: typeof r.completedAt === "string" && !Number.isNaN(Date.parse(r.completedAt)) ? r.completedAt : new Date().toISOString() };
    }
    const strs = (v: unknown) => (Array.isArray(v) ? v.filter((x): x is string => typeof x === "string" && x.length < 80).slice(0, 500) : []);
    const s = isObj(p.streak) ? p.streak : {};
    progress = {
      xp: num(p.xp, 1_000_000),
      lessons,
      challenges: strs(p.challenges).filter((id) => getLesson(id)),
      achievements: strs(p.achievements),
      streak: { count: num(s.count, 10000), best: num(s.best, 10000), lastDay: typeof s.lastDay === "string" && /^\d{4}-\d{2}-\d{2}$/.test(s.lastDay) ? s.lastDay : null },
      country: ["US", "GB", "UZ"].includes(p.country as string) ? p.country : "US",
      language: "en",
    };
  }
  let plan: Obj | null = null;
  if (raw.plan != null) {
    const p = raw.plan;
    if (!isObj(p) || !GOALS.some((g) => g.id === p.goal) || !["new", "some", "confident"].includes(p.experience as string))
      return { ok: false, error: "The plan section is damaged." };
    plan = { goal: p.goal, experience: p.experience, weeklyTarget: Math.max(1, Math.min(14, num(p.weeklyTarget, 14))), updatedAt: new Date().toISOString() };
  }
  if (!progress && !plan) return { ok: false, error: "The file has no progress or plan to restore." };
  return { ok: true, data: { app: "finly", version: 1, exportedAt: String(raw.exportedAt ?? ""), progress, plan }, lessonCount: progress ? Object.keys(progress.lessons as Obj).length : 0 };
}
