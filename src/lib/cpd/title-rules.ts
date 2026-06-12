/**
 * Title-rules engine.
 *
 * Pure, deterministic function that decides which professional title(s)
 * and specialism(s) a single qualification certificate unlocks.
 *
 * Inputs come from the AI-extracted submission plus (optionally) the
 * Ofqual register record we cached. Output is then either stored on the
 * submission (as a preview, before admin approval) or committed into
 * `pro_titles` (after admin approval).
 *
 * The rule set is hand-curated and tier-ordered: the highest-authority
 * matching rule wins. Sensitive titles flagged `requiresRegisterVerification`
 * are NOT auto-granted; the rules engine will return them with
 * `requiresAdminReview: true` so admin has to attach a verified-register
 * record before pro_titles is committed.
 */

import { TITLES, type TitleSlug } from "./titles-catalog";
import type { SpecialismSlug } from "@/lib/specialisms";

/* -------------------------------------------------------------------------- */
/* Inputs                                                                      */
/* -------------------------------------------------------------------------- */

export type TitleRuleInput = {
  /** Free-text title of the qualification, e.g. "Level 3 Diploma in Personal Training". */
  qualification: string | null | undefined;
  /** Awarding body label (or slug — both accepted). */
  awarding_body: string | null | undefined;
  awarding_body_slug?: string | null;
  /** Whether the Ofqual register confirmed this exact cert. */
  ofqualVerified?: boolean;
};

export type DerivedTitle = {
  title_slug: TitleSlug;
  confidence: "high" | "medium" | "low";
  /** True for titles that need an external register check before grant. */
  requiresAdminReview: boolean;
  /** Plain-English reason shown to admin (and in audit). */
  reason: string;
};

export type DerivedSpecialism = {
  slug: SpecialismSlug;
  reason: string;
};

export type RulesOutput = {
  /** Highest-authority title for this single cert (catalog tier wins). */
  primary: DerivedTitle | null;
  /** All matched titles (the cert can imply more than one — rare but possible). */
  titles: DerivedTitle[];
  specialisms: DerivedSpecialism[];
};

/* -------------------------------------------------------------------------- */
/* Helpers                                                                     */
/* -------------------------------------------------------------------------- */

function norm(s: string | null | undefined): string {
  return (s ?? "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

/** Pull a level (1..7) out of a qualification title. Falls back to null. */
function extractLevel(qualification: string | null | undefined): number | null {
  if (!qualification) return null;
  const m = qualification.match(/\blevel[\s-]?([1-7])\b/i) ?? qualification.match(/\bL([1-7])\b/);
  if (m) return Number(m[1]);
  // Degree fallbacks
  if (/\b(bsc|ba\s|honours|hons|undergrad|bachelor)\b/i.test(qualification)) return 6;
  if (/\b(msc|ma\s|master|postgrad|pgdip)\b/i.test(qualification)) return 7;
  return null;
}

function has(qual: string, ...kw: string[]): boolean {
  return kw.every((k) => qual.includes(k));
}
function any(qual: string, ...kw: string[]): boolean {
  return kw.some((k) => qual.includes(k));
}

/* -------------------------------------------------------------------------- */
/* Specialisms — qualification title → SpecialismSlug                          */
/* -------------------------------------------------------------------------- */

const SPECIALISM_PATTERNS: Array<{ slug: SpecialismSlug; test: (q: string) => boolean }> = [
  { slug: "pre-post-natal", test: (q) => any(q, "ante natal", "antenatal", "pre natal", "prenatal", "post natal", "postnatal", "ante and post natal", "pregnancy") },
  { slug: "posture-back-pain", test: (q) => any(q, "lower back", "low back", "back pain", "posture", "spinal") },
  { slug: "rehab-injury", test: (q) => any(q, "rehab", "rehabilitation", "injury", "gp referral", "exercise referral", "cardiac rehab", "post rehabilitation") },
  { slug: "over-50s", test: (q) => any(q, "older adult", "over 50", "over 50s", "ageing", "aging", "later life") },
  { slug: "youth", test: (q) => any(q, "youth", "young people", "children", "child", "junior") },
  { slug: "pre-post-natal", test: (q) => q.includes("menopause") }, // grouped with pre/post-natal taxonomy
  { slug: "weight-management", test: (q) => any(q, "obesity", "weight management", "weight loss", "bariatric") },
  { slug: "nutrition-coaching", test: (q) => any(q, "nutrition") },
  { slug: "mobility", test: (q) => any(q, "mobility", "flexibility") },
  { slug: "sports-performance", test: (q) => any(q, "sports performance", "athlete", "athletic development", "speed agility") },
  { slug: "endurance-running", test: (q) => any(q, "running", "endurance", "marathon", "triathlon") },
  { slug: "strength", test: (q) => any(q, "strength conditioning", "strength and conditioning") },
];

function deriveSpecialisms(q: string): DerivedSpecialism[] {
  const seen = new Set<string>();
  const out: DerivedSpecialism[] = [];
  for (const p of SPECIALISM_PATTERNS) {
    if (!p.test(q)) continue;
    if (seen.has(p.slug)) continue;
    seen.add(p.slug);
    out.push({ slug: p.slug, reason: `Subject keywords matched specialism "${p.slug}".` });
  }
  return out;
}

/* -------------------------------------------------------------------------- */
/* Title rules                                                                 */
/* -------------------------------------------------------------------------- */

type Rule = {
  /** Highest-tier rules first; engine picks the best. */
  slug: TitleSlug;
  /** Pure boolean fn over the normalised qualification title + level + body. */
  test: (q: string, level: number | null, body: string) => boolean;
  /** "high" when level+subject+regulator all line up; "medium" otherwise. */
  confidence?: (q: string, level: number | null, body: string, ofqualVerified?: boolean) => "high" | "medium" | "low";
};

const RULES: Rule[] = [
  /* ---------- Tier 1 — registered / accredited ---------- */
  {
    slug: "accredited-sc-coach",
    test: (q, _l, body) =>
      body.includes("uksca") &&
      any(q, "ascc", "accredited strength and conditioning"),
    confidence: () => "high",
  },
  {
    slug: "registered-dietitian",
    test: (q) => any(q, "registered dietitian", "dietitian", "hcpc dietitian"),
    confidence: () => "high",
  },
  {
    slug: "registered-nutritionist",
    test: (q) =>
      any(q, "anutr", "rnutr", "registered nutritionist", "ukvrn", "association for nutrition"),
    confidence: () => "high",
  },

  /* ---------- Tier 2 — advanced ---------- */
  {
    slug: "strength-coach",
    test: (q, level) => {
      if (!any(q, "strength conditioning", "strength and conditioning", "s and c", "s&c")) return false;
      // L4+ certificate OR degree (level 6/7 via extractLevel fallback)
      return (level ?? 0) >= 4;
    },
    confidence: (_q, level, _b, ofqual) => (ofqual ? "high" : (level ?? 0) >= 4 ? "medium" : "low"),
  },
  {
    slug: "nutrition-coach",
    test: (q, level) => {
      if (!q.includes("nutrition")) return false;
      // L4+ sports/performance nutrition, OR known L4-equivalent providers
      const lv = level ?? 0;
      const knownL4Plus =
        any(q, "mac nutrition uni", "mnu certified", "precision nutrition level 2");
      return lv >= 4 || knownL4Plus;
    },
    confidence: (_q, level, _b, ofqual) => (ofqual ? "high" : (level ?? 0) >= 4 ? "medium" : "low"),
  },
  {
    slug: "advanced-personal-trainer",
    test: (q, level) => {
      // L4 PT + specialist subject (lower back / obesity / GP referral / pre-post-natal)
      const lv = level ?? 0;
      if (lv < 4) return false;
      const isPt = any(q, "personal trainer", "personal training");
      const isSpecialist = any(
        q,
        "lower back", "low back", "back pain", "obesity", "gp referral",
        "exercise referral", "pre and post natal", "ante and post natal", "diabetes",
      );
      return isPt || isSpecialist;
    },
    confidence: (_q, level, _b, ofqual) => (ofqual ? "high" : (level ?? 0) >= 4 ? "medium" : "low"),
  },

  /* ---------- Tier 3 — practitioner ---------- */
  {
    slug: "personal-trainer",
    test: (q, level) => {
      const lv = level ?? 0;
      if (lv < 3) return false;
      return any(q, "personal trainer", "personal training", "diploma in personal training");
    },
    confidence: (_q, level, _b, ofqual) => (ofqual ? "high" : (level ?? 0) >= 3 ? "medium" : "low"),
  },
  {
    slug: "pilates-instructor",
    test: (q, level) => {
      if (!q.includes("pilates")) return false;
      const lv = level ?? 0;
      // Many private Pilates courses don't carry an Ofqual level — accept body match too
      return lv >= 3 || /body control|stott|polestar|romana/.test(q);
    },
    confidence: () => "medium",
  },
  {
    slug: "yoga-teacher",
    test: (q, level, body) => {
      if (!q.includes("yoga")) return false;
      const lv = level ?? 0;
      return (
        lv >= 3 ||
        /200\s?hr|200\s?hour|yoga teacher training|yoga teaching/.test(q) ||
        body.includes("yoga alliance") ||
        body.includes("british wheel of yoga")
      );
    },
    confidence: () => "medium",
  },
  {
    slug: "group-fitness-instructor",
    test: (q, level) => {
      const lv = level ?? 0;
      if (lv < 2) return false;
      return any(q, "group exercise", "exercise to music", "group fitness", "etm");
    },
    confidence: () => "medium",
  },
  {
    slug: "fitness-instructor",
    test: (q, level) => {
      const lv = level ?? 0;
      if (lv < 2) return false;
      return any(q, "fitness instruct", "gym instructor", "gym instructing");
    },
    confidence: () => "medium",
  },
];

/* -------------------------------------------------------------------------- */
/* Public API                                                                  */
/* -------------------------------------------------------------------------- */

const TITLE_TIER: Record<TitleSlug, number> = Object.fromEntries(
  TITLES.map((t) => [t.slug, t.tier]),
) as Record<TitleSlug, number>;

export function deriveTitlesForSubmission(input: TitleRuleInput): RulesOutput {
  const q = norm(input.qualification);
  const body = `${norm(input.awarding_body)} ${norm(input.awarding_body_slug)}`.trim();
  const level = extractLevel(input.qualification);

  const matched: DerivedTitle[] = [];
  for (const rule of RULES) {
    if (!rule.test(q, level, body)) continue;
    const conf = rule.confidence?.(q, level, body, input.ofqualVerified) ?? "medium";
    const titleEntry = TITLES.find((t) => t.slug === rule.slug);
    const requiresAdminReview = !!titleEntry?.requiresRegisterVerification;
    matched.push({
      title_slug: rule.slug,
      confidence: input.ofqualVerified && conf === "medium" ? "high" : conf,
      requiresAdminReview,
      reason: buildReason(rule.slug, q, level, body, !!input.ofqualVerified),
    });
  }

  // Highest authority (lowest tier number) wins.
  matched.sort((a, b) => TITLE_TIER[a.title_slug] - TITLE_TIER[b.title_slug]);

  return {
    primary: matched[0] ?? null,
    titles: matched,
    specialisms: deriveSpecialisms(q),
  };
}

function buildReason(
  slug: TitleSlug,
  q: string,
  level: number | null,
  body: string,
  ofqual: boolean,
): string {
  const lv = level != null ? `Level ${level}` : "no level extracted";
  const bodyPart = body ? `awarding body "${body.trim()}"` : "awarding body unknown";
  const regPart = ofqual ? " (Ofqual register match ✓)" : "";
  return `Matched "${slug}" rule on ${lv}, ${bodyPart}, subject "${q.slice(0, 80)}"${regPart}.`;
}
