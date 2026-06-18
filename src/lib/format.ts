/**
 * Format helpers shared across public surfaces.
 */

/**
 * Special-case labels for known specialism slugs. Anything not in this map
 * falls back to title-casing with hyphens replaced by spaces.
 */
const SPECIALISM_LABEL_MAP: Record<string, string> = {
  "pre-post-natal": "Pre/Post-Natal",
  "rehab-return-to-training": "Rehab & Return",
  "over-50s": "Over-50s",
  "hybrid-training": "Hybrid Training",
  "fat-loss": "Fat Loss",
  "strength-training": "Strength Training",
  "marathon-prep": "Marathon Prep",
  "mobility": "Mobility",
};

export function formatSpecialismLabel(slug: string): string {
  const key = slug.toLowerCase().trim();
  if (SPECIALISM_LABEL_MAP[key]) return SPECIALISM_LABEL_MAP[key];
  return key
    .split("-")
    .map((part) => (part.length ? part[0].toUpperCase() + part.slice(1) : part))
    .join(" ");
}
