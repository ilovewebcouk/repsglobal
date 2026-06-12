/**
 * Canonical specialism list — single source of truth.
 * Mirrors the validation trigger on public.professionals
 * (validate_professional_professions). Keep in sync.
 *
 * Pros may pick up to MAX_SPECIALISMS from this list.
 */

export type SpecialismSlug =
  | "fat-loss"
  | "muscle-gain"
  | "strength"
  | "hybrid-functional"
  | "endurance-running"
  | "sports-performance"
  | "pre-post-natal"
  | "over-50s"
  | "youth"
  | "rehab-injury"
  | "mobility"
  | "posture-back-pain"
  | "weight-management"
  | "habit-lifestyle"
  | "nutrition-coaching"
  | "online-coaching";

export type Specialism = { slug: SpecialismSlug; label: string };

export const MAX_SPECIALISMS = 3;

export const SPECIALISMS: Specialism[] = [
  { slug: "fat-loss", label: "Fat Loss" },
  { slug: "muscle-gain", label: "Muscle Gain" },
  { slug: "strength", label: "Strength" },
  { slug: "hybrid-functional", label: "Hybrid / Functional Fitness" },
  { slug: "endurance-running", label: "Endurance & Running" },
  { slug: "sports-performance", label: "Sports Performance" },
  { slug: "pre-post-natal", label: "Pre & Post-Natal" },
  { slug: "over-50s", label: "Over-50s" },
  { slug: "youth", label: "Youth (under-18s)" },
  { slug: "rehab-injury", label: "Rehab & Injury" },
  { slug: "mobility", label: "Mobility" },
  { slug: "posture-back-pain", label: "Posture & Back Pain" },
  { slug: "weight-management", label: "Weight Management" },
  { slug: "habit-lifestyle", label: "Habit & Lifestyle" },
  { slug: "nutrition-coaching", label: "Nutrition Coaching" },
  { slug: "online-coaching", label: "Online Coaching" },
];

export const SPECIALISM_SLUGS: SpecialismSlug[] = SPECIALISMS.map((s) => s.slug);

const LABEL_BY_SLUG: Record<string, string> = Object.fromEntries(
  SPECIALISMS.map((s) => [s.slug, s.label]),
);

export function getSpecialismLabel(slug: string | null | undefined): string | null {
  if (!slug) return null;
  return LABEL_BY_SLUG[slug] ?? null;
}

export function isSpecialismSlug(s: unknown): s is SpecialismSlug {
  return typeof s === "string" && s in LABEL_BY_SLUG;
}
