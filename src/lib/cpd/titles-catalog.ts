/**
 * Canonical catalog of professional titles a REPs pro can earn from
 * approved qualifications, plus the deterministic rules that decide
 * which title a given certificate unlocks.
 *
 * Hand-edited, single source of truth. Mirror any change here in
 * `src/lib/professions.ts` (`PROFESSIONS`) so the URL/profession-page
 * routing stays consistent.
 *
 * Tier ordering (1 = highest authority):
 *   1 — Registered/Accredited (external register: AfN, HCPC, UKSCA ASCC)
 *   2 — Advanced practitioner (L4+ specialist, S&C coach, Nutrition Coach L4/L5)
 *   3 — Practitioner (L3 PT, L3 Pilates, 200hr Yoga, L2 Group Ex / Fitness Instructor)
 */

export type TitleSlug =
  // Tier 3 — practitioner
  | "fitness-instructor"
  | "group-fitness-instructor"
  | "personal-trainer"
  | "pilates-instructor"
  | "yoga-teacher"
  // Tier 2 — advanced
  | "advanced-personal-trainer"
  | "strength-coach"
  | "nutrition-coach"
  // Tier 1 — registered / accredited
  | "accredited-sc-coach"
  | "registered-nutritionist"
  | "registered-dietitian";

export type TitleEntry = {
  slug: TitleSlug;
  label: string;
  /** Short blurb shown to clients on hover/info. */
  description: string;
  /** Lower = higher authority (1, 2, 3). */
  tier: 1 | 2 | 3;
  /** Maps to the `PROFESSIONS` slug used for URLs and profession landing pages. */
  professionSlug:
    | "personal-trainer"
    | "fitness-instructor"
    | "group-fitness-instructor"
    | "strength-coach"
    | "nutritionist"
    | "pilates-instructor"
    | "yoga-teacher";
  /** If true, REPs must verify against an external register before granting. */
  requiresRegisterVerification?: boolean;
  /** Plain-English "how to earn this title" line shown in the locked roadmap. */
  earnedBy: string;
};

export const TITLES: TitleEntry[] = [
  // -------- Tier 3 (practitioner) --------
  {
    slug: "fitness-instructor",
    label: "Fitness Instructor",
    tier: 3,
    professionSlug: "fitness-instructor",
    description: "Qualified to deliver gym-based fitness instruction and group sessions to apparently healthy adults.",
    earnedBy: "Upload a Level 2 Certificate in Fitness Instructing / Gym Instructor.",
  },
  {
    slug: "group-fitness-instructor",
    label: "Group Fitness Instructor",
    tier: 3,
    professionSlug: "group-fitness-instructor",
    description: "Qualified to plan and deliver group exercise classes.",
    earnedBy: "Upload a Level 2 in Group Exercise / Exercise to Music.",
  },
  {
    slug: "personal-trainer",
    label: "Personal Trainer",
    tier: 3,
    professionSlug: "personal-trainer",
    description: "Qualified to design and deliver 1-to-1 personal training programmes.",
    earnedBy: "Upload a Level 3 Diploma or Certificate in Personal Training.",
  },
  {
    slug: "pilates-instructor",
    label: "Pilates Instructor",
    tier: 3,
    professionSlug: "pilates-instructor",
    description: "Qualified to teach Pilates to apparently healthy adults.",
    earnedBy: "Upload a Level 3 Pilates qualification (Body Control, STOTT, Polestar or equivalent).",
  },
  {
    slug: "yoga-teacher",
    label: "Yoga Teacher",
    tier: 3,
    professionSlug: "yoga-teacher",
    description: "Qualified to teach yoga at a recognised standard.",
    earnedBy: "Upload a 200hr Yoga Alliance / BWY / Level 3 Yoga teaching qualification.",
  },

  // -------- Tier 2 (advanced) --------
  {
    slug: "advanced-personal-trainer",
    label: "Advanced Personal Trainer",
    tier: 2,
    professionSlug: "personal-trainer",
    description: "Level 4 personal trainer with a recognised specialism (e.g. lower back, GP referral, obesity).",
    earnedBy: "Hold a Level 3 PT plus a Level 4 specialism (lower back, GP referral, obesity, etc.).",
  },
  {
    slug: "strength-coach",
    label: "Strength Coach",
    tier: 2,
    professionSlug: "strength-coach",
    description: "Qualified to plan and deliver strength & conditioning programmes for general clients and athletes.",
    earnedBy: "Upload a Level 4 Strength & Conditioning qualification or a BSc in S&C.",
  },
  {
    slug: "nutrition-coach",
    label: "Nutrition Coach",
    tier: 2,
    professionSlug: "nutritionist",
    description: "Qualified to deliver sports-and-exercise nutrition coaching to non-clinical clients.",
    earnedBy: "Upload a Level 4 or Level 5 sports / performance nutrition qualification.",
  },

  // -------- Tier 1 (registered / accredited) --------
  {
    slug: "accredited-sc-coach",
    label: "Accredited Strength & Conditioning Coach (ASCC)",
    tier: 1,
    professionSlug: "strength-coach",
    requiresRegisterVerification: true,
    description: "UKSCA-Accredited S&C Coach — the gold standard for strength & conditioning in the UK.",
    earnedBy: "Verified entry on the UKSCA ASCC register (admin-verified).",
  },
  {
    slug: "registered-nutritionist",
    label: "Registered Nutritionist (ANutr / RNutr)",
    tier: 1,
    professionSlug: "nutritionist",
    requiresRegisterVerification: true,
    description: "Registered with the Association for Nutrition (UKVRN). Qualified to give evidence-based nutrition advice.",
    earnedBy: "Verified entry on the AfN UK Voluntary Register of Nutritionists (admin-verified).",
  },
  {
    slug: "registered-dietitian",
    label: "Registered Dietitian",
    tier: 1,
    professionSlug: "nutritionist",
    requiresRegisterVerification: true,
    description: "Statutorily regulated by the HCPC. The only nutrition professionals qualified to diagnose and treat diet-related disease.",
    earnedBy: "Verified HCPC Dietitian registration (admin-verified).",
  },
];

const BY_SLUG: Record<string, TitleEntry> = Object.fromEntries(
  TITLES.map((t) => [t.slug, t]),
);

export function getTitle(slug: string | null | undefined): TitleEntry | null {
  if (!slug) return null;
  return BY_SLUG[slug] ?? null;
}

export function getTitleLabel(slug: string | null | undefined): string | null {
  return getTitle(slug)?.label ?? null;
}

export function isTitleSlug(s: unknown): s is TitleSlug {
  return typeof s === "string" && s in BY_SLUG;
}

/**
 * Pick the "highest authority" title from a list, preferring lower tier
 * numbers (1 beats 2 beats 3). Ties broken by the catalog order.
 */
export function pickHighestTitle(slugs: string[]): TitleSlug | null {
  let best: TitleEntry | null = null;
  for (const s of slugs) {
    const t = BY_SLUG[s];
    if (!t) continue;
    if (!best || t.tier < best.tier) best = t;
  }
  return (best?.slug as TitleSlug) ?? null;
}
