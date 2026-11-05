import { publicSeo } from "@/lib/seo";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Lock, GraduationCap, Search, Check } from "lucide-react";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useLearningSession } from "@/lib/finly/learning-session";
import { AppShell, Disclaimer } from "@/components/finly/AppShell";
import { LEVELS } from "@/lib/finly/curriculum";
import { localizeLevel } from "@/lib/finly/content-i18n";
import { useProgress } from "@/lib/finly/progress";

export const Route = createFileRoute("/learn/")({
  head: () => {
    const seo = publicSeo('/learn', "Learning Path — Cashloria Money Lessons", "Follow Cashloria's five-level path: money basics, budgeting, saving, credit, investing and planning.");
    return {
      meta: [
        { title: "Learning Path — Cashloria Money Lessons" },
        {
          name: "description",
          content: "Follow Cashloria's five-level path: money basics, budgeting, saving, credit, investing and planning.",
        },
        { property: "og:title", content: "Learning Path — Cashloria Money Lessons" },
        { property: "og:description", content: "Five levels of short, interactive personal finance lessons." },
      ...seo.meta,
      ],
      links: seo.links,
    };
  },
  component: LearnPage,
});

function LearnPage() {
  const { state, isUnlocked } = useProgress();
  const { lastLessonId } = useLearningSession();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const visible = (l: typeof LEVELS[number]["lessons"][number]) => (l.title + " " + l.summary).toLowerCase().includes(search.toLowerCase().trim()) && (filter === "all" || (filter === "completed" ? !!state.lessons[l.id] : !state.lessons[l.id] && isUnlocked(l.id)));
  const shownLevels = LEVELS.map((l) => localizeLevel(l, state.language)).map(l => ({...l, lessons: l.lessons.filter(visible)})).filter(l => l.lessons.length);

  return (
    <AppShell>
      <div className="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-3">
        <span className="grid h-11 w-11 place-items-center rounded-2xl bg-primary-soft text-primary">
          <GraduationCap className="h-6 w-6" aria-hidden="true" />
        </span>
        <div>
          <h1 className="font-display text-3xl font-extrabold">Learning path</h1>
          <p className="mt-1 text-muted-foreground">Finish a lesson to unlock the next one.</p>
        </div>
      </div>
      <div className="mt-7 grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto]">
        <label className="relative"><Search className="absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" /><span className="sr-only">Search lessons</span><Input value={search} onChange={e => setSearch(e.target.value)} maxLength={120} placeholder="Search lessons or topics" className="min-h-11 pl-10" /></label>
        <div className="flex gap-1" aria-label="Lesson filters">{["all", "available", "completed"].map(v => <Button key={v} variant={filter === v ? "secondary" : "ghost"} aria-pressed={filter === v} onClick={() => setFilter(v)}>{v[0]?.toUpperCase()}{v.slice(1)}</Button>)}</div>
      </div>
      {!shownLevels.length && <div role="status" className="border-b border-border py-12"><h2 className="text-lg font-bold">No lessons found</h2><p className="mt-2 text-muted-foreground">Try another topic or show all lessons.</p><Button variant="outline" className="mt-4" onClick={() => {setSearch("");setFilter("all");}}>Clear filters</Button></div>}


      <div className="mt-8 space-y-10">
        {shownLevels.map((level) => (
          <section key={level.id}>
            <h2 className="font-display text-xl font-bold">
              {level.emoji} Level {level.id}: {level.title}
            </h2>
            <p className="text-sm text-muted-foreground">{level.subtitle}</p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {level.lessons.map((lesson) => {
                const done = !!state.lessons[lesson.id];
                const unlocked = isUnlocked(lesson.id);
                const classes = `rounded-lg border p-5 text-left transition ${
                  done ? "border-primary bg-primary-soft" : "border-border bg-card"
                } ${unlocked ? "hover:border-primary" : "opacity-60"}`;

                if (!unlocked) {
                  return (
                    <div key={lesson.id} className={classes}>
                      <p className="text-xl">{lesson.emoji}</p>
                      <p className="mt-1 font-semibold">{lesson.title}</p>
                      <p className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
                        <Lock className="h-3.5 w-3.5" /> Locked
                      </p>
                    </div>
                  );
                }

                return (
                  <Link key={lesson.id} to="/learn/$lessonId" params={{ lessonId: lesson.id }} className={classes}>
                    <p className="text-xl">{lesson.emoji}</p>
                    <p className="mt-1 font-semibold">{lesson.title}</p>
                    <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{lesson.summary}</p>
                    <p className="mt-2 text-xs font-semibold text-muted-foreground">
                      {lesson.minutes} min · {lesson.xp} XP {done ? "· Completed" : lastLessonId === lesson.id ? "· In progress" : ""}
                    </p>
                  </Link>
                );
              })}
            </div>
          </section>
        ))}
      </div>

      <Disclaimer className="mt-10" />
    </AppShell>
  );
}
