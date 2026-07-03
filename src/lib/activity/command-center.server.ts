// Activity command centre — shared constants + label helpers.
//
// Kept in a *.server.ts sibling so the split transformer in
// command-center.functions.ts cannot lose these references between
// hot reloads (see tanstack-serverfn-splitting).

export const LIVE_MS = 5 * 60_000;
export const RECENT_MS = 30 * 60_000;

export function isLive(iso: string | null | undefined): boolean {
  if (!iso) return false;
  return Date.now() - new Date(iso).getTime() < LIVE_MS;
}

export function isRecent(iso: string | null | undefined): boolean {
  if (!iso) return false;
  return Date.now() - new Date(iso).getTime() < RECENT_MS;
}

/** Canonical location label — used everywhere on /admin/activity. */
export function formatLocationLabel(o: {
  city?: string | null;
  region?: string | null;
  country_code?: string | null;
}): string {
  if (o.city && o.country_code) {
    return o.region ? `${o.city}, ${o.region} · ${o.country_code}` : `${o.city} · ${o.country_code}`;
  }
  if (o.region && o.country_code) return `${o.region} · ${o.country_code}`;
  if (o.country_code) return o.country_code;
  return "Unknown";
}

/** IP masking — keep the same rule the previous surfaces used. */
export function maskIp(raw: string | null | undefined): string | null {
  if (!raw) return null;
  if (raw.includes(":")) {
    const parts = raw.split(":");
    return parts.slice(0, 3).join(":") + ":****";
  }
  const p = raw.split(".");
  if (p.length !== 4) return "****";
  return `${p[0]}.${p[1]}.${p[2]}.***`;
}
