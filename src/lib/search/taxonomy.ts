/**
 * Unified search taxonomy for the homepage hero combobox.
 *
 * Maps user intent → structured route on /find-a-professional. Synonyms
 * exist so "PT", "bad back", "prenatal", "weight loss" route correctly
 * instead of hitting the silent `?q=` dead-end.
 *
 * Specialism entries are profession-aware: pass `lockedProfession` to
 * `searchTaxonomy` to narrow specialism results to that profession's
 * dedicated catalogue.
 */

import { PROFESSIONS, type ProfessionSlug } from "@/lib/professions";
import { ALL_SPECIALISMS, type Specialism } from "@/lib/specialisms";

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
  /** Empty for professions/modes; populated for specialisms. */
  professions: ProfessionSlug[];
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

/** Optional extra synonyms keyed by specialism slug. */
const SPECIALISM_SYNONYMS: Record<string, string[]> = {
  "fat-loss": ["fat loss", "weight loss", "slim down", "cut", "get lean", "lose weight"],
  "muscle-gain": ["muscle gain", "build muscle", "bulk", "size"],
  "strength-training": ["strength", "get stronger"],
  "powerlifting": ["powerlifting", "deadlift", "squat", "bench"],
  "olympic-weightlifting": ["olympic lifting", "snatch", "clean and jerk"],
  "hypertrophy": ["hypertrophy", "bodybuilding", "muscle building"],
  "hybrid-training": ["hybrid", "hyrox", "crossfit"],
  "functional-fitness": ["functional", "conditioning"],
  "endurance-running": ["running", "10k", "endurance", "cardio"],
  "marathon-prep": ["marathon"],
  "triathlon-prep": ["triathlon", "ironman"],
  "hyrox-prep": ["hyrox"],
  "athletic-performance": ["sport", "performance", "athlete"],
  "pre-post-natal": ["prenatal", "postnatal", "postpartum", "pregnancy", "pre-natal", "post-natal", "mum"],
  "pre-post-natal-pilates": ["prenatal pilates", "postnatal pilates"],
  "pregnancy-yoga": ["prenatal yoga", "pregnancy yoga"],
  "over-50s": ["over 50", "older", "senior", "masters"],
  "menopause": ["menopause", "perimenopause"],
  "youth-training": ["youth", "kids", "teen", "junior", "under 18"],
  "kids-yoga": ["kids yoga", "children yoga"],
  "rehab-return-to-training": ["rehab", "injury", "post-op", "recovery"],
  "clinical-rehab-pilates": ["rehab pilates", "physio pilates"],
  "mobility": ["mobility", "flexibility", "stretching"],
  "yin": ["yin yoga", "tight hips"],
  "posture-back-pain": ["posture", "back pain", "lower back", "desk job"],
  "yoga-for-back-pain": ["yoga back pain"],
  "back-care": ["back care", "spinal"],
  "weight-management": ["weight management", "weight loss", "maintain weight"],
  "habit-lifestyle": ["habit", "lifestyle", "sustainable", "behaviour change"],
  "habit-behaviour-change": ["habit change", "behaviour change"],
  "sports-nutrition": ["sports nutrition", "macros"],
  "gut-health": ["gut health", "ibs", "digestion"],
  "plant-based": ["plant based", "vegan"],
  "online-coaching": ["online", "remote", "virtual", "anywhere"],
  "online-nutrition-coaching": ["online nutrition", "online dietitian"],
  "indoor-cycling-spin": ["spin", "indoor cycling"],
  "bodypump-barbell": ["bodypump", "barbell class"],
  "hiit": ["hiit", "high intensity"],
  "bootcamp": ["bootcamp"],
  "dance-fitness-zumba": ["zumba", "dance fitness"],
  "barre": ["barre"],
  "reformer-pilates": ["reformer"],
  "mat-pilates": ["mat pilates"],
  "vinyasa-flow": ["vinyasa", "flow yoga"],
  "hatha": ["hatha"],
  "ashtanga": ["ashtanga"],
  "hot-yoga": ["hot yoga", "bikram"],
};

function professionEntry(slug: ProfessionSlug, label: string): SearchEntry {
  return {
    kind: "profession",
    slug,
    label,
    group: "Professions",
    professions: [],
    synonyms: PROFESSION_SYNONYMS[slug] ?? [],
    route: { profession: slug },
  };
}

function specialismEntry(spec: Specialism): SearchEntry {
  return {
    kind: "specialism",
    slug: spec.slug,
    label: spec.label,
    group: "Goals & specialisms",
    professions: spec.professions,
    synonyms: SPECIALISM_SYNONYMS[spec.slug] ?? [],
    route: { specialism: spec.slug },
  };
}

export const SEARCH_ENTRIES: SearchEntry[] = [
  ...PROFESSIONS.map((p) => professionEntry(p.slug, p.label)),
  ...ALL_SPECIALISMS.map((s) => specialismEntry(s)),
  {
    kind: "mode",
    slug: "online-coaching",
    label: "Online coaching (work with anyone)",
    group: "Training mode",
    professions: [],
    synonyms: ["online", "remote", "virtual", "anywhere"],
    route: { specialism: "online-coaching" },
  },
];

/** Generic, profession-agnostic popular searches (homepage). */
export const POPULAR_SLUGS = [
  "personal-trainer",
  "pilates-instructor",
  "yoga-teacher",
  "strength-coach",
  "nutritionist",
  "online-coaching",
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

export type SearchTaxonomyOptions = {
  /** When set, specialism entries are filtered to those valid for this profession. */
  profession?: ProfessionSlug | string | null;
};

/**
 * Case-insensitive label + synonym match. Prefix > substring.
 * Returns at most 12 results, sorted best-first.
 *
 * When `options.profession` is set, specialism entries are filtered to
 * those valid for that profession.
 */
export function searchTaxonomy(
  rawQuery: string,
  options: SearchTaxonomyOptions = {},
): RankedEntry[] {
  const q = rawQuery.trim().toLowerCase();
  if (!q) return [];

  const profession = options.profession ?? null;

  const results: RankedEntry[] = [];
  for (const entry of SEARCH_ENTRIES) {
    if (
      profession &&
      entry.kind === "specialism" &&
      entry.professions.length > 0 &&
      !entry.professions.includes(profession as ProfessionSlug)
    ) {
      continue;
    }

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
