/**
 * Canonical initials helper used everywhere we render an avatar fallback.
 * - "James Wilson" -> "JW"
 * - "Cher"         -> "CH"
 * - ""/null        -> "?"
 */
export function initialsFromName(name: string | null | undefined): string {
  const n = (name ?? "").trim();
  if (!n) return "?";
  const parts = n.split(/\s+/).filter(Boolean);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}
