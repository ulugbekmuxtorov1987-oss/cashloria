import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell, Disclaimer } from "@/components/finly/AppShell";
import { ALL_LESSONS, CATEGORIES } from "@/lib/finly/curriculum";

export const Route = createFileRoute("/library")({
  head: () => ({
    meta: [
      { title: "Money Library — Search Every Finly Lesson" },
      {
        name: "description",
        content: "Browse and search every Finly lesson by topic: budgeting, banking, credit, saving, investing, taxes.",
      },
      { property: "og:title", content: "Money Library — Finly" },
      { property: "og:description", content: "Search all Finly lessons by topic and keyword." },
    ],
  }),
  component: LibraryPage,
});

function LibraryPage() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string>("all");

  const q = query.trim().toLowerCase();
  const lessons = ALL_LESSONS.filter(
    (l) =>
      (category === "all" || l.category === category) &&
      (!q || l.title.toLowerCase().includes(q) || l.summary.toLowerCase().includes(q)),
  );

  return (
    <AppShell>
      <h1 className="font-display text-3xl font-extrabold">Library</h1>
      <p className="mt-2 text-muted-foreground">Every lesson, searchable by topic.</p>

      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search lessons…"
        className="mt-5 w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm"
      />

      <div className="mt-3 flex flex-wrap gap-2">
        <Chip active={category === "all"} onClick={() => setCategory("all")} label="All" />
        {CATEGORIES.map((c) => (
          <Chip
            key={c.id}
            active={category === c.id}
            onClick={() => setCategory(c.id)}
            label={`${c.emoji} ${c.label}`}
          />
        ))}
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {lessons.map((l) => (
          <Link
            key={l.id}
            to="/learn/$lessonId"
            params={{ lessonId: l.id }}
            className="rounded-2xl border border-border bg-card p-4 transition hover:shadow-md"
          >
            <p className="text-xl">{l.emoji}</p>
            <p className="mt-1 font-semibold">{l.title}</p>
            <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{l.summary}</p>
          </Link>
        ))}
        {lessons.length === 0 ? <p className="text-sm text-muted-foreground">No lessons match that search.</p> : null}
      </div>

      <Disclaimer className="mt-8" />
    </AppShell>
  );
}

function Chip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
        active ? "bg-primary text-primary-foreground" : "border border-border bg-background"
      }`}
    >
      {label}
    </button>
  );
}
