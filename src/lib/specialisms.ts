/**
 * Canonical specialism catalogue — single source of truth.
 *
 * Specialisms are PROFESSION-SCOPED. Each profession unlocks a dedicated
 * list of specialisms; a slug listed under multiple professions is shared
 * intentionally (e.g. `weight-management` for PT + Nutritionist).
 *
 * Mirrors the validation trigger on public.professionals
 * (validate_professional_professions). Keep in sync.
 *
 * Pros may pick up to MAX_SPECIALISMS from their profession's list.
 */

import type { ProfessionSlug } from "@/lib/professions";

export type Specialism = {
  slug: string;
  label: string;
  professions: ProfessionSlug[];
};

export const MAX_SPECIALISMS = 3;

/* -------------------------------------------------------------------------- */
/* Per-profession catalogues                                                  */
/* -------------------------------------------------------------------------- */

const PERSONAL_TRAINER: Specialism[] = [
  { slug: "fat-loss", label: "Fat Loss", professions: ["personal-trainer"] },
  { slug: "muscle-gain", label: "Muscle Gain", professions: ["personal-trainer"] },
  { slug: "strength-training", label: "Strength Training", professions: ["personal-trainer"] },
  { slug: "functional-fitness", label: "Functional Fitness", professions: ["personal-trainer"] },
  { slug: "hybrid-training", label: "Hybrid Training", professions: ["personal-trainer"] },
  { slug: "endurance-running", label: "Endurance & Running", professions: ["personal-trainer"] },
  { slug: "triathlon-prep", label: "Triathlon Prep", professions: ["personal-trainer"] },
  { slug: "hyrox-prep", label: "HYROX Prep", professions: ["personal-trainer"] },
  { slug: "marathon-prep", label: "Marathon Prep", professions: ["personal-trainer"] },
  { slug: "body-recomposition", label: "Body Recomposition", professions: ["personal-trainer"] },
  { slug: "pre-post-natal", label: "Pre & Post-Natal", professions: ["personal-trainer"] },
  { slug: "menopause", label: "Menopause", professions: ["personal-trainer"] },
  { slug: "over-50s", label: "Over-50s", professions: ["personal-trainer"] },
  { slug: "youth-training", label: "Youth (under-18s)", professions: ["personal-trainer"] },
  { slug: "rehab-return-to-training", label: "Rehab & Return-to-Training", professions: ["personal-trainer"] },
  { slug: "mobility", label: "Mobility", professions: ["personal-trainer"] },
  { slug: "posture-back-pain", label: "Posture & Back Pain", professions: ["personal-trainer"] },
  { slug: "weight-management", label: "Weight Management", professions: ["personal-trainer"] },
  { slug: "habit-lifestyle", label: "Habit & Lifestyle", professions: ["personal-trainer"] },
  { slug: "home-gym-coaching", label: "Home Gym Coaching", professions: ["personal-trainer"] },
  { slug: "corporate-wellness", label: "Corporate Wellness", professions: ["personal-trainer"] },
  { slug: "online-coaching", label: "Online Coaching", professions: ["personal-trainer"] },
];

const GROUP_FITNESS: Specialism[] = [
  { slug: "indoor-cycling-spin", label: "Indoor Cycling / Spin", professions: ["group-fitness-instructor"] },
  { slug: "bodypump-barbell", label: "BodyPump / Barbell", professions: ["group-fitness-instructor"] },
  { slug: "hiit", label: "HIIT", professions: ["group-fitness-instructor"] },
  { slug: "bootcamp", label: "Bootcamp", professions: ["group-fitness-instructor"] },
  { slug: "circuits", label: "Circuits", professions: ["group-fitness-instructor"] },
  { slug: "les-mills-bodycombat", label: "Les Mills BodyCombat", professions: ["group-fitness-instructor"] },
  { slug: "les-mills-bodyattack", label: "Les Mills BodyAttack", professions: ["group-fitness-instructor"] },
  { slug: "les-mills-bodybalance", label: "Les Mills BodyBalance", professions: ["group-fitness-instructor"] },
  { slug: "les-mills-grit", label: "Les Mills GRIT", professions: ["group-fitness-instructor"] },
  { slug: "step", label: "Step", professions: ["group-fitness-instructor"] },
  { slug: "aqua-aerobics", label: "Aqua Aerobics", professions: ["group-fitness-instructor"] },
  { slug: "dance-fitness-zumba", label: "Dance Fitness / Zumba", professions: ["group-fitness-instructor"] },
  { slug: "kettlebells-class", label: "Kettlebells", professions: ["group-fitness-instructor"] },
  { slug: "barre", label: "Barre", professions: ["group-fitness-instructor"] },
  { slug: "senior-fitness-class", label: "Senior Fitness", professions: ["group-fitness-instructor"] },
  { slug: "chair-based-class", label: "Chair-Based Fitness", professions: ["group-fitness-instructor"] },
  { slug: "box-fit", label: "Box-Fit", professions: ["group-fitness-instructor"] },
  { slug: "metcon-class", label: "MetCon", professions: ["group-fitness-instructor"] },
  { slug: "mobility-class", label: "Mobility Class", professions: ["group-fitness-instructor"] },
  { slug: "pre-post-natal-class", label: "Pre & Post-Natal Class", professions: ["group-fitness-instructor"] },
];

const STRENGTH_COACH: Specialism[] = [
  { slug: "powerlifting", label: "Powerlifting", professions: ["strength-coach"] },
  { slug: "olympic-weightlifting", label: "Olympic Weightlifting", professions: ["strength-coach"] },
  { slug: "hypertrophy", label: "Hypertrophy", professions: ["strength-coach"] },
  { slug: "athletic-performance", label: "Athletic Performance", professions: ["strength-coach"] },
  { slug: "speed-power", label: "Speed & Power", professions: ["strength-coach"] },
  { slug: "return-to-sport", label: "Return to Sport", professions: ["strength-coach"] },
  { slug: "youth-athlete-development", label: "Youth Athlete Development", professions: ["strength-coach"] },
  { slug: "tactical-first-responder", label: "Tactical / First Responder", professions: ["strength-coach"] },
  { slug: "combat-sports-sc", label: "Combat Sports S&C", professions: ["strength-coach"] },
  { slug: "endurance-athlete-sc", label: "Endurance Athlete S&C", professions: ["strength-coach"] },
  { slug: "team-sport-sc", label: "Team Sport S&C", professions: ["strength-coach"] },
  { slug: "field-sport-sc", label: "Field Sport S&C", professions: ["strength-coach"] },
  { slug: "court-sport-sc", label: "Court Sport S&C", professions: ["strength-coach"] },
  { slug: "rugby-sc", label: "Rugby S&C", professions: ["strength-coach"] },
  { slug: "football-sc", label: "Football S&C", professions: ["strength-coach"] },
  { slug: "running-sc", label: "Running S&C", professions: ["strength-coach"] },
  { slug: "cycling-sc", label: "Cycling S&C", professions: ["strength-coach"] },
  { slug: "masters-athlete", label: "Masters Athlete", professions: ["strength-coach"] },
  { slug: "pre-post-natal-strength", label: "Pre & Post-Natal Strength", professions: ["strength-coach"] },
  { slug: "competition-prep", label: "Competition Prep", professions: ["strength-coach"] },
];

const PILATES: Specialism[] = [
  { slug: "mat-pilates", label: "Mat Pilates", professions: ["pilates-instructor"] },
  { slug: "reformer-pilates", label: "Reformer Pilates", professions: ["pilates-instructor"] },
  { slug: "clinical-rehab-pilates", label: "Clinical / Rehab Pilates", professions: ["pilates-instructor"] },
  { slug: "pre-post-natal-pilates", label: "Pre & Post-Natal Pilates", professions: ["pilates-instructor"] },
  { slug: "over-50s-pilates", label: "Over-50s Pilates", professions: ["pilates-instructor"] },
  { slug: "back-care", label: "Back Care", professions: ["pilates-instructor"] },
  { slug: "contemporary-pilates", label: "Contemporary Pilates", professions: ["pilates-instructor"] },
  { slug: "classical-pilates", label: "Classical Pilates", professions: ["pilates-instructor"] },
  { slug: "pilates-for-runners", label: "Pilates for Runners", professions: ["pilates-instructor"] },
  { slug: "pilates-for-athletes", label: "Pilates for Athletes", professions: ["pilates-instructor"] },
  { slug: "chair-pilates", label: "Chair Pilates", professions: ["pilates-instructor"] },
  { slug: "cadillac-tower", label: "Cadillac / Tower", professions: ["pilates-instructor"] },
  { slug: "barre-pilates", label: "Barre Pilates", professions: ["pilates-instructor"] },
  { slug: "mens-pilates", label: "Men's Pilates", professions: ["pilates-instructor"] },
  { slug: "youth-pilates", label: "Youth Pilates", professions: ["pilates-instructor"] },
  { slug: "pelvic-floor-pilates", label: "Pelvic Floor Pilates", professions: ["pilates-instructor"] },
];

const YOGA: Specialism[] = [
  { slug: "vinyasa-flow", label: "Vinyasa Flow", professions: ["yoga-teacher"] },
  { slug: "hatha", label: "Hatha", professions: ["yoga-teacher"] },
  { slug: "yin", label: "Yin", professions: ["yoga-teacher"] },
  { slug: "ashtanga", label: "Ashtanga", professions: ["yoga-teacher"] },
  { slug: "iyengar", label: "Iyengar", professions: ["yoga-teacher"] },
  { slug: "kundalini", label: "Kundalini", professions: ["yoga-teacher"] },
  { slug: "restorative", label: "Restorative", professions: ["yoga-teacher"] },
  { slug: "pregnancy-yoga", label: "Pregnancy Yoga", professions: ["yoga-teacher"] },
  { slug: "postnatal-yoga", label: "Postnatal Yoga", professions: ["yoga-teacher"] },
  { slug: "yoga-for-back-pain", label: "Yoga for Back Pain", professions: ["yoga-teacher"] },
  { slug: "meditation-breathwork", label: "Meditation & Breathwork", professions: ["yoga-teacher"] },
  { slug: "power-yoga", label: "Power Yoga", professions: ["yoga-teacher"] },
  { slug: "rocket-yoga", label: "Rocket Yoga", professions: ["yoga-teacher"] },
  { slug: "hot-yoga", label: "Hot Yoga", professions: ["yoga-teacher"] },
  { slug: "chair-yoga", label: "Chair Yoga", professions: ["yoga-teacher"] },
  { slug: "yoga-for-athletes", label: "Yoga for Athletes", professions: ["yoga-teacher"] },
  { slug: "yoga-for-runners", label: "Yoga for Runners", professions: ["yoga-teacher"] },
  { slug: "kids-yoga", label: "Kids Yoga", professions: ["yoga-teacher"] },
  { slug: "mens-yoga", label: "Men's Yoga", professions: ["yoga-teacher"] },
  { slug: "trauma-informed-yoga", label: "Trauma-Informed Yoga", professions: ["yoga-teacher"] },
  { slug: "yoga-nidra", label: "Yoga Nidra", professions: ["yoga-teacher"] },
  { slug: "sound-healing", label: "Sound Healing", professions: ["yoga-teacher"] },
];

const NUTRITIONIST: Specialism[] = [
  { slug: "weight-management", label: "Weight Management", professions: ["nutritionist"] },
  { slug: "sports-nutrition", label: "Sports Nutrition", professions: ["nutritionist"] },
  { slug: "endurance-nutrition", label: "Endurance Nutrition", professions: ["nutritionist"] },
  { slug: "physique-nutrition", label: "Physique Nutrition", professions: ["nutritionist"] },
  { slug: "gut-health", label: "Gut Health", professions: ["nutritionist"] },
  { slug: "plant-based", label: "Plant-Based", professions: ["nutritionist"] },
  { slug: "female-hormones", label: "Female Hormones", professions: ["nutritionist"] },
  { slug: "menopause-nutrition", label: "Menopause Nutrition", professions: ["nutritionist"] },
  { slug: "pre-post-natal-nutrition", label: "Pre & Post-Natal Nutrition", professions: ["nutritionist"] },
  { slug: "clinical-conditions", label: "Clinical Conditions", professions: ["nutritionist"] },
  { slug: "diabetes-prediabetes", label: "Diabetes / Pre-diabetes", professions: ["nutritionist"] },
  { slug: "cardiovascular-nutrition", label: "Cardiovascular Nutrition", professions: ["nutritionist"] },
  { slug: "habit-behaviour-change", label: "Habit & Behaviour Change", professions: ["nutritionist"] },
  { slug: "intuitive-eating", label: "Intuitive Eating", professions: ["nutritionist"] },
  { slug: "disordered-eating-recovery", label: "Disordered Eating Recovery", professions: ["nutritionist"] },
  { slug: "child-family-nutrition", label: "Child & Family Nutrition", professions: ["nutritionist"] },
  { slug: "youth-athlete-nutrition", label: "Youth Athlete Nutrition", professions: ["nutritionist"] },
  { slug: "vegan-vegetarian", label: "Vegan / Vegetarian", professions: ["nutritionist"] },
  { slug: "corporate-nutrition", label: "Corporate Nutrition", professions: ["nutritionist"] },
  { slug: "online-nutrition-coaching", label: "Online Nutrition Coaching", professions: ["nutritionist"] },
];

const FITNESS_INSTRUCTOR: Specialism[] = [
  { slug: "gym-floor-instruction", label: "Gym Floor Instruction", professions: ["fitness-instructor"] },
  { slug: "inductions-programme-cards", label: "Inductions & Programme Cards", professions: ["fitness-instructor"] },
  { slug: "circuits", label: "Circuits", professions: ["fitness-instructor"] },
  { slug: "older-adults", label: "Older Adults", professions: ["fitness-instructor"] },
  { slug: "youth-gym", label: "Youth Gym", professions: ["fitness-instructor"] },
  { slug: "functional-zone", label: "Functional Zone", professions: ["fitness-instructor"] },
  { slug: "accessible-inclusive-fitness", label: "Accessible & Inclusive Fitness", professions: ["fitness-instructor"] },
  { slug: "gp-referral", label: "GP Referral", professions: ["fitness-instructor"] },
  { slug: "cardio-machines-coaching", label: "Cardio Machines Coaching", professions: ["fitness-instructor"] },
  { slug: "resistance-machines-coaching", label: "Resistance Machines Coaching", professions: ["fitness-instructor"] },
  { slug: "free-weights-intro", label: "Free Weights Intro", professions: ["fitness-instructor"] },
  { slug: "studio-cycling-intro", label: "Studio Cycling Intro", professions: ["fitness-instructor"] },
  { slug: "corporate-gym-floor", label: "Corporate Gym Floor", professions: ["fitness-instructor"] },
];

export const SPECIALISMS_BY_PROFESSION: Record<ProfessionSlug, Specialism[]> = {
  "personal-trainer": PERSONAL_TRAINER,
  "group-fitness-instructor": GROUP_FITNESS,
  "strength-coach": STRENGTH_COACH,
  "pilates-instructor": PILATES,
  "yoga-teacher": YOGA,
  "nutritionist": NUTRITIONIST,
  "fitness-instructor": FITNESS_INSTRUCTOR,
};

/* -------------------------------------------------------------------------- */
/* Derived flat lookups                                                       */
/* -------------------------------------------------------------------------- */

/** Every specialism across all professions (deduped by slug). */
export const ALL_SPECIALISMS: Specialism[] = (() => {
  const seen = new Map<string, Specialism>();
  for (const [prof, list] of Object.entries(SPECIALISMS_BY_PROFESSION)) {
    for (const s of list) {
      const existing = seen.get(s.slug);
      if (existing) {
        // merge professions array
        if (!existing.professions.includes(prof as ProfessionSlug)) {
          existing.professions.push(prof as ProfessionSlug);
        }
      } else {
        seen.set(s.slug, { ...s, professions: [...s.professions] });
      }
    }
  }
  return Array.from(seen.values());
})();

export type SpecialismSlug = string;

export const SPECIALISM_SLUGS: string[] = ALL_SPECIALISMS.map((s) => s.slug);

const LABEL_BY_SLUG: Record<string, string> = Object.fromEntries(
  ALL_SPECIALISMS.map((s) => [s.slug, s.label]),
);

const SLUG_SET: Set<string> = new Set(SPECIALISM_SLUGS);

export function getSpecialismLabel(slug: string | null | undefined): string | null {
  if (!slug) return null;
  return LABEL_BY_SLUG[slug] ?? null;
}

export function isSpecialismSlug(s: unknown): s is string {
  return typeof s === "string" && SLUG_SET.has(s);
}

export function getSpecialismsForProfession(
  profession: ProfessionSlug | null | undefined,
): Specialism[] {
  if (!profession) return [];
  return SPECIALISMS_BY_PROFESSION[profession] ?? [];
}

export function isSpecialismValidForProfession(
  slug: string | null | undefined,
  profession: ProfessionSlug | null | undefined,
): boolean {
  if (!slug || !profession) return false;
  const list = SPECIALISMS_BY_PROFESSION[profession];
  if (!list) return false;
  return list.some((s) => s.slug === slug);
}

/* -------------------------------------------------------------------------- */
/* Legacy-slug mapping (used by title-rules → verification auto-merge)        */
/* -------------------------------------------------------------------------- */

/**
 * Internal vocabulary kept by the qualification rules engine. These slugs
 * are no longer valid for storage on professionals.specialisms; the
 * verification approval flow maps them to a new profession-scoped slug
 * via `mapLegacySpecialism()`.
 */
export type LegacySpecialismSlug =
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

const LEGACY_MAP: Record<LegacySpecialismSlug, Partial<Record<ProfessionSlug, string>>> = {
  "fat-loss": {
    "personal-trainer": "fat-loss",
    "nutritionist": "weight-management",
  },
  "muscle-gain": {
    "personal-trainer": "muscle-gain",
    "strength-coach": "hypertrophy",
  },
  "strength": {
    "personal-trainer": "strength-training",
    "strength-coach": "powerlifting",
  },
  "hybrid-functional": {
    "personal-trainer": "hybrid-training",
    "group-fitness-instructor": "circuits",
    "fitness-instructor": "functional-zone",
  },
  "endurance-running": {
    "personal-trainer": "endurance-running",
    "strength-coach": "endurance-athlete-sc",
    "pilates-instructor": "pilates-for-runners",
    "yoga-teacher": "yoga-for-runners",
    "nutritionist": "endurance-nutrition",
  },
  "sports-performance": {
    "strength-coach": "athletic-performance",
    "pilates-instructor": "pilates-for-athletes",
    "yoga-teacher": "yoga-for-athletes",
    "nutritionist": "sports-nutrition",
  },
  "pre-post-natal": {
    "personal-trainer": "pre-post-natal",
    "group-fitness-instructor": "pre-post-natal-class",
    "strength-coach": "pre-post-natal-strength",
    "pilates-instructor": "pre-post-natal-pilates",
    "yoga-teacher": "pregnancy-yoga",
    "nutritionist": "pre-post-natal-nutrition",
  },
  "over-50s": {
    "personal-trainer": "over-50s",
    "group-fitness-instructor": "senior-fitness-class",
    "strength-coach": "masters-athlete",
    "pilates-instructor": "over-50s-pilates",
    "yoga-teacher": "chair-yoga",
    "fitness-instructor": "older-adults",
  },
  "youth": {
    "personal-trainer": "youth-training",
    "strength-coach": "youth-athlete-development",
    "pilates-instructor": "youth-pilates",
    "yoga-teacher": "kids-yoga",
    "nutritionist": "child-family-nutrition",
    "fitness-instructor": "youth-gym",
  },
  "rehab-injury": {
    "personal-trainer": "rehab-return-to-training",
    "strength-coach": "return-to-sport",
    "pilates-instructor": "clinical-rehab-pilates",
    "yoga-teacher": "yoga-for-back-pain",
    "fitness-instructor": "gp-referral",
  },
  "mobility": {
    "personal-trainer": "mobility",
    "group-fitness-instructor": "mobility-class",
    "pilates-instructor": "mat-pilates",
    "yoga-teacher": "yin",
  },
  "posture-back-pain": {
    "personal-trainer": "posture-back-pain",
    "pilates-instructor": "back-care",
    "yoga-teacher": "yoga-for-back-pain",
  },
  "weight-management": {
    "personal-trainer": "weight-management",
    "nutritionist": "weight-management",
  },
  "habit-lifestyle": {
    "personal-trainer": "habit-lifestyle",
    "nutritionist": "habit-behaviour-change",
  },
  "nutrition-coaching": {
    "nutritionist": "online-nutrition-coaching",
  },
  "online-coaching": {
    "personal-trainer": "online-coaching",
    "nutritionist": "online-nutrition-coaching",
  },
};

export function mapLegacySpecialism(
  legacy: LegacySpecialismSlug,
  profession: ProfessionSlug | null | undefined,
): string | null {
  if (!profession) return null;
  return LEGACY_MAP[legacy]?.[profession] ?? null;
}
