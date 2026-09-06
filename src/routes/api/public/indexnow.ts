import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";
import { SITE_URL } from "@/lib/seo";
import { INDEXNOW_KEY } from "@/lib/indexnow";

/**
 * Optional IndexNow ping (Bing/Yandex/Seznam). No user-provided secret needed:
 * IndexNow authenticates by the public key file served at /<key>.txt.
 * Call GET /api/public/indexnow to submit the site's public URLs.
 */
export const Route = createFileRoute("/api/public/indexnow")({
  server: {
    handlers: {
      GET: async () => {
        const host = new URL(SITE_URL).host;
        const sitemap = await fetch(`${SITE_URL}/sitemap.xml`).then((r) => r.text());
        const urlList = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]).slice(0, 10000);
        if (urlList.length === 0) return new Response("No URLs found in sitemap", { status: 500 });

        const res = await fetch("https://api.indexnow.org/indexnow", {
          method: "POST",
          headers: { "Content-Type": "application/json; charset=utf-8" },
          body: JSON.stringify({
            host,
            key: INDEXNOW_KEY,
            keyLocation: `${SITE_URL}/${INDEXNOW_KEY}.txt`,
            urlList,
          }),
        });

        return new Response(
          JSON.stringify({ submitted: urlList.length, indexnowStatus: res.status }),
          { status: res.ok ? 200 : 502, headers: { "Content-Type": "application/json" } },
        );
      },
    },
  },
});
