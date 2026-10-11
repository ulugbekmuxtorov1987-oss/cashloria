import { publicSeo } from "@/lib/seo";
import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell, Disclaimer } from "@/components/finly/AppShell";
import { ArrowRight, Check, Clock, Flame, FlaskConical, BookOpen, Target } from "lucide-react";
import { ALL_LESSONS, getLesson } from "@/lib/finly/curriculum";
import { useProgress, rankFor } from "@/lib/finly/progress";
import { useLearningSession } from "@/lib/finly/learning-session";
import { useSession, useProfile } from "@/lib/finly/account";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import learningArt from "@/assets/learning-still-life.jpg";

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
  return (
    <AppShell>
      <header className="grid grid-cols-[minmax(0,1fr)_auto] items-end gap-4">
        <div className="min-w-0">
          <p className="section-label">YOUR MONEY, BETTER UNDERSTOOD</p>
          <h1 className="learning-title mt-2">{user ? `Welcome back${name ? `, ${name}` : ""}.` : "Finly. Learn money. Mastered."}</h1>
          <p className="mt-3 text-sm text-muted-foreground">{stats.lessonsCompleted ? "A little progress today. More confidence tomorrow." : "Start with the basics. Build confidence, one lesson at a time."}</p>
        </div>
        <span className="hidden items-center gap-2 rounded-md border border-border px-3 py-2 text-sm font-semibold sm:flex"><span>{rank.emoji}</span>{rank.name}</span>
      </header>

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
            <article className="overflow-hidden rounded-lg border border-border bg-card">
              <div className="relative h-40 overflow-hidden sm:h-48"><img src={learningArt} width={1200} height={800} alt="Emerald glass steps, coins and a notebook" className="h-full w-full object-cover object-center" /><span className="absolute left-4 top-4 rounded-md bg-card px-3 py-1.5 text-xs font-semibold">{resume ? "Continue learning" : "Recommended for you"}</span></div>
              <div className="p-5 sm:p-6">
                <p className="section-label">LEVEL {next.levelId} · {next.category.replaceAll("-", " ")}</p>
                <h3 className="mt-2 font-display text-2xl font-bold">{next.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{next.summary}</p>
                <div className="mt-5 flex flex-wrap items-center justify-between gap-4"><p className="flex items-center gap-2 text-xs font-semibold text-muted-foreground"><Clock className="h-4 w-4" />{next.minutes} min <span aria-hidden="true">·</span>{next.xp} XP</p><Button asChild><Link to="/learn/$lessonId" params={{ lessonId: next.id }}>{resume ? "Continue lesson" : stats.lessonsCompleted ? "Start next lesson" : "Start first lesson"}<ArrowRight /></Link></Button></div>
              </div>
            </article>
          ) : <div className="border-y border-border py-10"><Check className="h-7 w-7 text-primary" /><h3 className="mt-3 text-xl font-bold">Learning path complete</h3><p className="mt-2 text-muted-foreground">Revisit a lesson or put your knowledge into practice.</p><Button asChild className="mt-4"><Link to="/learn">Review lessons <ArrowRight /></Link></Button></div>}
          <section className="mt-8">
            <h2 className="font-display text-lg font-bold">{recent.length ? "Recently completed" : "A strong foundation starts here"}</h2>
            <div className="mt-3 divide-y divide-border">
              {(recent.length ? recent : ALL_LESSONS.filter(l => isUnlocked(l.id)).slice(0,3)).map((lesson, i) => <Link key={lesson.id} to="/learn/$lessonId" params={{lessonId:lesson.id}} className="group grid min-h-20 grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 py-4"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-md bg-secondary text-sm font-semibold">{recent.length ? <Check className="h-5 w-5 text-primary" /> : `0${i+1}`}</span><div className="min-w-0"><p className="font-semibold group-hover:text-primary">{lesson.title}</p><p className="mt-1 text-xs text-muted-foreground">{lesson.minutes} min · {recent.length ? `${state.lessons[lesson.id]?.correct ?? 0}/${state.lessons[lesson.id]?.total ?? 0} correct` : lesson.difficulty}</p></div><ArrowRight className="h-4 w-4 text-muted-foreground" /></Link>)}
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
          {!user && <section className="border-t border-border pt-6"><p className="text-sm text-muted-foreground">Keep learning as a guest, or save your progress across devices.</p><Button asChild variant="secondary" className="mt-3 w-full"><Link to="/auth">Log in to Finly <ArrowRight /></Link></Button></section>}
        </aside>
      </div>
      <Disclaimer className="mt-10" />
    </AppShell>
  );
}
function Stat({label,value}:{label:string;value:string}) {
  return <div className="min-w-0 px-3 py-2 first:pl-0 sm:px-5"><p className="section-label">{label}</p><p className="mt-2 font-display text-xl font-bold sm:text-2xl">{value}</p></div>;
}
