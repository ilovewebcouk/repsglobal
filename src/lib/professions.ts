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

export type Profession = {
  slug: ProfessionSlug;
  label: string;
  plural: string;
};

export const PROFESSIONS: Profession[] = [
  { slug: "personal-trainer", label: "Personal Trainer", plural: "Personal Trainers" },
  { slug: "fitness-instructor", label: "Fitness Instructor", plural: "Fitness Instructors" },
  { slug: "group-fitness-instructor", label: "Group Fitness Instructor", plural: "Group Fitness Instructors" },
  { slug: "strength-coach", label: "Strength Coach", plural: "Strength Coaches" },
  { slug: "nutritionist", label: "Nutritionist", plural: "Nutritionists" },
  { slug: "pilates-instructor", label: "Pilates Instructor", plural: "Pilates Instructors" },
  { slug: "yoga-teacher", label: "Yoga Teacher", plural: "Yoga Teachers" },
];

export const PROFESSION_SLUGS: ProfessionSlug[] = PROFESSIONS.map((p) => p.slug);

const LABEL_BY_SLUG: Record<string, string> = Object.fromEntries(
  PROFESSIONS.map((p) => [p.slug, p.label]),
);

const PLURAL_BY_SLUG: Record<string, string> = Object.fromEntries(
  PROFESSIONS.map((p) => [p.slug, p.plural]),
);

const SLUG_BY_LABEL: Record<string, ProfessionSlug> = Object.fromEntries(
  PROFESSIONS.map((p) => [p.label.toLowerCase(), p.slug]),
) as Record<string, ProfessionSlug>;

export function getProfessionLabel(slug: string | null | undefined): string | null {
  if (!slug) return null;
  return LABEL_BY_SLUG[slug] ?? null;
}

export function getProfessionPlural(slug: string | null | undefined): string | null {
  if (!slug) return null;
  return PLURAL_BY_SLUG[slug] ?? null;
}

export function getProfessionSlugFromLabel(
  label: string | null | undefined,
): ProfessionSlug | null {
  if (!label) return null;
  return SLUG_BY_LABEL[label.toLowerCase()] ?? null;
}

export function isProfessionSlug(s: unknown): s is ProfessionSlug {
  return typeof s === "string" && s in LABEL_BY_SLUG;
}
