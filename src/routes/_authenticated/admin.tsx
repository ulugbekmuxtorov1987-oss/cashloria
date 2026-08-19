import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { LessonEditor } from "@/components/admin/LessonEditor";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({
    meta: [
      { title: "Admin — Finly" },
      { name: "description", content: "Manage Finly lessons, quizzes, sources and see site activity." },
      { property: "og:title", content: "Admin — Finly" },
      { property: "og:description", content: "Manage Finly lessons, quizzes, sources and see site activity." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminPage,
});

function startOfToday() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

function AdminPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [selected, setSelected] = useState<string | null>(null);

  const roleQuery = useQuery({
    queryKey: ["is-admin"],
    queryFn: async () => {
      const { data: userData } = await supabase.auth.getUser();
      const uid = userData.user?.id;
      if (!uid) return false;
      const { data } = await supabase.rpc("has_role", { _user_id: uid, _role: "admin" });
      return Boolean(data);
    },
  });

  const isAdmin = roleQuery.data === true;

  const statsQuery = useQuery({
    queryKey: ["admin-stats"],
    enabled: isAdmin,
    queryFn: async () => {
      const since = startOfToday();
      const [views, completes, allCompletes] = await Promise.all([
        supabase
          .from("analytics_events")
          .select("visitor_id")
          .eq("event_type", "page_view")
          .gte("created_at", since),
        supabase
          .from("analytics_events")
          .select("id", { count: "exact", head: true })
          .eq("event_type", "lesson_complete")
          .gte("created_at", since),
        supabase
          .from("analytics_events")
          .select("id", { count: "exact", head: true })
          .eq("event_type", "lesson_complete"),
      ]);
      const visitorsToday = new Set((views.data ?? []).map((r) => r.visitor_id ?? "anon")).size;
      return {
        visitorsToday,
        pageViewsToday: views.data?.length ?? 0,
        lessonsCompletedToday: completes.count ?? 0,
        lessonsCompletedTotal: allCompletes.count ?? 0,
      };
    },
  });

  const lessonsQuery = useQuery({
    queryKey: ["admin-lessons"],
    enabled: isAdmin,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("lessons")
        .select("id, title, slug, status, sort_order, emoji")
        .order("sort_order");
      if (error) throw error;
      return data;
    },
  });

  async function signOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  async function remove(id: string) {
    if (!window.confirm("Delete this lesson and its quiz and sources?")) return;
    const { error } = await supabase.from("lessons").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Lesson deleted");
    if (selected === id) setSelected(null);
    void queryClient.invalidateQueries({ queryKey: ["admin-lessons"] });
  }

  if (roleQuery.isLoading) {
    return <Centered>Checking your access…</Centered>;
  }

  if (!isAdmin) {
    return (
      <Centered>
        <p className="font-display text-xl font-bold">You don't have admin access</p>
        <p className="mt-2 text-sm text-muted-foreground">
          Ask the site owner to grant your account the administrator role.
        </p>
        <Button className="mt-4" variant="outline" onClick={() => void signOut()}>
          Sign out
        </Button>
      </Centered>
    );
  }

  const stats = statsQuery.data;

  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-extrabold">Admin</h1>
          <p className="text-sm text-muted-foreground">Manage lessons, quizzes and sources.</p>
        </div>
        <div className="flex gap-2">
          <Link to="/" className="inline-flex items-center rounded-md border border-border px-3 py-2 text-sm font-semibold">
            View site
          </Link>
          <Button variant="outline" onClick={() => void signOut()}>
            Sign out
          </Button>
        </div>
      </header>

      <section className="mt-6 grid gap-3 sm:grid-cols-4">
        <Stat label="Visitors today" value={stats?.visitorsToday ?? "—"} />
        <Stat label="Page views today" value={stats?.pageViewsToday ?? "—"} />
        <Stat label="Lessons completed today" value={stats?.lessonsCompletedToday ?? "—"} />
        <Stat label="Lessons completed (all time)" value={stats?.lessonsCompletedTotal ?? "—"} />
      </section>

      <section className="mt-8">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-xl font-bold">Lessons</h2>
          <Button size="sm" onClick={() => setSelected("new")}>
            New lesson
          </Button>
        </div>

        <div className="mt-3 divide-y divide-border rounded-2xl border border-border bg-card">
          {lessonsQuery.isLoading && <p className="p-4 text-sm text-muted-foreground">Loading lessons…</p>}
          {lessonsQuery.data?.length === 0 && (
            <p className="p-4 text-sm text-muted-foreground">No lessons yet — create your first one.</p>
          )}
          {lessonsQuery.data?.map((l) => (
            <div key={l.id} className="flex flex-wrap items-center justify-between gap-2 p-4">
              <div>
                <p className="font-semibold">
                  {l.emoji} {l.title}
                </p>
                <p className="text-xs text-muted-foreground">
                  /{l.slug} · {l.status}
                </p>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => setSelected(l.id)}>
                  Edit
                </Button>
                <Button size="sm" variant="ghost" onClick={() => void remove(l.id)}>
                  Delete
                </Button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {selected && (
        <section className="mt-8">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-xl font-bold">
              {selected === "new" ? "New lesson" : "Edit lesson"}
            </h2>
            <Button size="sm" variant="ghost" onClick={() => setSelected(null)}>
              Close
            </Button>
          </div>
          <div className="mt-3">
            <LessonEditor
              key={selected}
              lessonId={selected}
              onSaved={() => void queryClient.invalidateQueries({ queryKey: ["admin-lessons"] })}
            />
          </div>
        </section>
      )}
    </main>
  );
}

function Stat({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-1 font-display text-2xl font-extrabold">{value}</p>
    </div>
  );
}

function Centered({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex min-h-screen items-center justify-center px-4 text-center">
      <div>{children}</div>
    </main>
  );
}
