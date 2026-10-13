import { useCallback, useEffect, useState } from "react";
import type { CategoryId } from "./types";

// Device-local learning plan (onboarding answers). Contains no sensitive data.
const KEY = "finly.plan.v1";

export type Plan = {
  goal: GoalId;
  experience: "new" | "some" | "confident";
  weeklyTarget: number;
  updatedAt: string;
};

export const GOALS = [
  { id: "budget", label: "Control my monthly spending", topics: ["budgeting", "money-basics"] },
  { id: "save", label: "Build savings and an emergency fund", topics: ["saving", "budgeting"] },
  { id: "debt", label: "Get out of debt / borrow wisely", topics: ["credit-debt", "banking"] },
  { id: "invest", label: "Start investing for the long term", topics: ["investing", "planning"] },
  { id: "safety", label: "Avoid fees and scams", topics: ["safety", "banking"] },
] as const satisfies readonly { id: string; label: string; topics: readonly CategoryId[] }[];

export type GoalId = (typeof GOALS)[number]["id"];

export function goalTopics(goal?: GoalId): CategoryId[] {
  return [...(GOALS.find((g) => g.id === goal)?.topics ?? [])];
}

export function usePlan() {
  const [plan, setPlanState] = useState<Plan | null>(null);
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setPlanState(JSON.parse(raw) as Plan);
    } catch {
      /* ignore */
    }
    setLoaded(true);
  }, []);
  const setPlan = useCallback((p: Plan | null) => {
    setPlanState(p);
    try {
      if (p) localStorage.setItem(KEY, JSON.stringify(p));
      else localStorage.removeItem(KEY);
    } catch {
      /* storage unavailable */
    }
  }, []);
  return { plan, loaded, setPlan };
}
