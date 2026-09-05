import { useEffect } from "react";
import { useSiteSettings } from "@/lib/site-content";

function setMeta(attr: "name" | "property", key: string, content: string) {
  let el = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

/**
 * Applies the few site-wide values the admin settings already support
 * (site name, social sharing image, favicon) to the document head.
 * Per-page titles/descriptions stay owned by each route's head().
 */
export function SiteMeta() {
  const { data } = useSiteSettings();

  useEffect(() => {
    if (!data) return;
    if (data.site_name) setMeta("property", "og:site_name", data.site_name);
    if (data.social_image_url) {
      setMeta("property", "og:image", data.social_image_url);
      setMeta("name", "twitter:image", data.social_image_url);
    }
    if (data.favicon_url) {
      let link = document.head.querySelector<HTMLLinkElement>('link[rel="icon"]');
      if (!link) {
        link = document.createElement("link");
        link.rel = "icon";
        document.head.appendChild(link);
      }
      link.href = data.favicon_url;
      link.removeAttribute("type");
    }
  }, [data]);

  return null;
}
