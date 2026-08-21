import { supabase } from "@/integrations/supabase/client";

const KEY = "finly.visitor";

function visitorId(): string | null {
  if (typeof window === "undefined") return null;
  try {
    let id = localStorage.getItem(KEY);
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem(KEY, id);
    }
    return id;
  } catch {
    return null;
  }
}

async function log(event_type: string, extra: { path?: string; lesson_slug?: string } = {}) {
  if (typeof window === "undefined") return;
  const visitor_id = visitorId();
  try {
    await supabase.from("analytics_events").insert({
      event_type,
      visitor_id,
      path: extra.path ?? window.location.pathname,
      lesson_slug: extra.lesson_slug ?? null,
    });
  } catch {
    /* analytics must never break the page */
  }
}

export function trackPageView(path: string) {
  void log("page_view", { path });
}

export function trackLessonComplete(lessonSlug: string) {
  void log("lesson_complete", { lesson_slug: lessonSlug });
}

export function trackQuizAttempt(lessonSlug: string) {
  void log("quiz_attempt", { lesson_slug: lessonSlug });
}
