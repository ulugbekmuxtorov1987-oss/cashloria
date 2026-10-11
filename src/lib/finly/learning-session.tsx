import { useCallback, useEffect, useState } from "react";
import { getLesson } from "@/lib/finly/curriculum";

// A device-local navigation preference, not a substitute for account progress.
const KEY = "finly.last-opened-lesson";
export function useLearningSession() {
  const [lastLessonId, setLastLessonId] = useState<string | null>(null);
  useEffect(() => {
    try {
      const id = localStorage.getItem(KEY);
      if (id && getLesson(id)) setLastLessonId(id);
    } catch { /* Navigation still works without storage. */ }
  }, []);
  const rememberLesson = useCallback((id: string) => {
    if (!getLesson(id)) return;
    setLastLessonId(id);
    try { localStorage.setItem(KEY, id); } catch { /* Optional preference. */ }
  }, []);
  return { lastLessonId, rememberLesson };
}