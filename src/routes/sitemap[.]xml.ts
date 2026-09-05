import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";
import { ALL_LESSONS } from "@/lib/finly/curriculum";
import { SITE_URL } from "@/lib/seo";

const STATIC_PATHS: { path: string; priority: string; changefreq: string }[] = [
  { path: "/", priority: "1.0", changefreq: "weekly" },
  { path: "/learn", priority: "0.9", changefreq: "weekly" },
  { path: "/library", priority: "0.8", changefreq: "weekly" },
  { path: "/simulators", priority: "0.7", changefreq: "monthly" },
  { path: "/tools", priority: "0.7", changefreq: "monthly" },
  { path: "/financial-literacy", priority: "0.6", changefreq: "monthly" },
  { path: "/how-to-budget", priority: "0.6", changefreq: "monthly" },
  { path: "/how-to-save-money", priority: "0.6", changefreq: "monthly" },
  { path: "/what-is-compound-interest", priority: "0.6", changefreq: "monthly" },
];

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: () => {
        const entries = [
          ...STATIC_PATHS,
          ...ALL_LESSONS.map((l) => ({
            path: `/learn/${encodeURIComponent(l.id)}`,
            priority: "0.5",
            changefreq: "monthly",
          })),
        ];

        const xml = [
          `<?xml version="1.0" encoding="UTF-8"?>`,
          `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`,
          ...entries.map((e) =>
            [
              `  <url>`,
              `    <loc>${SITE_URL}${e.path}</loc>`,
              `    <changefreq>${e.changefreq}</changefreq>`,
              `    <priority>${e.priority}</priority>`,
              `  </url>`,
            ].join("\n"),
          ),
          `</urlset>`,
        ].join("\n");

        return new Response(xml, {
          headers: { "Content-Type": "application/xml", "Cache-Control": "public, max-age=3600" },
        });
      },
    },
  },
});
