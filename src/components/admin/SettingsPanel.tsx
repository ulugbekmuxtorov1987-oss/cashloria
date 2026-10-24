import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ImageUpload } from "@/components/admin/ImageUpload";
import { toast } from "sonner";
import { safeEmail, safeHttpUrl } from "@/lib/finly/safe-url";

type Settings = {
  site_name: string;
  site_description: string;
  author_name: string;
  contact_email: string;
  instagram_url: string;
  telegram_url: string;
  extra_links: { label: string; url: string }[];
  default_language: string;
  seo_title: string;
  seo_description: string;
  logo_url: string | null;
  favicon_url: string | null;
  avatar_url: string | null;
  social_image_url: string | null;
  ga_measurement_id: string;
};

export function SettingsPanel() {
  const queryClient = useQueryClient();
  const [s, setS] = useState<Settings | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let active = true;
    void (async () => {
      const { data } = await supabase.from("site_settings").select("*").eq("id", 1).maybeSingle();
      if (!active || !data) return;
      setS({
        site_name: data.site_name ?? "",
        site_description: data.site_description ?? "",
        author_name: data.author_name ?? "",
        contact_email: data.contact_email ?? "",
        instagram_url: data.instagram_url ?? "",
        telegram_url: data.telegram_url ?? "",
        extra_links: Array.isArray(data.extra_links) ? (data.extra_links as { label: string; url: string }[]) : [],
        default_language: data.default_language ?? "en",
        seo_title: data.seo_title ?? "",
        seo_description: data.seo_description ?? "",
        logo_url: data.logo_url,
        favicon_url: data.favicon_url,
        avatar_url: data.avatar_url,
        social_image_url: data.social_image_url,
        ga_measurement_id: data.ga_measurement_id ?? "",
      });
    })();
    return () => {
      active = false;
    };
  }, []);

  if (!s) return <p className="text-sm text-muted-foreground">Loading settings…</p>;

  function set<K extends keyof Settings>(key: K, value: Settings[K]) {
    setS((prev) => (prev ? { ...prev, [key]: value } : prev));
  }

  async function save() {
    if (!s) return;
    const urls = [
      { field: "Instagram URL", value: s.instagram_url },
      { field: "Telegram URL", value: s.telegram_url },
      ...s.extra_links.map((link, index) => ({ field: `${link.label || `Other social link ${index + 1}`} URL`, value: link.url })),
    ];
    for (const { field, value } of urls) {
      if (value.trim() && !safeHttpUrl(value)) {
        toast.error(`${field} must start with http:// or https://`);
        return;
      }
    }
    if (s.contact_email.trim() && !safeEmail(s.contact_email)) {
      toast.error("Contact email must be a valid email address (max 254 characters)");
      return;
    }
    setSaving(true);
    const { error } = await supabase
      .from("site_settings")
      .update({
        site_name: s.site_name.trim() || "Cashloria",
        site_description: s.site_description,
        author_name: s.author_name,
        contact_email: s.contact_email || null,
        instagram_url: s.instagram_url || null,
        telegram_url: s.telegram_url || null,
        extra_links: s.extra_links.filter((l) => l.label && l.url),
        default_language: s.default_language,
        seo_title: s.seo_title || null,
        seo_description: s.seo_description || null,
        logo_url: s.logo_url,
        favicon_url: s.favicon_url,
        avatar_url: s.avatar_url,
        social_image_url: s.social_image_url,
        ga_measurement_id: s.ga_measurement_id || null,
      })
      .eq("id", 1);
    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Website settings saved");
    void queryClient.invalidateQueries({ queryKey: ["site-settings"] });
  }

  return (
    <div className="space-y-6">
      <section className="space-y-4 rounded-2xl border border-border bg-card p-5">
        <h3 className="font-display text-lg font-bold">Basics</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Website name">
            <Input value={s.site_name} onChange={(e) => set("site_name", e.target.value)} />
          </Field>
          <Field label="Author / brand name">
            <Input value={s.author_name} onChange={(e) => set("author_name", e.target.value)} />
          </Field>
          <Field label="Contact email">
            <Input value={s.contact_email} onChange={(e) => set("contact_email", e.target.value)} />
          </Field>
          <Field label="Default language">
            <select
              className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
              value={s.default_language}
              onChange={(e) => set("default_language", e.target.value)}
            >
              <option value="en">English</option>
              <option value="uz">Oʻzbekcha</option>
              <option value="ru">Русский</option>
            </select>
          </Field>
        </div>
        <Field label="Site description">
          <Textarea rows={2} value={s.site_description} onChange={(e) => set("site_description", e.target.value)} />
        </Field>
      </section>

      <section className="space-y-4 rounded-2xl border border-border bg-card p-5">
        <h3 className="font-display text-lg font-bold">Images</h3>
        <div className="grid gap-5 sm:grid-cols-2">
          <ImageUpload label="Logo" value={s.logo_url} onChange={(v) => set("logo_url", v)} />
          <ImageUpload label="Favicon" value={s.favicon_url} onChange={(v) => set("favicon_url", v)} />
          <ImageUpload label="Website avatar" value={s.avatar_url} onChange={(v) => set("avatar_url", v)} />
          <ImageUpload
            label="Social sharing image"
            value={s.social_image_url}
            onChange={(v) => set("social_image_url", v)}
          />
        </div>
      </section>

      <section className="space-y-4 rounded-2xl border border-border bg-card p-5">
        <h3 className="font-display text-lg font-bold">Links & SEO</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Instagram URL">
            <Input value={s.instagram_url} onChange={(e) => set("instagram_url", e.target.value)} />
          </Field>
          <Field label="Telegram URL">
            <Input value={s.telegram_url} onChange={(e) => set("telegram_url", e.target.value)} />
          </Field>
          <Field label="SEO title">
            <Input value={s.seo_title} onChange={(e) => set("seo_title", e.target.value)} />
          </Field>
          <Field label="Google Analytics ID (optional)">
            <Input
              placeholder="G-XXXXXXX"
              value={s.ga_measurement_id}
              onChange={(e) => set("ga_measurement_id", e.target.value)}
            />
          </Field>
        </div>
        <Field label="SEO description">
          <Textarea rows={2} value={s.seo_description} onChange={(e) => set("seo_description", e.target.value)} />
        </Field>

        <div className="space-y-2">
          <Label>Other social links</Label>
          {s.extra_links.map((l, i) => (
            <div key={i} className="grid gap-2 sm:grid-cols-[1fr_2fr_auto]">
              <Input
                placeholder="Label"
                value={l.label}
                onChange={(e) =>
                  set("extra_links", s.extra_links.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)))
                }
              />
              <Input
                placeholder="https://…"
                value={l.url}
                onChange={(e) =>
                  set("extra_links", s.extra_links.map((x, j) => (j === i ? { ...x, url: e.target.value } : x)))
                }
              />
              <Button
                variant="ghost"
                size="sm"
                onClick={() => set("extra_links", s.extra_links.filter((_, j) => j !== i))}
              >
                Remove
              </Button>
            </div>
          ))}
          <Button
            variant="outline"
            size="sm"
            onClick={() => set("extra_links", [...s.extra_links, { label: "", url: "" }])}
          >
            Add link
          </Button>
        </div>
      </section>

      <Button onClick={() => void save()} disabled={saving}>
        {saving ? "Saving…" : "Save settings"}
      </Button>
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
