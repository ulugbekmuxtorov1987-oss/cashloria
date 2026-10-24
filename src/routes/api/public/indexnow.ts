import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";
import { SITE_URL } from "@/lib/seo";
import { INDEXNOW_KEY } from "@/lib/indexnow";

const COOLDOWN_MS = 6 * 60 * 60 * 1000;
let lastSuccessfulRun: number | null = null;

/**
 * Optional IndexNow ping (Bing/Yandex/Seznam). No user-provided secret needed:
 * IndexNow authenticates by the public key file served at /<key>.txt.
 * Call GET /api/public/indexnow to submit the site's public URLs.
 */
export const Route = createFileRoute("/api/public/indexnow")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const secret = process.env["INDEXNOW_PING_SECRET"];
        if (secret && request.headers.get("Authorization") !== `Bearer ${secret}`) {
          return Response.json({ error: "unauthorized" }, { status: 401 });
        }
        const now = Date.now();
        if (lastSuccessfulRun !== null && now - lastSuccessfulRun < COOLDOWN_MS) {
          const remaining = Math.ceil((COOLDOWN_MS - (now - lastSuccessfulRun)) / 1000);
          return Response.json({ error: "rate_limited" }, {
            status: 429,
            headers: { "Retry-After": String(remaining) },
          });
        }
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

        if (res.ok) lastSuccessfulRun = Date.now();

        return new Response(
          JSON.stringify({ submitted: urlList.length, indexnowStatus: res.status }),
          { status: res.ok ? 200 : 502, headers: { "Content-Type": "application/json" } },
        );
      },
    },
  },
});
