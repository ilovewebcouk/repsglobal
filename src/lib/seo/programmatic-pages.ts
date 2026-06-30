// Canonical lists for the /in/$location/$profession programmatic SEO pages.
// Kept separate from the route file so the sitemap can import them without
// pulling the route's UI dependencies.
import { PROFESSIONS } from "@/lib/professions";

export const PROGRAMMATIC_CITY_SLUGS = [
  "london",
  "manchester",
  "birmingham",
  "edinburgh",
  "glasgow",
  "bristol",
  "leeds",
  "liverpool",
  "cardiff",
  "newcastle",
  "brighton",
  "nottingham",
  "sheffield",
  "oxford",
  "cambridge",
] as const;

export const PROGRAMMATIC_PROFESSION_SLUGS = PROFESSIONS.map((p) => p.slug);
