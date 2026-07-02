// Canonical geo resolver.
// Every activity surface (rail, drawer, map tooltip, towns list, member row)
// MUST route through resolveLocation() + formatLocationLabel() so the same
// person renders the same label everywhere.

import { COUNTRY_NAMES, flagEmoji } from "@/lib/activity/labels";

export interface RawLocation {
  city?: string | null;
  region?: string | null;
  country_code?: string | null;
}

export type LocationPrecision = "city" | "region" | "country" | "unknown";

export interface ResolvedLocation {
  city: string | null;
  region: string | null;
  countryCode: string | null;
  countryName: string | null;
  flag: string;
  precision: LocationPrecision;
  /** honest short label — never "United Kingdom · country fallback" under a Towns heading */
  label: string;
  /** full label with region + country when available */
  fullLabel: string;
}

function clean(s?: string | null): string | null {
  if (!s) return null;
  const t = String(s).trim();
  if (!t || t === "??" || t === "XX" || t.toLowerCase() === "unknown") return null;
  return t;
}

export function resolveLocation(raw: RawLocation | null | undefined): ResolvedLocation {
  const city = clean(raw?.city);
  const region = clean(raw?.region);
  const ccRaw = clean(raw?.country_code);
  const cc = ccRaw && ccRaw.length === 2 ? ccRaw.toUpperCase() : null;
  const countryName = cc ? COUNTRY_NAMES[cc] ?? cc : null;
  const flag = flagEmoji(cc);

  let precision: LocationPrecision = "unknown";
  if (city) precision = "city";
  else if (region) precision = "region";
  else if (cc) precision = "country";

  let label: string;
  if (city) label = city;
  else if (region) label = region;
  else if (countryName) label = countryName;
  else label = "Unknown";

  const fullLabelParts = [city, region, countryName].filter(Boolean) as string[];
  const fullLabel = fullLabelParts.length ? fullLabelParts.join(", ") : "Unknown";

  return { city, region, countryCode: cc, countryName, flag, precision, label, fullLabel };
}

/** Short one-liner: "City, CC" or "Region, CC" or "Country" or "Unknown". */
export function formatLocationLabel(raw: RawLocation | null | undefined): string {
  const r = resolveLocation(raw);
  if (r.precision === "city" && r.countryCode) return `${r.city}, ${r.countryCode}`;
  if (r.precision === "region" && r.countryCode) return `${r.region}, ${r.countryCode}`;
  if (r.precision === "country") return r.countryName ?? "Unknown";
  return "Unknown";
}

/** Full label: "City, Region, Country" — used in drawer / tooltip. */
export function formatFullLocationLabel(raw: RawLocation | null | undefined): string {
  return resolveLocation(raw).fullLabel;
}
