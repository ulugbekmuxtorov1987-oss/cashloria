/** Shared SEO helpers. Cashloria is English-only. */
export const SITE_URL = "https://finlymoney.lovable.app";
export const SITE_NAME = "Cashloria";

/** Canonical + og:url + twitter tags for a public page. */
export function publicSeo(path: string, title: string, description: string, type = "website") {
  const url = `${SITE_URL}${path}`;
  return {
    meta: [
      { property: "og:url", content: url },
      { property: "og:type", content: type },
      { property: "og:site_name", content: SITE_NAME },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: title },
      { name: "twitter:description", content: description },
    ],
    links: [{ rel: "canonical", href: url }],
  };
}
