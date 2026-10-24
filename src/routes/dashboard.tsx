import { createFileRoute } from "@tanstack/react-router";
import { AppShell, Disclaimer } from "@/components/finly/AppShell";
import { ACHIEVEMENTS } from "@/lib/finly/achievements";
import { useProgress, rankFor, RANKS } from "@/lib/finly/progress";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Your Progress — Cashloria" },
      {
        name: "description",
        content: "Track your XP, streak, quiz accuracy, knowledge map and achievements in Cashloria.",
      },
      { property: "og:title", content: "Your Progress — Cashloria" },
      { property: "og:description", content: "XP, streaks, knowledge map and achievements." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const { state, stats, reset } = useProgress();
  const rank = rankFor(state.xp);

  return (
    <AppShell>
      <h1 className="font-display text-3xl font-extrabold">Your progress</h1>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card label="XP" value={String(state.xp)} />
        <Card label="Streak" value={`🔥 ${state.streak.count} (best ${state.streak.best})`} />
        <Card label="Lessons" value={`${stats.lessonsCompleted}/${stats.totalLessons}`} />
        <Card label="Accuracy" value={`${stats.accuracy}%`} />
      </div>

      <section className="mt-8 rounded-2xl border border-border bg-card p-5">
        <p className="font-display text-lg font-bold">
          {rank.emoji} {rank.name}
        </p>
        <div className="mt-3 h-3 w-full overflow-hidden rounded-full bg-muted">
          <div className="h-full rounded-full bg-primary" style={{ width: `${rank.percent}%` }} />
        </div>
        <p className="mt-2 text-sm text-muted-foreground">
          {rank.next ? `${rank.xpToNext} XP to ${rank.next}` : "Top rank reached"} · Level {rank.level} of{" "}
          {RANKS.length}
        </p>
      </section>

      <section className="mt-8">
        <h2 className="font-display text-xl font-bold">Knowledge map</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          {stats.categoryProgress.map((c) => (
            <div key={c.id} className="rounded-2xl border border-border bg-card p-4">
              <p className="font-semibold">
                {c.emoji} {c.label}
              </p>
              <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-muted">
                <div className="h-full rounded-full bg-primary" style={{ width: `${c.percent}%` }} />
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                {c.done}/{c.total} lessons
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-8">
        <h2 className="font-display text-xl font-bold">Achievements</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {ACHIEVEMENTS.map((a) => {
            const earned = state.achievements.includes(a.id);
            return (
              <div
                key={a.id}
                className={`rounded-2xl border p-4 ${earned ? "border-primary bg-primary-soft" : "border-border bg-card opacity-70"}`}
              >
                <p className="text-xl">{a.emoji}</p>
                <p className="mt-1 font-semibold">{a.title}</p>
                <p className="text-xs text-muted-foreground">{a.description}</p>
              </div>
            );
          })}
        </div>
      </section>

      <button
        onClick={() => reset()}
        className="mt-8 rounded-full border border-border px-4 py-2 text-sm font-semibold text-muted-foreground"
      >
        Reset all progress
      </button>

      <Disclaimer className="mt-8" />
    </AppShell>
  );
}

function Card({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-1 font-display text-xl font-bold">{value}</p>
    </div>
  );
}
