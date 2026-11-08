import { publicSeo } from "@/lib/seo";
import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell, Disclaimer } from "@/components/finly/AppShell";
import { ArrowRight, Check, Clock, Flame, FlaskConical, BookOpen, Target, Sparkles, TrendingUp, Play, LayoutGrid } from "lucide-react";
import { ALL_LESSONS, getLesson } from "@/lib/finly/curriculum";
import { useProgress, rankFor } from "@/lib/finly/progress";
import { useLearningSession } from "@/lib/finly/learning-session";
import { useSession, useProfile } from "@/lib/finly/account";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/")({
  head: () => {
    const seo = publicSeo('/', "Cashloria — Personal Finance Lessons, Quizzes and Money Simulators", "Follow a step-by-step learning path of short interactive lessons on budgeting, saving, credit and investing — with quizzes, progress tracking, XP streaks and hands-on money simulators.");
    return {
      meta: [
        { title: "Cashloria — Personal Finance Lessons, Quizzes and Money Simulators" },
        {
          name: "description",
          content:
            "Follow a step-by-step learning path of short interactive lessons on budgeting, saving, credit and investing — with quizzes, progress tracking, XP streaks and hands-on money simulators.",
        },
        { property: "og:title", content: "Cashloria — Personal Finance Lessons, Quizzes and Money Simulators" },
        {
          property: "og:description",
          content: "A guided learning path of short personal-finance lessons with quizzes, tracked progress, XP streaks and real-world money simulators. Free financial education.",
        },
      ...seo.meta,
      ],
      links: seo.links,
    };
  },
  component: Index,
});

/** Circular progress ring. Colors come from the wrapper's text color. */
function Ring({ percent, size = 132, stroke = 11, trackClass, barClass, children }: {
  percent: number;
  size?: number;
  stroke?: number;
  trackClass: string;
  barClass: string;
  children?: React.ReactNode;
}) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const filled = Math.max(0, Math.min(100, percent));
  return (
    <div className="relative inline-grid place-items-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90" aria-hidden="true">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth={stroke} className={trackClass} stroke="currentColor" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          strokeWidth={stroke}
          strokeLinecap="round"
          className={barClass}
          stroke="currentColor"
          strokeDasharray={c}
          strokeDashoffset={c - (filled / 100) * c}
          style={{ transition: "stroke-dashoffset 900ms cubic-bezier(0.22,0.9,0.3,1)" }}
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center">{children}</div>
    </div>
  );
}

function Index() {
  const { state, stats, ready, isUnlocked } = useProgress();
  const { user } = useSession();
  const { data: profile } = useProfile(user?.id);
  const { lastLessonId } = useLearningSession();
  const rank = rankFor(state.xp);
  const recommended = ALL_LESSONS.find(l => !state.lessons[l.id] && isUnlocked(l.id));
  const lastOpened = lastLessonId ? getLesson(lastLessonId) : undefined;
  const resume = lastOpened && !state.lessons[lastOpened.id] && isUnlocked(lastOpened.id) ? lastOpened : undefined;
  const next = resume ?? recommended;
  const name = profile?.full_name?.trim().split(" ")[0];
  const recent = ALL_LESSONS.filter(l => state.lessons[l.id]).sort((a,b) => (state.lessons[b.id]?.completedAt ?? "").localeCompare(state.lessons[a.id]?.completedAt ?? "")).slice(0,3);
  const mastered = stats.categoryProgress.filter(c => c.done > 0);

  // Real activity for the floating cards — never invented numbers.
  const now = Date.now();
  const weekAgo = now - 7 * 86400000;
  const weekLessons = Object.values(state.lessons).filter(l => new Date(l.completedAt).getTime() >= weekAgo);
  const weekXp = weekLessons.reduce((s, l) => s + l.xp, 0);
  const days: { label: string; count: number }[] = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(now - (6 - i) * 86400000);
    const key = d.toDateString();
    return {
      label: d.toLocaleDateString(undefined, { weekday: "narrow" }),
      count: Object.values(state.lessons).filter(l => new Date(l.completedAt).toDateString() === key).length,
    };
  });
  const maxDay = Math.max(1, ...days.map(d => d.count));
  const level1Done = ALL_LESSONS.filter(l => l.levelId === 1).every(l => state.lessons[l.id]);
  const healthChecks = [
    { label: "First lesson completed", ok: stats.lessonsCompleted > 0 },
    { label: "3-day learning streak", ok: state.streak.count >= 3 },
    { label: "Level 1 complete", ok: level1Done },
  ];

  return (
    <AppShell>
      {/* ---------- Hero: deep forest panel, dotted texture, purple aurora ---------- */}
      <section className="relative overflow-hidden rounded-[2rem] bg-forest-deep text-sand shadow-[0_40px_120px_-40px_rgba(6,20,16,0.8)]">
        <div className="absolute inset-0 bg-dots opacity-60" aria-hidden="true" />
        <div className="absolute inset-0 bg-aurora" aria-hidden="true" />

        <div className="relative px-5 pb-10 pt-12 text-center sm:px-10 sm:pt-16">
          <p className="animate-rise mx-auto inline-flex items-center gap-2 rounded-full border border-sand/20 bg-sand/5 px-4 py-1.5 text-xs font-bold tracking-wide text-sand">
            <Sparkles className="h-3.5 w-3.5 text-purple-bright" />
            Learn · Plan · Grow
          </p>
          <h1 className="animate-rise mx-auto mt-6 max-w-3xl text-balance font-display text-4xl font-extrabold leading-[1.05] sm:text-6xl" style={{ animationDelay: "80ms" }}>
            Take control of your money.{" "}
            <span className="font-accent italic font-normal text-purple-gradient">Build your financial future.</span>
          </h1>
          <p className="animate-rise mx-auto mt-5 max-w-xl text-pretty text-base text-sand-soft sm:text-lg" style={{ animationDelay: "160ms" }}>
            {user && name ? `Welcome back, ${name}. ` : ""}Learn smart. Plan better. Achieve more with Cashloria.
          </p>
          <div className="animate-rise mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row" style={{ animationDelay: "240ms" }}>
            <Button asChild size="lg" className="w-full sm:w-auto">
              {next ? (
                <Link to="/learn/$lessonId" params={{ lessonId: next.id }}>
                  <Play />
                  {resume ? "Continue learning" : stats.lessonsCompleted ? "Start next lesson" : "Start learning"}
                </Link>
              ) : (
                <Link to="/learn">
                  <Play />
                  Review lessons
                </Link>
              )}
            </Button>
            <Button asChild size="lg" variant="outline" className="w-full border-sand/25 text-sand hover:bg-sand/10 hover:text-sand sm:w-auto">
              <Link to="/tools">
                <LayoutGrid />
                Explore tools
              </Link>
            </Button>
          </div>
        </div>

        {/* ---------- Floating cards: real learning data only ---------- */}
        <div className="relative grid gap-6 px-5 pb-12 sm:px-10 md:grid-cols-3 md:items-end md:gap-0">
          {/* LEFT — learning health */}
          <article className="card-float animate-rise p-6 md:-rotate-3 md:translate-y-4 md:animate-float" style={{ animationDelay: "320ms" }}>
            <div className="flex items-center justify-between gap-3">
              <h2 className="flex items-center gap-2 font-display text-base font-extrabold text-ink">
                <span className="grid h-8 w-8 place-items-center rounded-xl bg-primary text-primary-foreground"><TrendingUp className="h-4 w-4" /></span>
                Learning health
              </h2>
              <Link to="/dashboard" className="text-xs font-bold text-purple">Details →</Link>
            </div>
            <div className="mt-5 flex items-center gap-5">
              <Ring percent={ready ? stats.accuracy : 0} size={104} stroke={10} trackClass="text-ink/10" barClass="text-purple">
                <div className="text-center">
                  <p className="font-display text-2xl font-extrabold text-ink">{ready ? stats.accuracy : 0}%</p>
                  <p className="text-[10px] font-bold uppercase tracking-wide text-ink-soft">Quiz accuracy</p>
                </div>
              </Ring>
              <ul className="min-w-0 flex-1 space-y-2.5">
                {healthChecks.map(c => (
                  <li key={c.label} className="flex items-center gap-2 text-xs font-semibold text-ink">
                    <span className={`grid h-5 w-5 shrink-0 place-items-center rounded-full ${c.ok ? "bg-success text-cream" : "bg-ink/10 text-ink-soft"}`}>
                      <Check className="h-3 w-3" />
                    </span>
                    <span className={c.ok ? "" : "text-ink-soft"}>{c.label}</span>
                  </li>
                ))}
              </ul>
            </div>
          </article>

          {/* CENTER — overall progress (purple highlight) */}
          <article className="animate-rise relative z-10 rounded-3xl border border-purple-bright/40 bg-[linear-gradient(150deg,var(--color-purple-bright),var(--color-purple)_55%,#6d28e0)] p-6 text-cream shadow-[0_32px_80px_-20px_rgba(135,59,250,0.65)] md:-translate-y-2 md:scale-[1.04] md:animate-float" style={{ animationDelay: "420ms" }}>
            <h2 className="flex items-center gap-2 font-display text-base font-extrabold">
              <span aria-hidden="true">🏆</span> Your progress
            </h2>
            <div className="mt-4 grid place-items-center">
              <Ring percent={ready ? stats.coursePercent : 0} size={150} stroke={13} trackClass="text-cream/25" barClass="text-cream">
                <div className="text-center">
                  <p className="font-display text-4xl font-extrabold">{ready ? stats.coursePercent : 0}%</p>
                  <p className="text-[10px] font-bold uppercase tracking-wide text-cream/80">Path complete</p>
                </div>
              </Ring>
            </div>
            <p className="mt-4 flex items-center justify-center gap-1.5 text-sm font-bold">
              <TrendingUp className="h-4 w-4" />
              {weekXp > 0 ? `+${weekXp} XP this week` : stats.lessonsCompleted ? "No XP yet this week — one lesson fixes that" : "Start your first lesson to earn XP"}
            </p>
          </article>

          {/* RIGHT — weekly activity */}
          <article className="card-float animate-rise p-6 md:rotate-3 md:translate-y-4 md:animate-float" style={{ animationDelay: "520ms" }}>
            <div className="flex items-center justify-between gap-3">
              <h2 className="flex items-center gap-2 font-display text-base font-extrabold text-ink">
                <span className="grid h-8 w-8 place-items-center rounded-xl bg-primary text-primary-foreground"><Flame className="h-4 w-4" /></span>
                Weekly activity
              </h2>
              <span className="rounded-full bg-ink/5 px-2.5 py-1 text-[10px] font-bold text-ink-soft">Last 7 days</span>
            </div>
            <p className="mt-4 font-display text-3xl font-extrabold text-ink">
              {weekLessons.length} <span className="text-sm font-bold text-ink-soft">{weekLessons.length === 1 ? "lesson" : "lessons"}</span>
              {state.streak.count > 0 && <span className="ml-2 rounded-full bg-success-soft px-2 py-0.5 align-middle text-xs font-bold text-success">🔥 {state.streak.count}-day streak</span>}
            </p>
            <div className="mt-4 flex h-24 items-end gap-2" role="img" aria-label={`Lessons completed per day over the last 7 days: ${days.map(d => `${d.label} ${d.count}`).join(", ")}`}>
              {days.map((d, i) => (
                <div key={i} className="flex flex-1 flex-col items-center gap-1.5">
                  <div
                    className={`w-full rounded-t-md ${d.count ? "bg-[linear-gradient(180deg,var(--color-purple-bright),var(--color-purple))]" : "bg-ink/10"}`}
                    style={{ height: `${Math.max(8, (d.count / maxDay) * 100)}%`, transition: "height 700ms cubic-bezier(0.22,0.9,0.3,1)" }}
                  />
                  <span className="text-[10px] font-bold text-ink-soft">{d.label}</span>
                </div>
              ))}
            </div>
            {weekLessons.length === 0 && <p className="mt-3 text-xs font-semibold text-ink-soft">Complete a lesson and your chart comes to life.</p>}
          </article>
        </div>
      </section>

      {/* ---------- Stats strip (real data) ---------- */}
      <section aria-label="Your progress" className="mt-8 grid grid-cols-2 divide-x divide-border border-y border-border py-5 sm:grid-cols-4">
        <Stat label="Lessons completed" value={ready ? `${stats.lessonsCompleted} / ${stats.totalLessons}` : "—"} />
        <Stat label="Total earned" value={ready ? `${state.xp} XP` : "—"} />
        <Stat label="Quiz accuracy" value={ready && stats.lessonsCompleted ? `${stats.accuracy}%` : "—"} />
        <Stat label="Best streak" value={ready ? `${state.streak.best} ${state.streak.best === 1 ? "day" : "days"}` : "—"} />
      </section>

      <div className="mt-9 grid gap-8 lg:grid-cols-[minmax(0,1fr)_300px]">
        <section className="min-w-0">
          <div className="mb-4 flex items-center justify-between gap-3"><h2 className="font-display text-lg font-bold">Your next step</h2><Link to="/learn" className="text-sm font-semibold text-primary">Full learning path <span aria-hidden="true">↗</span></Link></div>
          {!ready ? <Skeleton className="h-72 w-full" /> : next ? (
            <article className="card-soft overflow-hidden p-5 sm:p-6">
              <p className="section-label">{resume ? "CONTINUE LEARNING" : "RECOMMENDED FOR YOU"} · LEVEL {next.levelId} · {next.category.replaceAll("-", " ")}</p>
              <h3 className="mt-2 font-display text-2xl font-bold">{next.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{next.summary}</p>
              <div className="mt-5 flex flex-wrap items-center justify-between gap-4"><p className="flex items-center gap-2 text-xs font-semibold text-muted-foreground"><Clock className="h-4 w-4" />{next.minutes} min <span aria-hidden="true">·</span>{next.xp} XP</p><Button asChild><Link to="/learn/$lessonId" params={{ lessonId: next.id }}>{resume ? "Continue lesson" : stats.lessonsCompleted ? "Start next lesson" : "Start first lesson"}<ArrowRight /></Link></Button></div>
            </article>
          ) : <div className="border-y border-border py-10"><Check className="h-7 w-7 text-primary" /><h3 className="mt-3 text-xl font-bold">Learning path complete</h3><p className="mt-2 text-muted-foreground">Revisit a lesson or put your knowledge into practice.</p><Button asChild className="mt-4"><Link to="/learn">Review lessons <ArrowRight /></Link></Button></div>}
          <section className="mt-8">
            <h2 className="font-display text-lg font-bold">{recent.length ? "Recently completed" : "A strong foundation starts here"}</h2>
            <div className="mt-3 divide-y divide-border">
              {(recent.length ? recent : ALL_LESSONS.filter(l => isUnlocked(l.id)).slice(0,3)).map((lesson, i) => <Link key={lesson.id} to="/learn/$lessonId" params={{lessonId:lesson.id}} className="group grid min-h-20 grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 py-4"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-secondary text-sm font-semibold text-secondary-foreground">{recent.length ? <Check className="h-5 w-5" /> : `0${i+1}`}</span><div className="min-w-0"><p className="font-semibold group-hover:text-primary">{lesson.title}</p><p className="mt-1 text-xs text-muted-foreground">{lesson.minutes} min · {recent.length ? `${state.lessons[lesson.id]?.correct ?? 0}/${state.lessons[lesson.id]?.total ?? 0} correct` : lesson.difficulty}</p></div><ArrowRight className="h-4 w-4 text-muted-foreground" /></Link>)}
            </div>
          </section>
        </section>
        <aside className="min-w-0 space-y-8">
          <section className="border-b border-border pb-7">
            <h2 className="flex items-center gap-2 font-display text-lg font-bold"><Target className="h-5 w-5 text-primary" />Your learning journey</h2>
            <div className="mt-5 flex items-end justify-between"><p className="text-3xl font-bold">{stats.coursePercent}<span className="text-base text-muted-foreground">%</span></p><span className="text-xs text-muted-foreground">of the path completed</span></div>
            <progress aria-label="Course completion" value={stats.coursePercent} max={100} className="mt-3" />
            <p className="mt-3 text-sm text-muted-foreground">{rank.next ? `${rank.xpToNext} XP to ${rank.next}` : "You've reached the highest rank."}</p>
          </section>
          <section className="border-b border-border pb-7"><h2 className="font-display text-lg font-bold">Skills in progress</h2>{mastered.length ? <ul className="mt-4 space-y-4">{mastered.map(c => <li key={c.id}><div className="mb-2 flex justify-between gap-3 text-sm"><span>{c.label}</span><span className="text-muted-foreground">{c.done}/{c.total}</span></div><progress aria-label={`${c.label} progress`} value={c.percent} max={100} /></li>)}</ul> : <div className="mt-4"><BookOpen className="h-6 w-6 text-primary" /><p className="mt-3 text-sm text-muted-foreground">Complete your first lesson to start building your money skills.</p></div>}</section>
          <section><h2 className="flex items-center gap-2 font-display text-lg font-bold"><FlaskConical className="h-5 w-5 text-info" />Put it into practice</h2><p className="mt-3 text-sm leading-relaxed text-muted-foreground">Explore a monthly budget, compound growth or a debt payoff plan.</p><Button asChild variant="outline" className="mt-4 w-full"><Link to="/simulators">Open simulators <ArrowRight /></Link></Button></section>
          {!user && <section className="border-t border-border pt-6"><p className="text-sm text-muted-foreground">Keep learning as a guest, or save your progress across devices.</p><Button asChild variant="secondary" className="mt-3 w-full"><Link to="/auth">Log in to Cashloria <ArrowRight /></Link></Button></section>}
        </aside>
      </div>
      <Disclaimer className="mt-10" />
    </AppShell>
  );
}
function Stat({label,value}:{label:string;value:string}) {
  return <div className="min-w-0 px-3 py-2 first:pl-0 sm:px-5"><p className="section-label">{label}</p><p className="mt-2 font-display text-xl font-bold sm:text-2xl">{value}</p></div>;
}
