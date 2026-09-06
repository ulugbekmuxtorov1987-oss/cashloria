import { publicSeo } from "@/lib/seo";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Lock, GraduationCap } from "lucide-react";
import { DecorShapes } from "@/components/finly/Illustrations";
import { AppShell, Disclaimer } from "@/components/finly/AppShell";
import { LEVELS } from "@/lib/finly/curriculum";
import { useProgress } from "@/lib/finly/progress";

export const Route = createFileRoute("/learn/")({
  head: () => {
    const seo = publicSeo('/learn', "Learning Path — Finly Money Lessons", "Follow Finly's five-level path: money basics, budgeting, saving, credit, investing and planning.");
    return {
      meta: [
        { title: "Learning Path — Finly Money Lessons" },
        {
          name: "description",
          content: "Follow Finly's five-level path: money basics, budgeting, saving, credit, investing and planning.",
        },
        { property: "og:title", content: "Learning Path — Finly Money Lessons" },
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

  return (
    <AppShell>
      <div className="flex items-center gap-3">
        <span className="grid h-11 w-11 place-items-center rounded-2xl bg-primary-soft text-primary">
          <GraduationCap className="h-6 w-6" aria-hidden="true" />
        </span>
        <div>
          <h1 className="font-display text-3xl font-extrabold">Learning path</h1>
          <p className="mt-1 text-muted-foreground">Finish a lesson to unlock the next one.</p>
        </div>
      </div>
      <DecorShapes className="mt-4 h-12 w-full opacity-60" />


      <div className="mt-8 space-y-10">
        {LEVELS.map((level) => (
          <section key={level.id}>
            <h2 className="font-display text-xl font-bold">
              {level.emoji} Level {level.id}: {level.title}
            </h2>
            <p className="text-sm text-muted-foreground">{level.subtitle}</p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {level.lessons.map((lesson) => {
                const done = !!state.lessons[lesson.id];
                const unlocked = isUnlocked(lesson.id);
                const classes = `rounded-2xl border p-4 text-left transition ${
                  done ? "border-primary bg-primary-soft" : "border-border bg-card"
                } ${unlocked ? "hover:shadow-md" : "opacity-60"}`;

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
                      {lesson.minutes} min · {lesson.xp} XP {done ? "· ✅ done" : ""}
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
