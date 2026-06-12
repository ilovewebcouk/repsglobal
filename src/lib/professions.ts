/**
 * Canonical profession list — single source of truth.
 * Mirrors the validation trigger on public.professionals
 * (validate_professional_professions). Keep in sync.
 */

export type ProfessionSlug =
  | "personal-trainer"
  | "fitness-instructor"
  | "group-fitness-instructor"
  | "strength-coach"
  | "nutritionist"
  | "pilates-instructor"
  | "yoga-teacher";

export type Profession = { slug: ProfessionSlug; label: string };

export const PROFESSIONS: Profession[] = [
  { slug: "personal-trainer", label: "Personal Trainer" },
  { slug: "fitness-instructor", label: "Fitness Instructor" },
  { slug: "group-fitness-instructor", label: "Group Fitness Instructor" },
  { slug: "strength-coach", label: "Strength Coach" },
  { slug: "nutritionist", label: "Nutritionist" },
  { slug: "pilates-instructor", label: "Pilates Instructor" },
  { slug: "yoga-teacher", label: "Yoga Teacher" },
];

export const PROFESSION_SLUGS: ProfessionSlug[] = PROFESSIONS.map((p) => p.slug);

const LABEL_BY_SLUG: Record<string, string> = Object.fromEntries(
  PROFESSIONS.map((p) => [p.slug, p.label]),
);

export function getProfessionLabel(slug: string | null | undefined): string | null {
  if (!slug) return null;
  return LABEL_BY_SLUG[slug] ?? null;
}

export function isProfessionSlug(s: unknown): s is ProfessionSlug {
  return typeof s === "string" && s in LABEL_BY_SLUG;
}
