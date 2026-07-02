// Admin Activity v1.2 — display label helpers.
// Keep labels HONEST: never expose internal tier names like "verified" or
// "trialing" to admins, and never render "??" / null for missing country.

export const COUNTRY_NAMES: Record<string, string> = {
  GB: "United Kingdom", US: "United States", IE: "Ireland", DE: "Germany",
  FR: "France", ES: "Spain", IT: "Italy", NL: "Netherlands", AU: "Australia",
  CA: "Canada", NZ: "New Zealand", ZA: "South Africa", AE: "United Arab Emirates",
  IN: "India", PT: "Portugal", PL: "Poland", SE: "Sweden", NO: "Norway",
  DK: "Denmark", FI: "Finland", BE: "Belgium", CH: "Switzerland", AT: "Austria",
  BR: "Brazil", MX: "Mexico", JP: "Japan", SG: "Singapore", HK: "Hong Kong",
  KR: "South Korea", TR: "Turkey", GR: "Greece", CZ: "Czechia", RO: "Romania",
  HU: "Hungary", IL: "Israel", TH: "Thailand", MY: "Malaysia", PH: "Philippines",
  ID: "Indonesia", VN: "Vietnam", CL: "Chile", AR: "Argentina", CO: "Colombia",
  NG: "Nigeria", KE: "Kenya", EG: "Egypt", SA: "Saudi Arabia", QA: "Qatar",
  RU: "Russia", UA: "Ukraine", CN: "China", TW: "Taiwan", IS: "Iceland",
  MT: "Malta", CY: "Cyprus", LU: "Luxembourg", LT: "Lithuania", LV: "Latvia",
  EE: "Estonia", SK: "Slovakia", SI: "Slovenia", HR: "Croatia", BG: "Bulgaria",
};

export function flagEmoji(cc: string | null | undefined): string {
  if (!cc || cc.length !== 2) return "🌐";
  const A = 0x1f1e6;
  const a = cc.toUpperCase().charCodeAt(0);
  const b = cc.toUpperCase().charCodeAt(1);
  if (a < 65 || a > 90 || b < 65 || b > 90) return "🌐";
  return String.fromCodePoint(A + a - 65, A + b - 65);
}

export function countryDisplay(cc: string | null | undefined): {
  code: string | null; label: string; flag: string; isUnknown: boolean;
} {
  const clean = cc && cc.length === 2 && cc !== "??" && cc !== "XX" ? cc.toUpperCase() : null;
  if (!clean) return { code: null, label: "Unknown country", flag: "🌐", isUnknown: true };
  return { code: clean, label: COUNTRY_NAMES[clean] ?? clean, flag: flagEmoji(clean), isUnknown: false };
}

/**
 * Convert internal subscription tier + status to a user-safe label.
 * Amendment 4: never surface "verified", "trialing", "free trial", "migrated",
 * "BD" or "legacy" as tier names in Activity surfaces.
 */
export function tierLabel(tier: string | null | undefined, status?: string | null): string | null {
  if (!tier) return null;
  const t = tier.trim().toLowerCase();
  const s = (status ?? "").trim().toLowerCase();
  const coreTiers = new Set(["core", "verified", "migrated", "bd", "legacy", "trial"]);
  if (coreTiers.has(t)) {
    if (s === "trialing" || s === "trial") return "Core · scheduled renewal";
    if (s === "canceled" || s === "cancelled") return "Core · ended";
    return "Core";
  }
  if (t === "pro") return "Pro";
  if (t === "studio") return "Studio";
  // Unknown tier: title-case
  return tier.charAt(0).toUpperCase() + tier.slice(1).toLowerCase();
}

/** Human-friendly subscription status label. */
export function subscriptionStatusLabel(status: string | null | undefined): string {
  const s = (status ?? "").toLowerCase();
  switch (s) {
    case "active": return "active paid";
    case "trialing": return "scheduled renewal";
    case "canceled":
    case "cancelled": return "ended";
    case "past_due": return "past due";
    case "unpaid": return "unpaid";
    case "incomplete": return "incomplete";
    case "incomplete_expired": return "expired";
    default: return status ?? "unknown";
  }
}

/**
 * Canonical location resolver (build-contract §14).
 * Every panel/row/tooltip MUST format location via this helper.
 */
export function formatLocationLabel(row: {
  city?: string | null;
  region?: string | null;
  country_code?: string | null;
}): string {
  const city = (row.city ?? "").trim();
  const region = (row.region ?? "").trim();
  const cc = (row.country_code ?? "").trim().toUpperCase();
  const bad = (v: string) => !v || v.toLowerCase() === "unknown" || v === "??" || v === "XX";
  if (!bad(city)) {
    const tail = !bad(region) ? `${region}, ${cc}` : cc || "";
    return tail ? `${city}, ${tail}` : city;
  }
  if (!bad(region)) return cc ? `${region}, ${cc}` : region;
  if (cc) return COUNTRY_NAMES[cc] ?? cc;
  return "Unknown location";
}

