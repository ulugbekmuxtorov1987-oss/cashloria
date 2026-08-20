import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

type LevelRow = {
  id: string;
  number: number;
  title: string;
  subtitle: string;
  emoji: string;
  sort_order: number;
  locked: boolean;
  published: boolean;
};

export function LevelsPanel() {
  const queryClient = useQueryClient();
  const [draft, setDraft] = useState<Record<string, Partial<LevelRow>>>({});

  const levelsQuery = useQuery({
    queryKey: ["admin-levels"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("levels")
        .select("id, number, title, subtitle, emoji, sort_order, locked, published")
        .order("sort_order");
      if (error) throw error;
      return data as LevelRow[];
    },
  });

  const levels = levelsQuery.data ?? [];

  function value<K extends keyof LevelRow>(l: LevelRow, key: K): LevelRow[K] {
    const d = draft[l.id]?.[key];
    return (d === undefined ? l[key] : d) as LevelRow[K];
  }

  function edit(id: string, patch: Partial<LevelRow>) {
    setDraft((prev) => ({ ...prev, [id]: { ...prev[id], ...patch } }));
  }

  async function saveLevel(l: LevelRow) {
    const patch = draft[l.id];
    if (!patch) return;
    const { error } = await supabase.from("levels").update(patch).eq("id", l.id);
    if (error) {
      toast.error(error.message);
      return;
    }
    setDraft((prev) => {
      const next = { ...prev };
      delete next[l.id];
      return next;
    });
    toast.success("Level saved");
    void queryClient.invalidateQueries({ queryKey: ["admin-levels"] });
  }

  async function addLevel() {
    const number = (levels.at(-1)?.number ?? 0) + 1;
    const { error } = await supabase.from("levels").insert({
      number,
      title: `Level ${number}`,
      subtitle: "",
      emoji: "📘",
      sort_order: number,
      published: false,
    });
    if (error) {
      toast.error(error.message);
      return;
    }
    void queryClient.invalidateQueries({ queryKey: ["admin-levels"] });
  }

  async function removeLevel(id: string) {
    if (!window.confirm("Delete this level? Lessons stay but lose their level.")) return;
    const { error } = await supabase.from("levels").delete().eq("id", id);
    if (error) {
      toast.error(error.message);
      return;
    }
    void queryClient.invalidateQueries({ queryKey: ["admin-levels"] });
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">Create levels, set their order and lock or publish them.</p>
        <Button size="sm" onClick={() => void addLevel()}>
          Add level
        </Button>
      </div>

      {levelsQuery.isLoading && <p className="text-sm text-muted-foreground">Loading levels…</p>}
      {!levelsQuery.isLoading && levels.length === 0 && (
        <p className="rounded-2xl border border-border bg-card p-4 text-sm text-muted-foreground">
          No levels yet — add your first one.
        </p>
      )}

      {levels.map((l) => (
        <section key={l.id} className="space-y-3 rounded-2xl border border-border bg-card p-5">
          <div className="grid gap-3 sm:grid-cols-4">
            <Field label="Number">
              <Input
                type="number"
                value={value(l, "number")}
                onChange={(e) => edit(l.id, { number: Number(e.target.value) })}
              />
            </Field>
            <Field label="Emoji">
              <Input value={value(l, "emoji")} onChange={(e) => edit(l.id, { emoji: e.target.value })} />
            </Field>
            <Field label="Title">
              <Input value={value(l, "title")} onChange={(e) => edit(l.id, { title: e.target.value })} />
            </Field>
            <Field label="Order">
              <Input
                type="number"
                value={value(l, "sort_order")}
                onChange={(e) => edit(l.id, { sort_order: Number(e.target.value) })}
              />
            </Field>
          </div>
          <Field label="Description">
            <Input value={value(l, "subtitle")} onChange={(e) => edit(l.id, { subtitle: e.target.value })} />
          </Field>
          <div className="flex flex-wrap items-center gap-4">
            <label className="flex items-center gap-2 text-sm font-semibold">
              <input
                type="checkbox"
                checked={value(l, "published")}
                onChange={(e) => edit(l.id, { published: e.target.checked })}
              />
              Published
            </label>
            <label className="flex items-center gap-2 text-sm font-semibold">
              <input
                type="checkbox"
                checked={value(l, "locked")}
                onChange={(e) => edit(l.id, { locked: e.target.checked })}
              />
              Lessons locked
            </label>
            <div className="ml-auto flex gap-2">
              <Button size="sm" disabled={!draft[l.id]} onClick={() => void saveLevel(l)}>
                Save
              </Button>
              <Button size="sm" variant="ghost" onClick={() => void removeLevel(l.id)}>
                Delete
              </Button>
            </div>
          </div>
        </section>
      ))}
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
