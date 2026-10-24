import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { AppShell, Disclaimer } from "@/components/finly/AppShell";
import { ALL_LESSONS, getLesson, nextLessonId } from "@/lib/finly/curriculum";
import { useProgress } from "@/lib/finly/progress";
import type { Question } from "@/lib/finly/types";
import { trackLessonComplete, trackQuizAttempt } from "@/lib/analytics";
import { Button } from "@/components/ui/button";
import { useLearningSession } from "@/lib/finly/learning-session";
import { publicSeo } from "@/lib/seo";

export const Route = createFileRoute("/learn/$lessonId")({
  head: ({ params }) => {
    const lesson = getLesson(params.lessonId);
    const title = lesson ? `${lesson.title} — Finly Lesson` : "Lesson — Finly";
    const description = lesson?.summary ?? "An interactive personal finance lesson on Finly.";
    const seo = publicSeo(`/learn/${params.lessonId}`, title, description, "article");
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        ...seo.meta,
        ...(lesson ? [] : [{ name: "robots", content: "noindex" }]),
      ],
      links: seo.links,
    };
  },
  component: () => { const { lessonId } = Route.useParams(); return <LessonPage key={lessonId} />; },
});

function normalize(v: string) {
  return v.trim().toLowerCase().replace(/[\s,$%]/g, "");
}

function isCorrect(q: Question, value: string) {
  if (q.kind === "choice") return String(q.answer) === value;
  const accepted = [q.answer, ...(q.accepts ?? [])].map(normalize);
  return accepted.includes(normalize(value));
}

function LessonPage() {
  const { lessonId } = Route.useParams();
  const lesson = getLesson(lessonId);
  const navigate = useNavigate();
  const { state, ready, completeLesson, toggleChallenge, isUnlocked } = useProgress();
  const { rememberLesson } = useLearningSession();
  const submitted = useRef(false);
  useEffect(() => { if (ready && lesson && isUnlocked(lesson.id)) rememberLesson(lesson.id); }, [ready, lesson, isUnlocked, rememberLesson]);

  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const [result, setResult] = useState<{ correct: number; total: number; xpGained: number } | null>(null);

  if (!lesson) {
    return (
      <AppShell>
        <h1 className="font-display text-2xl font-bold">Lesson not found</h1>
        <Link to="/learn" className="mt-4 inline-block font-semibold text-primary">
          Back to the path
        </Link>
      </AppShell>
    );
  }

  if (!ready) return <AppShell><p role="status" className="py-12 text-muted-foreground">Loading your learning progress…</p></AppShell>;

  if (!isUnlocked(lesson.id)) {
    return (
      <AppShell>
        <h1 className="font-display text-2xl font-bold">🔒 This lesson is locked</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Finish the previous lesson on the learning path to unlock “{lesson.title}”.
        </p>
        <Link to="/learn" className="mt-4 inline-block font-semibold text-primary">
          Go to the learning path
        </Link>
      </AppShell>
    );
  }

  const nextId = nextLessonId(lesson.id);
  const lessonIndex = ALL_LESSONS.findIndex((item) => item.id === lesson.id);
  const previousLesson = ALL_LESSONS[lessonIndex - 1];
  const allChecked = lesson.quiz.every((q) => checked[q.id]);

  function finish() {
    if (!lesson || !allChecked || submitted.current) return;
    submitted.current = true;
    const correct = lesson.quiz.filter((q) => isCorrect(q, answers[q.id] ?? "")).length;
    const { xpGained } = completeLesson(lesson.id, correct, lesson.quiz.length);
    setResult({ correct, total: lesson.quiz.length, xpGained });
    trackQuizAttempt(lesson.id);
    if (!state.lessons[lesson.id]) trackLessonComplete(lesson.id);
  }

  return (
    <AppShell>
      <Link to="/learn" className="text-sm font-semibold text-muted-foreground hover:text-foreground">
        ← Learning path
      </Link>

      <header className="mt-3">
        <p className="text-3xl">{lesson.emoji}</p>
        <p className="mt-2 text-xs text-muted-foreground">Lesson {lessonIndex + 1} of {ALL_LESSONS.length}</p>
        <h1 className="mt-1 font-display text-3xl font-extrabold">{lesson.title}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {lesson.minutes} min · {lesson.xp} XP · {lesson.difficulty}
        </p>
        <p className="mt-3 text-muted-foreground">{lesson.summary}</p>
      </header>

      <section className="mt-6 space-y-3 rounded-2xl border border-border bg-card p-5">
        {lesson.explanation.map((p, i) => (
          <p key={i} className="text-sm leading-relaxed">
            {p}
          </p>
        ))}
      </section>

      <section className="mt-4 rounded-2xl bg-accent-soft p-5">
        <p className="font-display font-bold">{lesson.example.title}</p>
        <p className="mt-1 text-sm">{lesson.example.body}</p>
      </section>

      <section className="mt-6">
        <h2 className="font-display text-xl font-bold">Quick check</h2>
        <QuestionCard
          question={lesson.interactive}
          value={answers[lesson.interactive.id] ?? ""}
          checked={!!checked[lesson.interactive.id]}
          onChange={(v) => setAnswers((a) => ({ ...a, [lesson.interactive.id]: v }))}
          onCheck={() => setChecked((c) => ({ ...c, [lesson.interactive.id]: true }))}
        />
      </section>

      <section className="mt-8">
        <h2 className="font-display text-xl font-bold">Quiz</h2>
        <div className="mt-3 space-y-4">
          {lesson.quiz.map((q) => (
            <QuestionCard
              key={q.id}
              question={q}
              value={answers[q.id] ?? ""}
              checked={!!checked[q.id]}
              onChange={(v) => setAnswers((a) => ({ ...a, [q.id]: v }))}
              onCheck={() => setChecked((c) => ({ ...c, [q.id]: true }))}
            />
          ))}
        </div>

        {!result ? (
          <Button
            onClick={finish}
            disabled={!allChecked}
            className="mt-5 rounded-full bg-primary px-6 py-3 font-bold text-primary-foreground disabled:opacity-50"
          >
            Finish lesson
          </Button>
        ) : (
          <div role="status" className="mt-5 rounded-2xl border border-primary bg-primary-soft p-5">
            <p className="font-display text-lg font-bold">
              {result.correct}/{result.total} correct{result.xpGained ? ` · +${result.xpGained} XP` : " · Review complete"}
            </p>
            <p className="mt-2 text-sm text-muted-foreground">Your best score is saved. Review the explanations or try again.</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Button variant="outline" onClick={() => { setAnswers({}); setChecked({}); setResult(null); submitted.current = false; }}>Retry quiz</Button>
              {nextId ? (
                <Button
                  onClick={() => {
                    setAnswers({});
                    setChecked({});
                    setResult(null);
                    navigate({ to: "/learn/$lessonId", params: { lessonId: nextId } });
                  }}
                  className="rounded-full bg-primary px-5 py-2.5 font-bold text-primary-foreground"
                >
                  Next lesson
                </Button>
              ) : null}
              <Link to="/dashboard" className="rounded-full border border-border bg-background px-5 py-2.5 font-bold">
                See progress
              </Link>
            </div>
          </div>
        )}
      </section>

      <section className="mt-8 rounded-2xl border border-border bg-card p-5">
        <p className="font-display font-bold">💪 {lesson.challenge.title}</p>
        <p className="mt-1 text-sm text-muted-foreground">{lesson.challenge.prompt}</p>
        <Button
          onClick={() => toggleChallenge(lesson.id)}
          className="mt-3 rounded-full border border-border px-4 py-2 text-sm font-semibold"
        >
          {state.challenges.includes(lesson.id) ? "✅ Challenge done (+15 XP)" : "Mark challenge done"}
        </Button>
      </section>

      <section className="mt-6">
        <h2 className="font-display text-lg font-bold">Recap</h2>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-muted-foreground">
          {lesson.recap.map((r, i) => (
            <li key={i}>{r}</li>
          ))}
        </ul>
        <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Sources</p>
        <ul className="mt-1 space-y-1 text-sm">
          {lesson.sources.map((s) => (
            <li key={s.url}>
              <a href={s.url} target="_blank" rel="noreferrer" className="text-primary hover:underline">
                {s.label}
              </a>
            </li>
          ))}
        </ul>
      </section>

      <nav aria-label="Lesson navigation" className="mt-8 flex flex-wrap items-center justify-between gap-3">
        {previousLesson ? (
          <Button asChild variant="outline">
            <Link to="/learn/$lessonId" params={{ lessonId: previousLesson.id }}>Previous lesson</Link>
          </Button>
        ) : null}
        {nextId ? (
          isUnlocked(nextId) ? (
            <Button asChild className="ml-auto">
              <Link to="/learn/$lessonId" params={{ lessonId: nextId }}>Next lesson</Link>
            </Button>
          ) : (
            <Button disabled className="ml-auto h-auto min-h-10 whitespace-normal text-left">Locked — finish this lesson first</Button>
          )
        ) : null}
      </nav>

      <Disclaimer className="mt-8" />
    </AppShell>
  );
}

function QuestionCard({
  question,
  value,
  checked,
  onChange,
  onCheck,
}: {
  question: Question;
  value: string;
  checked: boolean;
  onChange: (v: string) => void;
  onCheck: () => void;
}) {
  const correct = checked && isCorrect(question, value);

  return (
    <div className="mt-3 rounded-2xl border border-border bg-card p-5">
      <p className="font-semibold">{question.prompt}</p>

      {question.kind === "choice" ? (
        <div className="mt-3 grid gap-2">
          {question.options.map((opt, i) => {
            const selected = value === String(i);
            return (
              <Button
                key={opt}
                disabled={checked}
                aria-pressed={selected}
                variant="outline"
                onClick={() => onChange(String(i))}
                className={`h-auto min-h-11 justify-start whitespace-normal rounded-lg border px-4 py-2.5 text-left text-sm transition ${
                  selected ? "border-primary bg-primary-soft font-semibold" : "border-border bg-background"
                }`}
              >
                {opt}
              </Button>
            );
          })}
        </div>
      ) : (
        <input
          aria-label={question.prompt}
          maxLength={120}
          value={value}
          disabled={checked}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Your answer"
          className="mt-3 w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm"
        />
      )}

      {!checked ? (
        <Button
          onClick={onCheck}
          disabled={!value.trim()}
          className="mt-3 rounded-full bg-foreground px-4 py-2 text-sm font-bold text-background disabled:opacity-40"
        >
          Check
        </Button>
      ) : (
        <p role="status" className={`mt-3 rounded-xl px-3 py-2 text-sm ${correct ? "bg-primary-soft" : "bg-muted"}`}>
          {correct ? "✅ Correct. " : "❌ Not quite. "}
          {question.explanation}
        </p>
      )}
    </div>
  );
}
