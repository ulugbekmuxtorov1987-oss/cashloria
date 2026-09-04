import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { ALL_LESSONS, CATEGORIES, FREE_LESSONS, LESSON_ORDER } from "./curriculum";
import { ACHIEVEMENTS } from "./achievements";
import type { CountryCode, LanguageCode } from "./types";

const STORAGE_KEY = "finly.progress.v1";

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
  return d.toISOString().slice(0, 10);
}

function dayDiff(a: string, b: string) {
  return Math.round((new Date(b).getTime() - new Date(a).getTime()) / 86400000);
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
      hydratedFor.current = uid;
      const { data } = await supabase.from("user_progress").select("*").eq("user_id", uid).maybeSingle();
      if (!active) return;
      const merged = data ? mergeProgress(stateRef.current, rowToState(data)) : stateRef.current;
      setState(merged);
      await supabase.from("user_progress").upsert({ user_id: uid, ...stateToRow(merged) }, { onConflict: "user_id" });
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
        .upsert({ user_id: userId, ...stateToRow(state) }, { onConflict: "user_id" });
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
    let xpGained = base + (perfect ? 10 : 0);
    const unlockedAchievements: string[] = [];

    setState((prev) => {
      const today = todayKey();
      let streak = prev.streak;
      if (streak.lastDay !== today) {
        const diff = streak.lastDay ? dayDiff(streak.lastDay, today) : null;
        const count = diff === 1 ? streak.count + 1 : 1;
        streak = { count, best: Math.max(count, streak.best), lastDay: today };
        xpGained += 5;
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

      const xp = prev.xp + (already ? 0 : xpGained) + bonus;
      const next: ProgressState = { ...prev, xp, lessons, streak };

      const earned = ACHIEVEMENTS.filter((a) => !prev.achievements.includes(a.id) && a.check(next)).map((a) => a.id);
      unlockedAchievements.push(...earned);
      return earned.length ? { ...next, achievements: [...prev.achievements, ...earned] } : next;
    });

    return { xpGained, unlocked: unlockedAchievements };
  }, []);

  const toggleChallenge = useCallback((id: string) => {
    setState((prev) => {
      const done = prev.challenges.includes(id);
      const challenges = done ? prev.challenges.filter((c) => c !== id) : [...prev.challenges, id];
      const next = { ...prev, challenges, xp: prev.xp + (done ? -15 : 15) };
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
