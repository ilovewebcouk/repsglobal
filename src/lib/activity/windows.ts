// Canonical time windows for the Activity Command Center.
// One source of truth — every panel, tile, and label imports from here so
// "Live", "Recent", and "Stale" never disagree across the screen.

export const WINDOWS = {
  /** Live = seen in the last 5 minutes. Used for online-now counts. */
  LIVE_MS: 5 * 60_000,
  /** Recent = 5–30 minutes. Used for "recent visitors" and 30-min summaries. */
  RECENT_MS: 30 * 60_000,
  /** Ingest freshness threshold. Above this, the pipeline is "quiet". */
  STALE_MS: 10 * 60_000,
  /** Sparklines / 7-day rollups. */
  SEVEN_DAYS_MS: 7 * 24 * 3600_000,
  /** 24h rollup window. */
  DAY_MS: 24 * 3600_000,
} as const;

export function isLive(lastSeenIso: string | null | undefined, now: number = Date.now()): boolean {
  if (!lastSeenIso) return false;
  return now - new Date(lastSeenIso).getTime() <= WINDOWS.LIVE_MS;
}

export function isRecent(lastSeenIso: string | null | undefined, now: number = Date.now()): boolean {
  if (!lastSeenIso) return false;
  const age = now - new Date(lastSeenIso).getTime();
  return age > WINDOWS.LIVE_MS && age <= WINDOWS.RECENT_MS;
}

export function isStale(lastEventIso: string | null | undefined, now: number = Date.now()): boolean {
  if (!lastEventIso) return true;
  return now - new Date(lastEventIso).getTime() > WINDOWS.STALE_MS;
}
