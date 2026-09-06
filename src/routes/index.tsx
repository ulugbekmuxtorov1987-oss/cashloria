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
      <section className="relative overflow-hidden rounded-3xl bg-primary-soft px-6 py-10 md:py-14">
        <DecorShapes className="pointer-events-none absolute -top-2 left-0 h-16 w-full opacity-70" />
        <div className="relative grid items-center gap-8 md:grid-cols-[1.1fr_1fr]">
          <div className="text-center md:text-left">
            <h1 className="font-display text-3xl font-extrabold md:text-5xl">
              Learn money the way you'd learn a language
            </h1>
            <p className="mt-4 max-w-2xl text-muted-foreground">
              {ALL_LESSONS.length} bite-sized lessons across {LEVELS.length} levels. Answer quizzes, earn XP, keep your
              streak alive and try real-world simulators.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3 md:justify-start">
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
          </div>
          <HeroFinanceArt className="mx-auto h-44 w-full max-w-sm md:h-56" />
        </div>
      </section>

      <section className="mt-8 grid gap-4 sm:grid-cols-3">
        <Stat label="Your rank" value={`${rank.emoji} ${rank.name}`} />
        <Stat label="Lessons completed" value={`${stats.lessonsCompleted} / ${stats.totalLessons}`} />
        <Stat label="Quiz accuracy" value={`${stats.accuracy}%`} />
      </section>

      <section className="mt-10">
        <h2 className="font-display text-2xl font-bold">What you'll master</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map((f) => (
            <div key={f.title} className="rounded-2xl border border-border bg-card p-5">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-primary-soft text-primary">
                <f.icon className="h-5 w-5" aria-hidden="true" />
              </span>
              <p className="mt-3 font-display text-lg font-bold">{f.title}</p>
              <p className="mt-1 text-sm text-muted-foreground">{f.text}</p>
              <MiniSpark points={f.spark} className="mt-3 h-7 w-20 text-accent" />
            </div>
          ))}
        </div>
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
