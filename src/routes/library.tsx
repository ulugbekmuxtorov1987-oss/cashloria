import { publicSeo } from "@/lib/seo";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef } from "react";
import { AppShell, Disclaimer } from "@/components/finly/AppShell";
import { ALL_LESSONS, CATEGORIES } from "@/lib/finly/curriculum";
import { useProgress } from "@/lib/finly/progress";
import { Button } from "@/components/ui/button";
import { highlightParts, searchItems } from "@/lib/finly/search";

type LibrarySearch = { q?: string; category?: string };

const SEARCH_LESSONS = ALL_LESSONS.map((lesson) => ({
  id: lesson.id,
  title: lesson.title,
  summary: lesson.summary,
  category: lesson.category,
  body: [...lesson.explanation, ...lesson.recap],
  lesson,
}));

const SEARCH_TOOLS = [
  { id: "savings-goal", title: "Savings goal calculator", page: "/tools", keywords: "save goal target months" },
  { id: "loan", title: "Loan calculator", page: "/tools", keywords: "loan payment interest apr" },
  { id: "inflation", title: "Inflation calculator", page: "/tools", keywords: "inflation prices purchasing power" },
  { id: "net-worth", title: "Net worth", page: "/tools", keywords: "assets liabilities net worth" },
  { id: "budget", title: "50/30/20 budget", page: "/tools", keywords: "budget needs wants savings" },
  { id: "hourly-pay", title: "Hourly pay", page: "/tools", keywords: "hourly wage salary" },
  { id: "compound", title: "Compound interest simulator", page: "/simulators", keywords: "compound invest growth" },
  { id: "debt", title: "Debt payoff simulator", page: "/simulators", keywords: "debt avalanche snowball payoff" },
  { id: "emergency", title: "Emergency fund", page: "/simulators", keywords: "emergency fund months expenses" },
] as const;

const SEARCH_TOOL_ITEMS = SEARCH_TOOLS.map((tool) => ({
  ...tool,
  summary: "",
  category: "tools",
  body: [tool.keywords],
}));

export const Route = createFileRoute("/library")({
  validateSearch: (search: Record<string, unknown>): LibrarySearch => {
    const q = search["q"];
    const category = search["category"];
    return {
      ...(typeof q === "string" ? { q } : {}),
      ...(typeof category === "string"
        ? { category: CATEGORIES.some((c) => c.id === category) ? category : "all" }
        : {}),
    };
  },
  head: () => {
    const seo = publicSeo('/library', "Money Library — Search Every Cashloria Lesson", "Browse and search every Cashloria lesson by topic: budgeting, banking, credit, saving, investing, taxes.");
    return {
      meta: [
        { title: "Money Library — Search Every Cashloria Lesson" },
        {
          name: "description",
          content: "Browse and search every Cashloria lesson by topic: budgeting, banking, credit, saving, investing, taxes.",
        },
        { property: "og:title", content: "Money Library — Cashloria" },
        { property: "og:description", content: "Search all Cashloria lessons by topic and keyword." },
      ...seo.meta,
      ],
      links: seo.links,
    };
  },
  component: LibraryPage,
});

function LibraryPage() {
  const { isUnlocked } = useProgress();
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  const query = search.q ?? "";
  const category = search.category ?? "all";
  const searchRef = useRef<HTMLInputElement>(null);
  const setQuery = (q: string) => navigate({ search: (prev) => ({ ...prev, q }), replace: true, resetScroll: false });
  const setCategory = (value: string) => navigate({ search: (prev) => ({ ...prev, category: value }), replace: true, resetScroll: false });
  const resetSearch = () => navigate({ search: {}, replace: true, resetScroll: false });

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const focused = document.activeElement;
      if (event.key !== "/" || event.ctrlKey || event.metaKey || event.altKey ||
        (focused instanceof HTMLElement && (focused.matches("input, textarea, select") || focused.isContentEditable))) return;
      event.preventDefault();
      searchRef.current?.focus();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  const lessons = searchItems(SEARCH_LESSONS, query)
    .filter(({ item }) => category === "all" || item.category === category)
    .map(({ item }) => item.lesson);
  const tools = query.trim() ? searchItems(SEARCH_TOOL_ITEMS, query) : [];

  return (
    <AppShell>
      <h1 className="font-display text-3xl font-extrabold">Library</h1>
      <p className="mt-2 text-muted-foreground">Every lesson, searchable by topic.</p>

      <div className="relative mt-5">
        <input
          ref={searchRef}
          type="search"
          aria-label="Search lessons"
          autoComplete="off"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Escape") { e.preventDefault(); setQuery(""); } }}
          placeholder="Search lessons…"
          className="w-full rounded-xl border border-border bg-background py-2.5 pl-4 pr-20 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring [&::-webkit-search-cancel-button]:appearance-none"
        />
        {query ? (
          <Button type="button" variant="ghost" aria-label="Clear search" onClick={() => setQuery("")} className="absolute right-1 top-1/2 -translate-y-1/2">
            Clear
          </Button>
        ) : null}
      </div>

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
      <p aria-live="polite" className="mt-3 text-sm text-muted-foreground">
        {lessons.length} {lessons.length === 1 ? "lesson" : "lessons"}
      </p>

      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {lessons.map((l) => {
          const cardClass = "rounded-2xl border border-border bg-card p-4 transition";
          if (!isUnlocked(l.id)) {
            return (
              <div key={l.id} className={`${cardClass} opacity-60`}>
                <p className="text-xl">{l.emoji}</p>
                <p className="mt-1 font-semibold"><HighlightedText text={l.title} query={query} /></p>
                <p className="mt-1 line-clamp-2 text-xs text-muted-foreground"><HighlightedText text={l.summary} query={query} /></p>
                <p className="mt-2 text-xs text-muted-foreground">🔒 Locked — finish earlier lessons first</p>
              </div>
            );
          }
          return (
            <Link
              key={l.id}
              to="/learn/$lessonId"
              params={{ lessonId: l.id }}
              className={`${cardClass} hover:shadow-md`}
            >
              <p className="text-xl">{l.emoji}</p>
              <p className="mt-1 font-semibold"><HighlightedText text={l.title} query={query} /></p>
              <p className="mt-1 line-clamp-2 text-xs text-muted-foreground"><HighlightedText text={l.summary} query={query} /></p>
            </Link>
          );
        })}
        {lessons.length === 0 ? (
          <div className="sm:col-span-2 lg:col-span-3">
            <p className="text-sm text-muted-foreground">No lessons match “{query}”.</p>
            <Button type="button" variant="outline" onClick={resetSearch} className="mt-3">Reset search</Button>
          </div>
        ) : null}
      </div>

      {tools.length > 0 ? (
        <section className="mt-8" aria-labelledby="tools-search-heading">
          <h2 id="tools-search-heading" className="font-display text-xl font-bold">Tools &amp; simulators</h2>
          <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {tools.map(({ item }) => (
              <Link key={item.id} to={item.page} className="rounded-2xl border border-border bg-card p-4 font-semibold transition hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                <HighlightedText text={item.title} query={query} />
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      <Disclaimer className="mt-8" />
    </AppShell>
  );
}

function Chip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <Button
      type="button"
      variant="ghost"
      aria-pressed={active}
      onClick={onClick}
      className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
        active ? "bg-primary text-primary-foreground" : "border border-border bg-background"
      }`}
    >
      {label}
    </Button>
  );
}

function HighlightedText({ text, query }: { text: string; query: string }) {
  return highlightParts(text, query).map((part, index) => part.match
    ? <mark key={index} className="rounded bg-primary-soft px-0.5 text-foreground">{part.text}</mark>
    : <span key={index}>{part.text}</span>);
}
