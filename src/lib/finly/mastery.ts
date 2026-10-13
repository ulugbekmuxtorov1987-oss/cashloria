import { ALL_LESSONS, CATEGORIES } from "./curriculum";
import type { CategoryId, Lesson } from "./types";
import type { ProgressState } from "./progress";

export type Mastery = "not-started" | "learning" | "mastered";

/** Mastered = best quiz score of at least 80%. Derived only from real results. */
export const MASTERY_THRESHOLD = 0.8;

export const MASTERY_LABEL: Record<Mastery, string> = {
  "not-started": "Not started",
  learning: "Learning",
  mastered: "Mastered",
};

export function lessonMastery(state: ProgressState, lessonId: string): Mastery {
  const r = state.lessons[lessonId];
  if (!r) return "not-started";
  return r.total > 0 && r.correct / r.total >= MASTERY_THRESHOLD ? "mastered" : "learning";
}

export function topicMastery(state: ProgressState) {
  return CATEGORIES.map((c) => {
    const lessons = ALL_LESSONS.filter((l) => l.category === c.id);
    const counts = { "not-started": 0, learning: 0, mastered: 0 } as Record<Mastery, number>;
    lessons.forEach((l) => counts[lessonMastery(state, l.id)]++);
    const status: Mastery = counts.mastered === lessons.length && lessons.length ? "mastered" : counts.learning + counts.mastered > 0 ? "learning" : "not-started";
    return { ...c, total: lessons.length, ...counts, status };
  }).filter((t) => t.total > 0);
}

/** Days since a date string, using local time. */
function withinDays(iso: string, days: number) {
  return Date.now() - new Date(iso).getTime() <= days * 86400000;
}

export function lessonsThisWeek(state: ProgressState) {
  return Object.values(state.lessons).filter((r) => withinDays(r.completedAt, 7)).length;
}

/**
 * Recommended order: weak lessons (learning) first, then not-started lessons
 * in the learner's goal topics, then the rest of the path. Only unlocked lessons.
 */
export function recommendLessons(
  state: ProgressState,
  isUnlocked: (id: string) => boolean,
  goalTopics: CategoryId[] = [],
  limit = 4,
): { lesson: Lesson; reason: string }[] {
  const out: { lesson: Lesson; reason: string }[] = [];
  const add = (l: Lesson, reason: string) => {
    if (out.length < limit && !out.some((o) => o.lesson.id === l.id)) out.push({ lesson: l, reason });
  };
  ALL_LESSONS.filter((l) => lessonMastery(state, l.id) === "learning").forEach((l) => add(l, "Review — score below 80%"));
  ALL_LESSONS.filter((l) => goalTopics.includes(l.category) && !state.lessons[l.id] && isUnlocked(l.id)).forEach((l) => add(l, "Matches your goal"));
  ALL_LESSONS.filter((l) => !state.lessons[l.id] && isUnlocked(l.id)).forEach((l) => add(l, "Next on your path"));
  return out;
}
