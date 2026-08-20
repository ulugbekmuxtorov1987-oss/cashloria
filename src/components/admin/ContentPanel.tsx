import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

type Block = {
  id?: string;
  key: string;
  label: string;
  title: string;
  body: string;
  status: string;
};

const SUGGESTED: { key: string; label: string }[] = [
  { key: "home_hero", label: "Homepage hero" },
  { key: "about", label: "About section" },
  { key: "faq", label: "FAQ" },
  { key: "footer", label: "Footer" },
  { key: "disclaimer", label: "Disclaimer" },
  { key: "articles", label: "Educational articles" },
  { key: "explanations", label: "Financial explanations" },
];

export function ContentPanel() {
  const queryClient = useQueryClient();
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    const { data } = await supabase.from("content_blocks").select("*").order("label");
    const existing = (data ?? []) as Block[];
    const missing = SUGGESTED.filter((s) => !existing.some((b) => b.key === s.key)).map((s) => ({
      key: s.key,
      label: s.label,
      title: "",
      body: "",
      status: "draft",
    }));
    setBlocks([...existing, ...missing]);
    setLoading(false);
  }

  useEffect(() => {
    void load();
  }, []);

  async function save(block: Block, status: string) {
    const payload = {
      key: block.key,
      label: block.label,
      title: block.title,
      body: block.body,
      status,
    };
    const { error } = await supabase.from("content_blocks").upsert(payload, { onConflict: "key" });
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(status === "published" ? "Published" : "Draft saved");
    void queryClient.invalidateQueries({ queryKey: ["content-blocks"] });
    void load();
  }

  if (loading) return <p className="text-sm text-muted-foreground">Loading content…</p>;

  return (
    <div className="space-y-5">
      <p className="text-sm text-muted-foreground">
        Text you edit here appears on the public website. Drafts stay hidden until you publish them.
      </p>
      {blocks.map((b, i) => (
        <section key={b.key} className="space-y-3 rounded-2xl border border-border bg-card p-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="font-display text-lg font-bold">{b.label}</h3>
            <span
              className={`rounded-full px-2.5 py-1 text-xs font-bold ${
                b.status === "published" ? "bg-primary-soft" : "bg-muted text-muted-foreground"
              }`}
            >
              {b.status}
            </span>
          </div>
          <div className="space-y-1.5">
            <Label>Heading</Label>
            <Input
              value={b.title}
              onChange={(e) => setBlocks(blocks.map((x, j) => (j === i ? { ...x, title: e.target.value } : x)))}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Text</Label>
            <Textarea
              rows={4}
              value={b.body}
              onChange={(e) => setBlocks(blocks.map((x, j) => (j === i ? { ...x, body: e.target.value } : x)))}
            />
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => void save(b, "draft")}>
              Save draft
            </Button>
            <Button size="sm" onClick={() => void save(b, "published")}>
              Publish
            </Button>
          </div>
        </section>
      ))}
    </div>
  );
}
