/**
 * Unified search taxonomy for the homepage hero combobox.
 *
 * Maps user intent → structured route on /find-a-professional. Synonyms
 * exist so "PT", "bad back", "prenatal", "weight loss" route correctly
 * instead of hitting the silent `?q=` dead-end.
 */

import { PROFESSIONS } from "@/lib/professions";
import { SPECIALISMS } from "@/lib/specialisms";

export type SearchEntryKind = "profession" | "specialism" | "mode";
export type SearchEntryGroup =
  | "Professions"
  | "Goals & specialisms"
  | "Training mode";

export type SearchEntry = {
  kind: SearchEntryKind;
  slug: string;
  label: string;
  group: SearchEntryGroup;
  synonyms: string[]; // all lowercase
  route: { profession?: string; specialism?: string };
};

const PROFESSION_SYNONYMS: Record<string, string[]> = {
  "personal-trainer": ["pt", "personal training", "1-1", "one-to-one", "trainer", "coach"],
  "fitness-instructor": ["fitness instructor", "instructor", "gym instructor"],
  "group-fitness-instructor": ["group fitness", "classes", "bootcamp", "hiit class", "group ex"],
  "strength-coach": ["strength coach", "strength and conditioning", "s&c", "powerlifting coach"],
  "nutritionist": ["nutritionist", "nutrition", "dietitian", "diet coach", "macros"],
  "pilates-instructor": ["pilates", "reformer", "mat pilates"],
  "yoga-teacher": ["yoga", "vinyasa", "hatha", "yin", "ashtanga"],
};

const SPECIALISM_SYNONYMS: Record<string, string[]> = {
  "fat-loss": ["fat loss", "weight loss", "slim down", "cut", "get lean", "lose weight"],
  "muscle-gain": ["muscle gain", "build muscle", "hypertrophy", "bulk", "size"],
  "strength": ["strength", "get stronger", "powerlifting", "deadlift", "squat"],
  "hybrid-functional": ["hybrid", "functional", "crossfit", "hyrox", "conditioning"],
  "endurance-running": ["running", "marathon", "10k", "half marathon", "endurance", "cardio"],
  "sports-performance": ["sport", "sports performance", "athlete", "football", "rugby", "tennis"],
  "pre-post-natal": ["prenatal", "postnatal", "postpartum", "pregnancy", "pre-natal", "post-natal", "mum"],
  "over-50s": ["over 50", "over-50s", "older", "senior", "masters"],
  "youth": ["youth", "kids", "teen", "junior", "under 18"],
  "rehab-injury": ["rehab", "injury", "bad back", "physio", "post-op", "recovery", "knee", "shoulder"],
  "mobility": ["mobility", "flexibility", "stretching", "tight hips"],
  "posture-back-pain": ["posture", "back pain", "lower back", "desk job", "office back"],
  "weight-management": ["weight management", "maintain weight", "lifestyle weight"],
  "habit-lifestyle": ["habit", "lifestyle", "sustainable", "behaviour change"],
  "nutrition-coaching": ["nutrition coaching", "meal plan", "macros", "diet plan"],
  "online-coaching": ["online", "remote", "online coach", "virtual", "anywhere"],
};

function professionEntry(slug: string, label: string): SearchEntry {
  return {
    kind: "profession",
    slug,
    label,
    group: "Professions",
    synonyms: PROFESSION_SYNONYMS[slug] ?? [],
    route: { profession: slug },
  };
}

function specialismEntry(slug: string, label: string): SearchEntry {
  return {
    kind: "specialism",
    slug,
    label,
    group: "Goals & specialisms",
    synonyms: SPECIALISM_SYNONYMS[slug] ?? [],
    route: { specialism: slug },
  };
}

export const SEARCH_ENTRIES: SearchEntry[] = [
  ...PROFESSIONS.map((p) => professionEntry(p.slug, p.label)),
  ...SPECIALISMS.map((s) => specialismEntry(s.slug, s.label)),
  {
    kind: "mode",
    slug: "online-coaching",
    label: "Online coaching (work with anyone)",
    group: "Training mode",
    synonyms: ["online", "remote", "virtual", "anywhere"],
    route: { specialism: "online-coaching" },
  },
];

export const POPULAR_SLUGS = [
  "fat-loss",
  "strength",
  "mobility",
  "pre-post-natal",
  "rehab-injury",
  "sports-performance",
];

export function getPopularEntries(): SearchEntry[] {
  return POPULAR_SLUGS.map((slug) =>
    SEARCH_ENTRIES.find((e) => e.slug === slug),
  ).filter((e): e is SearchEntry => Boolean(e));
}

export type RankedEntry = SearchEntry & {
  matchedSynonym: string | null;
  score: number;
};

/**
 * Case-insensitive label + synonym match. Prefix > substring.
 * Returns at most 12 results, sorted best-first.
 */
export function searchTaxonomy(rawQuery: string): RankedEntry[] {
  const q = rawQuery.trim().toLowerCase();
  if (!q) return [];

  const results: RankedEntry[] = [];
  for (const entry of SEARCH_ENTRIES) {
    const label = entry.label.toLowerCase();
    let score = 0;
    let matchedSynonym: string | null = null;

    if (label === q) score = 100;
    else if (label.startsWith(q)) score = 80;
    else if (label.includes(q)) score = 60;

    for (const syn of entry.synonyms) {
      let s = 0;
      if (syn === q) s = 95;
      else if (syn.startsWith(q)) s = 75;
      else if (syn.includes(q)) s = 55;
      if (s > score) {
        score = s;
        matchedSynonym = syn;
      }
    }

    if (score > 0) results.push({ ...entry, matchedSynonym, score });
  }

  results.sort((a, b) => b.score - a.score);
  return results.slice(0, 12);
}
