import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

export type LessonRow = {
  id: string;
  slug: string;
  title: string;
  summary: string;
  emoji: string;
  category: string;
  difficulty: string;
  minutes: number;
  xp: number;
  explanation: string[];
  status: string;
  sort_order: number;
};

type QuizRow = {
  id?: string;
  kind: string;
  type: string;
  prompt: string;
  options: string[];
  answer: string;
  explanation: string;
  xp: number;
  sort_order: number;
};

type SourceRow = {
  id?: string;
  title: string;
  url: string;
  organization: string | null;
  sort_order: number;
};

const emptyQuiz = (i: number): QuizRow => ({
  kind: "choice",
  type: "multiple-choice",
  prompt: "",
  options: ["", ""],
  answer: "0",
  explanation: "",
  xp: 5,
  sort_order: i,
});

export function LessonEditor({ lessonId, onSaved }: { lessonId: string | "new"; onSaved: () => void }) {
  const [lesson, setLesson] = useState<LessonRow | null>(null);
  const [quiz, setQuiz] = useState<QuizRow[]>([]);
  const [sources, setSources] = useState<SourceRow[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let active = true;
    async function load() {
      if (lessonId === "new") {
        setLesson({
          id: "",
          slug: "",
          title: "",
          summary: "",
          emoji: "📘",
          category: "money-basics",
          difficulty: "beginner",
          minutes: 5,
          xp: 20,
          explanation: [""],
          status: "draft",
          sort_order: 0,
        });
        setQuiz([]);
        setSources([]);
        return;
      }
      const [l, q, s] = await Promise.all([
        supabase.from("lessons").select("*").eq("id", lessonId).maybeSingle(),
        supabase.from("quiz_questions").select("*").eq("lesson_id", lessonId).order("sort_order"),
        supabase.from("lesson_sources").select("*").eq("lesson_id", lessonId).order("sort_order"),
      ]);
      if (!active) return;
      if (l.data) {
        setLesson({
          ...l.data,
          explanation: Array.isArray(l.data.explanation) ? (l.data.explanation as string[]) : [""],
        });
      }
      setQuiz(
        (q.data ?? []).map((row, i) => ({
          id: row.id,
          kind: row.kind,
          type: row.type,
          prompt: row.prompt,
          options: Array.isArray(row.options) ? (row.options as string[]) : [],
          answer: row.answer,
          explanation: row.explanation,
          xp: row.xp,
          sort_order: row.sort_order ?? i,
        })),
      );
      setSources(
        (s.data ?? []).map((row, i) => ({
          id: row.id,
          title: row.title,
          url: row.url,
          organization: row.organization,
          sort_order: row.sort_order ?? i,
        })),
      );
    }
    void load();
    return () => {
      active = false;
    };
  }, [lessonId]);

  if (!lesson) return <p className="text-sm text-muted-foreground">Loading lesson…</p>;

  function set<K extends keyof LessonRow>(key: K, value: LessonRow[K]) {
    setLesson((prev) => (prev ? { ...prev, [key]: value } : prev));
  }

  async function save(status?: string) {
    if (!lesson) return;
    setSaving(true);
    try {
      const payload = {
        slug: lesson.slug.trim(),
        title: lesson.title.trim(),
        summary: lesson.summary,
        emoji: lesson.emoji,
        category: lesson.category,
        difficulty: lesson.difficulty,
        minutes: Number(lesson.minutes) || 1,
        xp: Number(lesson.xp) || 0,
        explanation: lesson.explanation.filter((p) => p.trim().length > 0),
        status: status ?? lesson.status,
        sort_order: Number(lesson.sort_order) || 0,
      };
      if (!payload.slug || !payload.title) throw new Error("Slug and title are required");

      let id = lesson.id;
      if (id) {
        const { error } = await supabase.from("lessons").update(payload).eq("id", id);
        if (error) throw error;
      } else {
        const { data, error } = await supabase.from("lessons").insert(payload).select("id").single();
        if (error) throw error;
        id = data.id;
      }

      await supabase.from("quiz_questions").delete().eq("lesson_id", id);
      if (quiz.length) {
        const { error } = await supabase.from("quiz_questions").insert(
          quiz.map((q, i) => ({
            lesson_id: id,
            kind: q.kind,
            type: q.type,
            prompt: q.prompt,
            options: q.kind === "choice" ? q.options : [],
            answer: q.answer,
            explanation: q.explanation,
            xp: Number(q.xp) || 0,
            sort_order: i,
          })),
        );
        if (error) throw error;
      }

      await supabase.from("lesson_sources").delete().eq("lesson_id", id);
      if (sources.length) {
        const { error } = await supabase.from("lesson_sources").insert(
          sources.map((s, i) => ({
            lesson_id: id,
            title: s.title,
            url: s.url,
            organization: s.organization,
            sort_order: i,
          })),
        );
        if (error) throw error;
      }

      setLesson({ ...lesson, id, status: payload.status });
      toast.success(payload.status === "published" ? "Lesson published" : "Lesson saved");
      onSaved();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save lesson");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <section className="space-y-4 rounded-2xl border border-border bg-card p-5">
        <h3 className="font-display text-lg font-bold">Lesson details</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Title">
            <Input value={lesson.title} onChange={(e) => set("title", e.target.value)} />
          </Field>
          <Field label="Slug (URL)">
            <Input value={lesson.slug} onChange={(e) => set("slug", e.target.value)} />
          </Field>
          <Field label="Emoji">
            <Input value={lesson.emoji} onChange={(e) => set("emoji", e.target.value)} />
          </Field>
          <Field label="Category">
            <Input value={lesson.category} onChange={(e) => set("category", e.target.value)} />
          </Field>
          <Field label="Difficulty">
            <select
              className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
              value={lesson.difficulty}
              onChange={(e) => set("difficulty", e.target.value)}
            >
              <option value="beginner">beginner</option>
              <option value="intermediate">intermediate</option>
              <option value="advanced">advanced</option>
            </select>
          </Field>
          <Field label="Minutes">
            <Input type="number" value={lesson.minutes} onChange={(e) => set("minutes", Number(e.target.value))} />
          </Field>
          <Field label="XP">
            <Input type="number" value={lesson.xp} onChange={(e) => set("xp", Number(e.target.value))} />
          </Field>
          <Field label="Order">
            <Input
              type="number"
              value={lesson.sort_order}
              onChange={(e) => set("sort_order", Number(e.target.value))}
            />
          </Field>
        </div>
        <Field label="Summary">
          <Textarea rows={2} value={lesson.summary} onChange={(e) => set("summary", e.target.value)} />
        </Field>
        <Field label="Explanation (one paragraph per block)">
          <div className="space-y-2">
            {lesson.explanation.map((p, i) => (
              <Textarea
                key={i}
                rows={3}
                value={p}
                onChange={(e) => {
                  const next = [...lesson.explanation];
                  next[i] = e.target.value;
                  set("explanation", next);
                }}
              />
            ))}
            <Button variant="outline" size="sm" onClick={() => set("explanation", [...lesson.explanation, ""])}>
              Add paragraph
            </Button>
          </div>
        </Field>
      </section>

      <section className="space-y-4 rounded-2xl border border-border bg-card p-5">
        <div className="flex items-center justify-between">
          <h3 className="font-display text-lg font-bold">Quiz questions</h3>
          <Button variant="outline" size="sm" onClick={() => setQuiz([...quiz, emptyQuiz(quiz.length)])}>
            Add question
          </Button>
        </div>
        {quiz.length === 0 && <p className="text-sm text-muted-foreground">No questions yet.</p>}
        {quiz.map((q, i) => (
          <div key={i} className="space-y-3 rounded-xl border border-border p-4">
            <div className="flex items-center justify-between gap-3">
              <select
                className="h-9 rounded-md border border-input bg-background px-2 text-sm"
                value={q.type}
                onChange={(e) => {
                  const type = e.target.value;
                  const kind = type === "fill-blank" || type === "calculate-input" ? "input" : "choice";
                  setQuiz(quiz.map((x, j) => (j === i ? { ...x, type, kind, answer: kind === "choice" ? "0" : "" } : x)));
                }}
              >
                <option value="multiple-choice">Multiple choice</option>
                <option value="true-false">True / false</option>
                <option value="fill-blank">Fill in the blank</option>
                <option value="calculate-input">Calculation</option>
              </select>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setQuiz(quiz.filter((_, j) => j !== i))}
              >
                Remove
              </Button>
            </div>
            <Textarea
              rows={2}
              placeholder="Question prompt"
              value={q.prompt}
              onChange={(e) => setQuiz(quiz.map((x, j) => (j === i ? { ...x, prompt: e.target.value } : x)))}
            />
            {q.kind === "choice" ? (
              <div className="space-y-2">
                {(q.type === "true-false" ? ["True", "False"] : q.options).map((opt, oi) => (
                  <div key={oi} className="flex items-center gap-2">
                    <input
                      type="radio"
                      checked={String(q.answer) === String(oi)}
                      onChange={() => setQuiz(quiz.map((x, j) => (j === i ? { ...x, answer: String(oi) } : x)))}
                    />
                    <Input
                      value={opt}
                      disabled={q.type === "true-false"}
                      onChange={(e) => {
                        const options = [...q.options];
                        options[oi] = e.target.value;
                        setQuiz(quiz.map((x, j) => (j === i ? { ...x, options } : x)));
                      }}
                    />
                  </div>
                ))}
                {q.type !== "true-false" && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setQuiz(quiz.map((x, j) => (j === i ? { ...x, options: [...x.options, ""] } : x)))}
                  >
                    Add option
                  </Button>
                )}
              </div>
            ) : (
              <Input
                placeholder="Correct answer"
                value={q.answer}
                onChange={(e) => setQuiz(quiz.map((x, j) => (j === i ? { ...x, answer: e.target.value } : x)))}
              />
            )}
            <Textarea
              rows={2}
              placeholder="Explanation shown after answering"
              value={q.explanation}
              onChange={(e) => setQuiz(quiz.map((x, j) => (j === i ? { ...x, explanation: e.target.value } : x)))}
            />
          </div>
        ))}
      </section>

      <section className="space-y-4 rounded-2xl border border-border bg-card p-5">
        <div className="flex items-center justify-between">
          <h3 className="font-display text-lg font-bold">Sources</h3>
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              setSources([...sources, { title: "", url: "", organization: "", sort_order: sources.length }])
            }
          >
            Add source
          </Button>
        </div>
        {sources.length === 0 && <p className="text-sm text-muted-foreground">No sources yet.</p>}
        {sources.map((s, i) => (
          <div key={i} className="grid gap-2 rounded-xl border border-border p-4 sm:grid-cols-[1fr_1fr_auto]">
            <Input
              placeholder="Source title"
              value={s.title}
              onChange={(e) => setSources(sources.map((x, j) => (j === i ? { ...x, title: e.target.value } : x)))}
            />
            <Input
              placeholder="https://…"
              value={s.url}
              onChange={(e) => setSources(sources.map((x, j) => (j === i ? { ...x, url: e.target.value } : x)))}
            />
            <Button variant="ghost" size="sm" onClick={() => setSources(sources.filter((_, j) => j !== i))}>
              Remove
            </Button>
            <Input
              className="sm:col-span-3"
              placeholder="Organization (optional)"
              value={s.organization ?? ""}
              onChange={(e) =>
                setSources(sources.map((x, j) => (j === i ? { ...x, organization: e.target.value } : x)))
              }
            />
          </div>
        ))}
      </section>

      <div className="flex flex-wrap gap-3">
        <Button onClick={() => void save("draft")} variant="outline" disabled={saving}>
          Save draft
        </Button>
        <Button onClick={() => void save("published")} disabled={saving}>
          {saving ? "Saving…" : "Publish"}
        </Button>
        <span className="self-center text-sm text-muted-foreground">Status: {lesson.status}</span>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {children}
    </div>
  );
}
