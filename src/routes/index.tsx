import { publicSeo } from "@/lib/seo";
import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell, Disclaimer } from "@/components/finly/AppShell";
import { LEVELS, ALL_LESSONS } from "@/lib/finly/curriculum";
import { useProgress, rankFor } from "@/lib/finly/progress";

export const Route = createFileRoute("/")({
  head: () => {
    const seo = publicSeo('/', "Finly — Learn Personal Finance in 5-Minute Lessons", "Finly teaches budgeting, saving, credit, investing and taxes through short interactive lessons, quizzes, XP and streaks.");
    return {
      meta: [
        { title: "Finly — Learn Personal Finance in 5-Minute Lessons" },
        {
          name: "description",
          content:
            "Finly teaches budgeting, saving, credit, investing and taxes through short interactive lessons, quizzes, XP and streaks.",
        },
        { property: "og:title", content: "Finly — Learn Personal Finance in 5-Minute Lessons" },
        {
          property: "og:description",
          content: "Short lessons, quizzes, streaks and real-world money simulators. Free financial education.",
        },
      ...seo.meta,
      ],
      links: seo.links,
    };
  },
  component: Index,
});

function Index() {
  const { state, stats } = useProgress();
  const rank = rankFor(state.xp);

  return (
    <AppShell>
      <section className="rounded-3xl bg-primary-soft px-6 py-10 text-center md:py-14">
        <h1 className="font-display text-3xl font-extrabold md:text-5xl">
          Learn money the way you'd learn a language
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
          {ALL_LESSONS.length} bite-sized lessons across {LEVELS.length} levels. Answer quizzes, earn XP, keep your
          streak alive and try real-world simulators.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link
            to="/learn"
            className="rounded-full bg-primary px-6 py-3 font-bold text-primary-foreground transition hover:opacity-90"
          >
            Start learning
          </Link>
          <Link to="/simulators" className="rounded-full border border-border bg-background px-6 py-3 font-bold">
            Try a simulator
          </Link>
        </div>
      </section>

      <section className="mt-8 grid gap-4 sm:grid-cols-3">
        <Stat label="Your rank" value={`${rank.emoji} ${rank.name}`} />
        <Stat label="Lessons completed" value={`${stats.lessonsCompleted} / ${stats.totalLessons}`} />
        <Stat label="Quiz accuracy" value={`${stats.accuracy}%`} />
      </section>

      <section className="mt-10">
        <h2 className="font-display text-2xl font-bold">The path</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          {LEVELS.map((level) => (
            <div key={level.id} className="rounded-2xl border border-border bg-card p-5">
              <p className="text-2xl">{level.emoji}</p>
              <p className="mt-1 font-display text-lg font-bold">
                Level {level.id}: {level.title}
              </p>
              <p className="text-sm text-muted-foreground">{level.subtitle}</p>
              <p className="mt-2 text-xs font-semibold text-muted-foreground">{level.lessons.length} lessons</p>
            </div>
          ))}
        </div>
      </section>

      <Disclaimer className="mt-8" />
    </AppShell>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-1 font-display text-xl font-bold">{value}</p>
    </div>
  );
}
