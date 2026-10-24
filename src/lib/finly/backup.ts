import { getLesson } from "./curriculum";
import { GOALS, type Plan } from "./plan";
import type { LessonResult, ProgressState } from "./progress";
import type { CountryCode } from "./types";

// Device backup of learning data. Only Cashloria learning keys — never auth tokens or secrets.
export const BACKUP_KEYS = { progress: "finly.progress.v1", plan: "finly.plan.v1", lastLesson: "finly.last-opened-lesson" } as const;

// Untrusted JSON is read with bracket access (tsconfig: noPropertyAccessFromIndexSignature) and
// rebuilt field by field into the app's real types, so a mismatch with ProgressState/Plan fails to compile.
type Obj = Record<string, unknown>;
const isObj = (v: unknown): v is Obj => typeof v === "object" && v !== null && !Array.isArray(v);
const num = (v: unknown, max: number) => (typeof v === "number" && Number.isFinite(v) ? Math.max(0, Math.min(max, Math.round(v))) : 0);

const COUNTRIES = ["US", "GB", "UZ"] as const satisfies readonly CountryCode[];
const EXPERIENCES = ["new", "some", "confident"] as const satisfies readonly Plan["experience"][];

export type Backup = { app: "finly"; version: 1; exportedAt: string; progress: ProgressState | null; plan: Plan | null };

export function parseBackup(text: string): { ok: true; data: Backup; lessonCount: number } | { ok: false; error: string } {
  let raw: unknown;
  try { raw = JSON.parse(text); } catch { return { ok: false, error: "This file is not valid JSON." }; }
  if (!isObj(raw) || raw["app"] !== "finly" || raw["version"] !== 1) return { ok: false, error: "This is not a Cashloria backup file (version 1)." };

  let progress: ProgressState | null = null;
  const rawProgress = raw["progress"];
  if (rawProgress != null) {
    const damaged = { ok: false, error: "The progress section is damaged." } as const;
    if (!isObj(rawProgress)) return damaged;
    const rawLessons = rawProgress["lessons"];
    if (!isObj(rawLessons)) return damaged;
    const lessons: Record<string, LessonResult> = {};
    for (const [id, r] of Object.entries(rawLessons)) {
      if (!getLesson(id) || !isObj(r)) continue;
      const total = num(r["total"], 100);
      const completedAt = r["completedAt"];
      lessons[id] = {
        correct: Math.min(num(r["correct"], 100), total),
        total,
        xp: num(r["xp"], 1000),
        completedAt: typeof completedAt === "string" && !Number.isNaN(Date.parse(completedAt)) ? completedAt : new Date().toISOString(),
      };
    }
    const strs = (v: unknown) => (Array.isArray(v) ? v.filter((x): x is string => typeof x === "string" && x.length < 80).slice(0, 500) : []);
    const rawStreak = rawProgress["streak"];
    const s: Obj = isObj(rawStreak) ? rawStreak : {};
    const lastDay = s["lastDay"];
    progress = {
      xp: num(rawProgress["xp"], 1_000_000),
      lessons,
      challenges: strs(rawProgress["challenges"]).filter((id) => getLesson(id)),
      achievements: strs(rawProgress["achievements"]),
      streak: { count: num(s["count"], 10000), best: num(s["best"], 10000), lastDay: typeof lastDay === "string" && /^\d{4}-\d{2}-\d{2}$/.test(lastDay) ? lastDay : null },
      country: COUNTRIES.find((c) => c === rawProgress["country"]) ?? "US",
      language: "en",
    };
  }

  let plan: Plan | null = null;
  const rawPlan = raw["plan"];
  if (rawPlan != null) {
    const damaged = { ok: false, error: "The plan section is damaged." } as const;
    if (!isObj(rawPlan)) return damaged;
    const goal = GOALS.find((g) => g.id === rawPlan["goal"])?.id;
    const experience = EXPERIENCES.find((e) => e === rawPlan["experience"]);
    if (!goal || !experience) return damaged;
    plan = { goal, experience, weeklyTarget: Math.max(1, Math.min(14, num(rawPlan["weeklyTarget"], 14))), updatedAt: new Date().toISOString() };
  }

  if (!progress && !plan) return { ok: false, error: "The file has no progress or plan to restore." };
  return { ok: true, data: { app: "finly", version: 1, exportedAt: String(raw["exportedAt"] ?? ""), progress, plan }, lessonCount: progress ? Object.keys(progress.lessons).length : 0 };
}
