import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type SiteSettings = {
  site_name: string;
  site_description: string;
  author_name: string;
  contact_email: string | null;
  instagram_url: string | null;
  telegram_url: string | null;
  extra_links: { label: string; url: string }[];
  default_language: string;
  seo_title: string | null;
  seo_description: string | null;
  logo_url: string | null;
  favicon_url: string | null;
  avatar_url: string | null;
  social_image_url: string | null;
  ga_measurement_id: string | null;
};

export function useSiteSettings() {
  return useQuery({
    queryKey: ["site-settings"],
    staleTime: 60_000,
    queryFn: async (): Promise<SiteSettings | null> => {
      const { data } = await supabase.from("site_settings").select("*").eq("id", 1).maybeSingle();
      if (!data) return null;
      return {
        ...data,
        extra_links: Array.isArray(data.extra_links)
          ? (data.extra_links as { label: string; url: string }[])
          : [],
      };
    },
  });
}

export type ContentBlock = { key: string; label: string; title: string; body: string; status: string };

export function useContentBlocks() {
  return useQuery({
    queryKey: ["content-blocks"],
    staleTime: 60_000,
    queryFn: async (): Promise<Record<string, ContentBlock>> => {
      const { data } = await supabase
        .from("content_blocks")
        .select("key, label, title, body, status")
        .eq("status", "published");
      const map: Record<string, ContentBlock> = {};
      for (const row of data ?? []) map[row.key] = row;
      return map;
    },
  });
}

/** Extra lesson sources managed from the admin dashboard, keyed by lesson slug. */
export function useLessonSources(slug: string) {
  return useQuery({
    queryKey: ["lesson-sources", slug],
    staleTime: 60_000,
    queryFn: async () => {
      const { data: lesson } = await supabase
        .from("lessons")
        .select("id")
        .eq("slug", slug)
        .maybeSingle();
      if (!lesson) return [];
      const { data } = await supabase
        .from("lesson_sources")
        .select("title, url, organization, published_on")
        .eq("lesson_id", lesson.id)
        .order("sort_order");
      return data ?? [];
    },
  });
}
