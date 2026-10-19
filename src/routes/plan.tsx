import { publicSeo } from "@/lib/seo";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ArrowRight, Check, Flame, RotateCcw, Target, X } from "lucide-react";
import { AppShell, Disclaimer } from "@/components/finly/AppShell";
import { DataControls } from "@/components/finly/DataControls";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ALL_LESSONS } from "@/lib/finly/curriculum";
import { useProgress } from "@/lib/finly/progress";
import { GOALS, goalTopics, usePlan, type GoalId, type Plan } from "@/lib/finly/plan";
import { lessonMastery, lessonsThisWeek, MASTERY_LABEL, recommendLessons, topicMastery, type Mastery } from "@/lib/finly/mastery";
import type { Question } from "@/lib/finly/types";

export const Route = createFileRoute("/plan")({
  head: () => {
    const title = "Your Money Learning Plan — Finly";
    const description = "A personal learning order based on your goal, skill mastery by topic, a weekly target and a review quiz of your weakest lessons.";
    const seo = publicSeo("/plan", title, description);
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        ...seo.meta,
      ],
      links: seo.links,
    };
  },
  component: PlanPage,
});

function PlanPage() {
  const { state, ready, isUnlocked } = useProgress();
  const { plan, loaded, setPlan } = usePlan();
  const [editing, setEditing] = useState(false);
  const topics = topicMastery(state);
  const recs = recommendLessons(state, isUnlocked, goalTopics(plan?.goal));
  const week = lessonsThisWeek(state);
  const target = plan?.weeklyTarget ?? 3;

  return (
    <AppShell>
      <p className="section-label">PERSONAL PLAN</p>
      <h1 className="learning-title mt-2">Your learning plan</h1>
      <p className="mt-3 max-w-2xl text-sm text-muted-foreground">Recommendations come only from your own answers and lesson results. Your plan is stored on this device.</p>

      {!ready || !loaded ? <Skeleton className="mt-8 h-64 w-full" /> : (
        <>
          {(!plan || editing) ? (
            <Onboarding initial={plan} onSave={(p) => { setPlan(p); setEditing(false); }} onSkip={() => setEditing(false)} canCancel={!!plan} />
          ) : (
            <section className="mt-8 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-card p-5">
              <div><p className="section-label">YOUR GOAL</p><p className="mt-1 font-display text-lg font-bold">{GOALS.find((g) => g.id === plan.goal)?.label}</p></div>
              <div className="flex gap-2"><Button variant="outline" onClick={() => setEditing(true)}>Change goal</Button><Button variant="ghost" onClick={() => setPlan(null)}>Clear plan</Button></div>
            </section>
          )}

          <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
            <section className="min-w-0">
              <h2 className="font-display text-lg font-bold">Recommended next</h2>
              {recs.length ? (
                <ol className="mt-3 divide-y divide-border">
                  {recs.map(({ lesson, reason }, i) => (
                    <li key={lesson.id}>
                      <Link to="/learn/$lessonId" params={{ lessonId: lesson.id }} className="group grid min-h-16 grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 py-3">
                        <span className="grid h-9 w-9 place-items-center rounded-md bg-secondary text-sm font-semibold">{i + 1}</span>
                        <span className="min-w-0"><span className="block font-semibold group-hover:text-primary">{lesson.emoji} {lesson.title}</span><span className="text-xs text-muted-foreground">{reason} · {lesson.minutes} min</span></span>
                        <ArrowRight className="h-4 w-4 text-muted-foreground" />
                      </Link>
                    </li>
                  ))}
                </ol>
              ) : <p className="mt-3 text-sm text-muted-foreground">Everything available is mastered. Try the review quiz or the simulators.</p>}

              <h2 className="mt-10 font-display text-lg font-bold">Skill mastery by topic</h2>
              <p className="mt-1 text-xs text-muted-foreground">Mastered = best quiz score of 80% or more. Learning = completed below 80%.</p>
              <ul className="mt-4 grid gap-3 sm:grid-cols-2">
                {topics.map((t) => (
                  <li key={t.id} className="rounded-lg border border-border bg-card p-4">
                    <div className="flex items-center justify-between gap-2"><span className="font-semibold">{t.emoji} {t.label}</span><MasteryBadge m={t.status} /></div>
                    <progress aria-label={`${t.label} mastery`} value={t.mastered} max={t.total} className="mt-3" />
                    <p className="mt-2 text-xs text-muted-foreground">{t.mastered} mastered · {t.learning} learning · {t["not-started"]} not started</p>
                  </li>
                ))}
              </ul>

              <ReviewQuiz />
            </section>

            <aside className="min-w-0 space-y-6">
              <section className="rounded-lg border border-border bg-card p-5">
                <h2 className="flex items-center gap-2 font-display text-lg font-bold"><Target className="h-5 w-5 text-primary" />This week</h2>
                <p className="mt-3 text-3xl font-bold">{week}<span className="text-base text-muted-foreground"> / {target} lessons</span></p>
                <progress aria-label="Weekly goal" value={Math.min(week, target)} max={target} className="mt-3" />
                <p className="mt-2 text-xs text-muted-foreground">Lessons completed or retaken in the last 7 days.</p>
                {week >= target && <p className="mt-2 text-sm font-semibold text-primary">Weekly goal reached.</p>}
              </section>
              <section className="rounded-lg border border-border bg-card p-5">
                <h2 className="flex items-center gap-2 font-display text-lg font-bold"><Flame className="h-5 w-5 text-primary" />Streak</h2>
                <p className="mt-3 text-sm">Current: <strong>{state.streak.count}</strong> {state.streak.count === 1 ? "day" : "days"} · Best: <strong>{state.streak.best}</strong></p>
                <p className="mt-2 text-xs text-muted-foreground">Complete one lesson a day to keep it going.</p>
              </section>
              <section className="rounded-lg border border-border bg-card p-5">
                <h2 className="font-display text-lg font-bold">Practice with real numbers</h2>
                <div className="mt-3 grid gap-2"><Button asChild variant="outline"><Link to="/tools">Calculators <ArrowRight /></Link></Button><Button asChild variant="outline"><Link to="/simulators">Simulators <ArrowRight /></Link></Button></div>
              </section>
            </aside>
          </div>
        </>
      )}
      <div className="mt-8"><DataControls /></div>
      <Disclaimer className="mt-10" />
    </AppShell>
  );
}

function MasteryBadge({ m }: { m: Mastery }) {
  const cls = m === "mastered" ? "bg-primary-soft text-primary" : m === "learning" ? "bg-accent-soft text-accent-foreground" : "bg-secondary text-muted-foreground";
  return <span className={`rounded-md px-2 py-0.5 text-xs font-semibold ${cls}`}>{MASTERY_LABEL[m]}</span>;
}

function Onboarding({ initial, onSave, onSkip, canCancel }: { initial: Plan | null; onSave: (p: Plan) => void; onSkip: () => void; canCancel: boolean }) {
  const [goal, setGoal] = useState<GoalId>(initial?.goal ?? "budget");
  const [experience, setExperience] = useState<Plan["experience"]>(initial?.experience ?? "new");
  const [weeklyTarget, setWeekly] = useState(initial?.weeklyTarget ?? 3);
  const [skipped, setSkipped] = useState(false);
  if (skipped) return <p className="mt-8 text-sm text-muted-foreground">Skipped. You can <button className="font-semibold text-primary underline" onClick={() => setSkipped(false)}>set a goal</button> any time.</p>;
  return (
    <form className="mt-8 rounded-lg border border-border bg-card p-5 sm:p-6" onSubmit={(e) => { e.preventDefault(); onSave({ goal, experience, weeklyTarget, updatedAt: new Date().toISOString() }); }}>
      <h2 className="font-display text-xl font-bold">A quick start (optional, 3 questions)</h2>
      <fieldset className="mt-5"><legend className="text-sm font-semibold">1. What matters most right now?</legend>
        <div className="mt-2 grid gap-2 sm:grid-cols-2">{GOALS.map((g) => (
          <label key={g.id} className="flex cursor-pointer items-center gap-2 rounded-md border border-border px-3 py-2 text-sm has-[:checked]:border-primary has-[:checked]:bg-primary-soft">
            <input type="radio" name="goal" checked={goal === g.id} onChange={() => setGoal(g.id)} />{g.label}
          </label>))}</div>
      </fieldset>
      <fieldset className="mt-5"><legend className="text-sm font-semibold">2. How familiar are you with personal finance?</legend>
        <div className="mt-2 flex flex-wrap gap-2">{([["new", "Just starting"], ["some", "Know the basics"], ["confident", "Fairly confident"]] as const).map(([v, label]) => (
          <label key={v} className="flex cursor-pointer items-center gap-2 rounded-md border border-border px-3 py-2 text-sm has-[:checked]:border-primary has-[:checked]:bg-primary-soft">
            <input type="radio" name="exp" checked={experience === v} onChange={() => setExperience(v)} />{label}
          </label>))}</div>
        {experience !== "new" && <p className="mt-2 text-xs text-muted-foreground">Later levels unlock as you complete lessons in order — you can move quickly through ones you already know.</p>}
      </fieldset>
      <label className="mt-5 block text-sm font-semibold">3. Weekly lesson target
        <select value={weeklyTarget} onChange={(e) => setWeekly(Number(e.target.value))} className="mt-2 block w-full max-w-xs rounded-md border border-border bg-background px-3 py-2 font-normal">
          {[1, 2, 3, 5, 7].map((n) => <option key={n} value={n}>{n} {n === 1 ? "lesson" : "lessons"} per week</option>)}
        </select>
      </label>
      <div className="mt-6 flex flex-wrap gap-2"><Button type="submit">Save my plan <ArrowRight /></Button>
        <Button type="button" variant="ghost" onClick={() => (canCancel ? onSkip() : setSkipped(true))}>{canCancel ? "Cancel" : "Skip for now"}</Button></div>
    </form>
  );
}

type ReviewItem = { lessonTitle: string; q: Question };

function normalize(s: string) { return s.trim().toLowerCase().replace(/[$,\s]/g, ""); }

function ReviewQuiz() {
  const { state } = useProgress();
  const [round, setRound] = useState(0);
  const items = useMemo<ReviewItem[]>(() => {
    const done = ALL_LESSONS.filter((l) => state.lessons[l.id]);
    const weak = done.filter((l) => lessonMastery(state, l.id) === "learning");
    const pool = (weak.length ? weak : done).flatMap((l) => l.quiz.map((q) => ({ lessonTitle: l.title, q })));
    // Rotate through the pool each round so retries show different questions.
    const start = pool.length ? (round * 5) % pool.length : 0;
    return [...pool.slice(start), ...pool.slice(0, start)].slice(0, 5);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [round, Object.keys(state.lessons).length]);
  const [i, setI] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [text, setText] = useState("");
  const [checked, setChecked] = useState(false);
  const [score, setScore] = useState(0);

  const header = <><h2 className="mt-10 font-display text-lg font-bold">Review quiz</h2><p className="mt-1 text-xs text-muted-foreground">Questions from lessons you scored below 80% (or any completed lesson). Practice only — no XP is awarded.</p></>;
  if (!items.length) return <section>{header}<p className="mt-3 text-sm text-muted-foreground">Complete a lesson first to unlock review questions.</p></section>;
  const item = items[i];
  if (!item) return (
    <section>{header}<div className="mt-4 rounded-lg border border-border bg-card p-5"><p className="font-display text-xl font-bold">{score} / {items.length} correct</p>
      <Button className="mt-3" variant="outline" onClick={() => { setRound((r) => r + 1); setI(0); setScore(0); setPicked(null); setText(""); setChecked(false); }}><RotateCcw />New review round</Button></div></section>
  );
  const q = item.q;
  const correct = q.kind === "choice" ? picked === q.answer : [q.answer, ...(q.accepts ?? [])].map(normalize).includes(normalize(text));
  const canCheck = q.kind === "choice" ? picked !== null : text.trim() !== "";
  return (
    <section>{header}
      <div className="mt-4 rounded-lg border border-border bg-card p-5">
        <p className="section-label">QUESTION {i + 1} OF {items.length} · {item.lessonTitle}</p>
        <p className="mt-2 font-semibold">{q.prompt}</p>
        {q.kind === "choice" ? (
          <div className="mt-3 grid gap-2" role="radiogroup">{q.options.map((o, k) => (
            <button key={k} type="button" role="radio" aria-checked={picked === k} disabled={checked} onClick={() => setPicked(k)}
              className={`rounded-md border px-3 py-2 text-left text-sm ${checked && k === q.answer ? "border-primary bg-primary-soft" : picked === k ? "border-primary" : "border-border"}`}>{o}</button>))}</div>
        ) : (
          <input aria-label="Your answer" value={text} disabled={checked} onChange={(e) => setText(e.target.value)} className="mt-3 w-full rounded-md border border-border bg-background px-3 py-2" />
        )}
        {checked && (
          <div aria-live="polite" className="mt-3 rounded-md bg-secondary p-3 text-sm">
            <p className="flex items-center gap-1 font-semibold">{correct ? <><Check className="h-4 w-4 text-primary" />Correct</> : <><X className="h-4 w-4 text-destructive" />Not quite{q.kind === "choice" ? ` — answer: ${q.options[q.answer]}` : ` — answer: ${q.answer}`}</>}</p>
            <p className="mt-1 text-muted-foreground">{q.explanation}</p>
          </div>
        )}
        <div className="mt-4">{!checked
          ? <Button disabled={!canCheck} onClick={() => { setChecked(true); if (correct) setScore((s) => s + 1); }}>Check answer</Button>
          : <Button onClick={() => { setI(i + 1); setPicked(null); setText(""); setChecked(false); }}>{i + 1 < items.length ? "Next question" : "See result"} <ArrowRight /></Button>}</div>
      </div>
    </section>
  );
}
