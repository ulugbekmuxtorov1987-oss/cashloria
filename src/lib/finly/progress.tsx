import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { ALL_LESSONS, CATEGORIES, FREE_LESSONS, LESSON_ORDER } from "./curriculum";
import { ACHIEVEMENTS } from "./achievements";
import type { CountryCode, LanguageCode } from "./types";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const STORAGE_KEY = "finly.progress.v1";

/** Surface sync failures once per session instead of failing silently. */
let syncProblemShown = false;
function notifySyncProblem(message: string) {
  if (syncProblemShown) return;
  syncProblemShown = true;
  toast.error(message);
}


export type LessonResult = { correct: number; total: number; completedAt: string; xp: number };

export type ProgressState = {
  xp: number;
  lessons: Record<string, LessonResult>;
  challenges: string[];
  achievements: string[];
  streak: { count: number; best: number; lastDay: string | null };
  country: CountryCode;
  language: LanguageCode;
};

const initialState: ProgressState = {
  xp: 0,
  lessons: {},
  challenges: [],
  achievements: [],
  streak: { count: 0, best: 0, lastDay: null },
  country: "US",
  language: "en",
};

export const RANKS = [
  { name: "Beginner", min: 0, emoji: "🌱" },
  { name: "Money Learner", min: 150, emoji: "📘" },
  { name: "Money Manager", min: 400, emoji: "🧰" },
  { name: "Smart Saver", min: 750, emoji: "🐖" },
  { name: "Investor", min: 1150, emoji: "📈" },
  { name: "Financial Expert", min: 1600, emoji: "🏅" },
];

export function rankFor(xp: number) {
  let index = 0;
  RANKS.forEach((r, i) => {
    if (xp >= r.min) index = i;
  });
  const current = RANKS[index]!;
  const next = RANKS[index + 1];
  const span = next ? next.min - current.min : 1;
  const into = xp - current.min;
  return {
    level: index + 1,
    name: current.name,
    emoji: current.emoji,
    next: next?.name ?? null,
    xpToNext: next ? next.min - xp : 0,
    percent: next ? Math.min(100, Math.round((into / span) * 100)) : 100,
  };
}

function todayKey(d = new Date()) {
  // Local calendar day: using UTC broke streaks for users ahead of/behind UTC.
  const local = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 10);
}

function dayDiff(a: string, b: string) {
  return Math.round((new Date(b).getTime() - new Date(a).getTime()) / 86400000);
}

/** Shape the DB row into progress state (only learning data — nothing sensitive). */
function rowToState(row: Record<string, unknown>): ProgressState {
  const streak = (row['streak'] ?? {}) as ProgressState["streak"];
  return {
    xp: Number(row['xp'] ?? 0),
    lessons: (row['lessons'] ?? {}) as ProgressState["lessons"],
    challenges: Array.isArray(row['challenges']) ? (row['challenges'] as string[]) : [],
    achievements: Array.isArray(row['achievements']) ? (row['achievements'] as string[]) : [],
    streak: { ...initialState.streak, ...streak },
    country: (row['country'] as CountryCode) ?? initialState.country,
    language: (row['language'] as LanguageCode) ?? initialState.language,
  };
}

function stateToRow(s: ProgressState) {
  return {
    xp: s.xp,
    lessons: s.lessons,
    challenges: s.challenges,
    achievements: s.achievements,
    streak: s.streak,
    country: s.country,
    language: s.language,
  };
}

/**
 * Non-destructive merge: keeps the best of both sides so signing in on a new
 * device never wipes progress, and re-syncing never awards XP twice.
 */
function mergeProgress(local: ProgressState, remote: ProgressState): ProgressState {
  const lessons: ProgressState["lessons"] = { ...remote.lessons };
  for (const [id, l] of Object.entries(local.lessons)) {
    const r = lessons[id];
    lessons[id] = r
      ? {
          correct: Math.max(l.correct, r.correct),
          total: Math.max(l.total, r.total),
          completedAt: l.completedAt > r.completedAt ? l.completedAt : r.completedAt,
          xp: Math.max(l.xp, r.xp),
        }
      : l;
  }
  const union = (a: string[], b: string[]) => [...new Set([...a, ...b])];
  const lastDay =
    (local.streak.lastDay ?? "") > (remote.streak.lastDay ?? "") ? local.streak.lastDay : remote.streak.lastDay;
  return {
    xp: Math.max(local.xp, remote.xp),
    lessons,
    challenges: union(local.challenges, remote.challenges),
    achievements: union(local.achievements, remote.achievements),
    streak: {
      count: Math.max(local.streak.count, remote.streak.count),
      best: Math.max(local.streak.best, remote.streak.best),
      lastDay,
    },
    country: local.country !== initialState.country ? local.country : remote.country,
    language: local.language !== initialState.language ? local.language : remote.language,
  };
}



type Ctx = {
  state: ProgressState;
  ready: boolean;
  isUnlocked: (lessonId: string) => boolean;
  completeLesson: (lessonId: string, correct: number, total: number) => { xpGained: number; unlocked: string[] };
  toggleChallenge: (id: string) => void;
  setCountry: (c: CountryCode) => void;
  setLanguage: (l: LanguageCode) => void;
  reset: () => void;
  stats: {
    lessonsCompleted: number;
    totalLessons: number;
    accuracy: number;
    coursePercent: number;
    categoryProgress: { id: string; label: string; emoji: string; percent: number; done: number; total: number }[];
  };
};

const ProgressContext = createContext<Ctx | null>(null);

export function ProgressProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<ProgressState>(initialState);
  const [ready, setReady] = useState(false);
  const stateRef = useRef(state);
  stateRef.current = state;

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as ProgressState;
        setState({ ...initialState, ...parsed, streak: { ...initialState.streak, ...parsed.streak } });
      }
    } catch {
      /* ignore corrupted storage */
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      /* storage unavailable */
    }
  }, [state, ready]);

  // ---- Cloud sync (signed-in users only; guests stay on localStorage) ----
  const [userId, setUserId] = useState<string | null>(null);
  const hydratedFor = useRef<string | null>(null);

  useEffect(() => {
    if (!ready) return;
    let active = true;

    async function hydrate(uid: string | null) {
      setUserId(uid);
      if (!uid || hydratedFor.current === uid) return;
      const { data, error } = await supabase.from("user_progress").select("*").eq("user_id", uid).maybeSingle();
      if (!active) return;
      if (error) {
        // Do NOT mark as hydrated: a failed read must not let the debounced
        // writer overwrite cloud progress with local-only state.
        console.error("progress: cloud read failed", error);
        notifySyncProblem("We couldn't load your saved progress. Your progress on this device is safe.");
        return;
      }
      hydratedFor.current = uid;
      const merged = data ? mergeProgress(stateRef.current, rowToState(data)) : stateRef.current;
      setState(merged);
      const { error: writeError } = await supabase
        .from("user_progress")
        .upsert({ user_id: uid, ...stateToRow(merged) }, { onConflict: "user_id" });
      if (writeError) {
        console.error("progress: cloud write failed", writeError);
        notifySyncProblem("We couldn't save your progress to your account. It's still saved on this device.");
      }
    }

    void supabase.auth.getSession().then(({ data }) => hydrate(data.session?.user.id ?? null));
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT") {
        hydratedFor.current = null;
        setUserId(null);
        return;
      }
      if (event === "SIGNED_IN" || event === "INITIAL_SESSION" || event === "USER_UPDATED") {
        void hydrate(session?.user.id ?? null);
      }
    });

    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, [ready]);

  useEffect(() => {
    if (!ready || !userId || hydratedFor.current !== userId) return;
    const timer = setTimeout(() => {
      void supabase
        .from("user_progress")
        .upsert({ user_id: userId, ...stateToRow(state) }, { onConflict: "user_id" })
        .then(({ error }) => {
          if (error) {
            console.error("progress: cloud write failed", error);
            notifySyncProblem("We couldn't save your progress to your account. It's still saved on this device.");
          }
        });
    }, 800);
    return () => clearTimeout(timer);
  }, [state, ready, userId]);


  const isUnlocked = useCallback(
    (lessonId: string) => {
      const index = LESSON_ORDER.indexOf(lessonId);
      if (index < FREE_LESSONS) return true;
      const prev = LESSON_ORDER[index - 1];
      return !!prev && !!state.lessons[prev];
    },
    [state.lessons],
  );

  const completeLesson = useCallback<Ctx["completeLesson"]>((lessonId, correct, total) => {
    // Hard gate: never award XP or record progress for a locked lesson,
    // even if the lesson page was opened via a direct URL.
    const orderIndex = LESSON_ORDER.indexOf(lessonId);
    const prevLessonId = LESSON_ORDER[orderIndex - 1];
    const locked = orderIndex >= FREE_LESSONS && !(prevLessonId && stateRef.current.lessons[prevLessonId]);
    if (locked) return { xpGained: 0, unlocked: [] };

    const lesson = ALL_LESSONS.find((l) => l.id === lessonId);
    const base = lesson?.xp ?? 20;
    const perfect = total > 0 && correct === total;
    const today = todayKey();
    // Computed up-front (not mutated inside the updater) so a double-invoked
    // updater in StrictMode can never award the daily bonus twice.
    const dailyBonus = stateRef.current.streak.lastDay !== today ? 5 : 0;
    const alreadyDone = !!stateRef.current.lessons[lessonId];
    const xpGained = alreadyDone ? 0 : base + (perfect ? 10 : 0) + dailyBonus;
    const unlockedAchievements: string[] = [];

    setState((prev) => {
      let streak = prev.streak;
      if (streak.lastDay !== today) {
        const diff = streak.lastDay ? dayDiff(streak.lastDay, today) : null;
        const count = diff === 1 ? streak.count + 1 : 1;
        streak = { count, best: Math.max(count, streak.best), lastDay: today };
      }

      const lessons = { ...prev.lessons };
      const already = lessons[lessonId];
      lessons[lessonId] = {
        correct: Math.max(correct, already?.correct ?? 0),
        total,
        completedAt: new Date().toISOString(),
        xp: (already?.xp ?? 0) + (already ? 0 : xpGained),
      };

      // Level completion bonus
      let bonus = 0;
      if (lesson) {
        const levelLessons = ALL_LESSONS.filter((l) => l.levelId === lesson.levelId);
        const wasComplete = levelLessons.every((l) => prev.lessons[l.id]);
        const nowComplete = levelLessons.every((l) => lessons[l.id]);
        if (!wasComplete && nowComplete) bonus = 100;
      }

      const xp = Math.max(0, prev.xp + (already ? 0 : xpGained) + bonus);
      const next: ProgressState = { ...prev, xp, lessons, streak };

      const earned = ACHIEVEMENTS.filter((a) => !prev.achievements.includes(a.id) && a.check(next)).map((a) => a.id);
      unlockedAchievements.length = 0;
      unlockedAchievements.push(...earned);
      return earned.length ? { ...next, achievements: [...prev.achievements, ...earned] } : next;
    });

    return { xpGained, unlocked: unlockedAchievements };
  }, []);

  const toggleChallenge = useCallback((id: string) => {
    // Same unlock gate as lessons: no XP for challenges on locked lessons.
    const orderIndex = LESSON_ORDER.indexOf(id);
    const prevLessonId = LESSON_ORDER[orderIndex - 1];
    if (orderIndex >= FREE_LESSONS && !(prevLessonId && stateRef.current.lessons[prevLessonId])) return;

    setState((prev) => {
      const done = prev.challenges.includes(id);
      const challenges = done ? prev.challenges.filter((c) => c !== id) : [...prev.challenges, id];
      // XP must never go negative when a challenge is un-checked.
      const next = { ...prev, challenges, xp: Math.max(0, prev.xp + (done ? -15 : 15)) };
      const earned = ACHIEVEMENTS.filter((a) => !prev.achievements.includes(a.id) && a.check(next)).map((a) => a.id);
      return earned.length ? { ...next, achievements: [...prev.achievements, ...earned] } : next;
    });
  }, []);

  const setCountry = useCallback((country: CountryCode) => setState((p) => ({ ...p, country })), []);
  const setLanguage = useCallback((language: LanguageCode) => setState((p) => ({ ...p, language })), []);
  const reset = useCallback(() => setState(initialState), []);

  const stats = useMemo(() => {
    const entries = Object.values(state.lessons);
    const answered = entries.reduce((s, e) => s + e.total, 0);
    const correct = entries.reduce((s, e) => s + e.correct, 0);
    const categoryProgress = CATEGORIES.map((c) => {
      const total = ALL_LESSONS.filter((l) => l.category === c.id).length;
      const done = ALL_LESSONS.filter((l) => l.category === c.id && state.lessons[l.id]).length;
      return { ...c, total, done, percent: total ? Math.round((done / total) * 100) : 0 };
    });
    return {
      lessonsCompleted: entries.length,
      totalLessons: ALL_LESSONS.length,
      accuracy: answered ? Math.round((correct / answered) * 100) : 0,
      coursePercent: Math.round((entries.length / ALL_LESSONS.length) * 100),
      categoryProgress,
    };
  }, [state.lessons]);

  const value = useMemo<Ctx>(
    () => ({ state, ready, isUnlocked, completeLesson, toggleChallenge, setCountry, setLanguage, reset, stats }),
    [state, ready, isUnlocked, completeLesson, toggleChallenge, setCountry, setLanguage, reset, stats],
  );

  return <ProgressContext.Provider value={value}>{children}</ProgressContext.Provider>;
}

export function useProgress() {
  const ctx = useContext(ProgressContext);
  if (!ctx) throw new Error("useProgress must be used inside ProgressProvider");
  return ctx;
}
