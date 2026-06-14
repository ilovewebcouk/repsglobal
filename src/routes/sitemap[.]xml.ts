import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";

import { RESOURCE_ARTICLES } from "@/lib/resources";

const BASE_URL = "https://repsglobal.lovable.app";

interface SitemapEntry {
  path: string;
  lastmod?: string;
  changefreq?: "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never";
  priority?: string;
}

// Public, indexable routes. Excludes auth, dashboard, admin, portal, api, lovable, and not-found.
const STATIC_ROUTES: SitemapEntry[] = [
  { path: "/", changefreq: "weekly", priority: "1.0" },
  { path: "/about", changefreq: "monthly", priority: "0.8" },
  { path: "/how-it-works", changefreq: "monthly", priority: "0.8" },
  { path: "/find-a-professional", changefreq: "daily", priority: "0.9" },
  { path: "/for-professionals", changefreq: "monthly", priority: "0.8" },
  { path: "/pricing", changefreq: "monthly", priority: "0.8" },
  { path: "/standards", changefreq: "monthly", priority: "0.7" },
  
  { path: "/cpd", changefreq: "monthly", priority: "0.7" },
  { path: "/specialisms", changefreq: "monthly", priority: "0.7" },
  { path: "/business-tools", changefreq: "monthly", priority: "0.7" },
  { path: "/resources", changefreq: "weekly", priority: "0.9" },
  { path: "/compare", changefreq: "monthly", priority: "0.7" },
  { path: "/compare/reps-vs-mypthub", changefreq: "monthly", priority: "0.6" },
  { path: "/compare/reps-vs-pt-distinction", changefreq: "monthly", priority: "0.6" },
  { path: "/compare/reps-vs-trainerize", changefreq: "monthly", priority: "0.6" },
  { path: "/comparison-methodology", changefreq: "monthly", priority: "0.5" },
  { path: "/features", changefreq: "monthly", priority: "0.7" },
  { path: "/features/ai", changefreq: "monthly", priority: "0.6" },
  { path: "/features/coaching", changefreq: "monthly", priority: "0.6" },
  { path: "/features/growth", changefreq: "monthly", priority: "0.6" },
  { path: "/features/operations", changefreq: "monthly", priority: "0.6" },
  { path: "/features/visibility", changefreq: "monthly", priority: "0.6" },
  { path: "/reviews", changefreq: "weekly", priority: "0.7" },
  { path: "/help", changefreq: "monthly", priority: "0.5" },
  { path: "/help", changefreq: "monthly", priority: "0.5" },
  { path: "/contact", changefreq: "monthly", priority: "0.5" },
  { path: "/careers", changefreq: "monthly", priority: "0.5" },
  { path: "/press", changefreq: "monthly", priority: "0.4" },
  { path: "/complaints", changefreq: "monthly", priority: "0.4" },
  { path: "/privacy", changefreq: "yearly", priority: "0.3" },
  { path: "/terms", changefreq: "yearly", priority: "0.3" },
  { path: "/cookies", changefreq: "yearly", priority: "0.3" },
];

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: async () => {
        const articleEntries: SitemapEntry[] = RESOURCE_ARTICLES.map((a) => ({
          path: `/resources/${a.slug}`,
          lastmod: a.date,
          changefreq: "monthly",
          priority: "0.7",
        }));

        const entries = [...STATIC_ROUTES, ...articleEntries];

        const urls = entries.map((e) =>
          [
            `  <url>`,
            `    <loc>${BASE_URL}${e.path}</loc>`,
            e.lastmod ? `    <lastmod>${e.lastmod}</lastmod>` : null,
            e.changefreq ? `    <changefreq>${e.changefreq}</changefreq>` : null,
            e.priority ? `    <priority>${e.priority}</priority>` : null,
            `  </url>`,
          ]
            .filter(Boolean)
            .join("\n"),
        );

        const xml = [
          `<?xml version="1.0" encoding="UTF-8"?>`,
          `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`,
          ...urls,
          `</urlset>`,
        ].join("\n");

        return new Response(xml, {
          headers: {
            "Content-Type": "application/xml",
            "Cache-Control": "public, max-age=3600",
          },
        });
      },
    },
  },
});
