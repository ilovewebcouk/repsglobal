/**
 * Pre-launch configuration.
 *
 * LAUNCH_AT_UTC: the public launch instant in UTC.
 *   Saturday 27 June 2026, 00:00 Europe/London (end of Fri 26 Jun, BST = UTC+1)
 *   = 2026-06-26T23:00:00.000Z
 *
 * LAUNCH_GATE_ENABLED: when true, every non-authenticated visitor is
 * redirected to /coming-soon. Authenticated users see the real site.
 * Flip to false at launch — single line change.
 */
export const LAUNCH_AT_UTC = new Date("2026-06-26T23:00:00.000Z");

/**
 * BD CSV import timestamp.
 *
 * Legacy honour cutoff: a BD member only qualifies for the £34 → £99
 * Subscription Schedule if their original BD `next_due_at` is on or after
 * this date. Anyone whose access had already lapsed before the CSV was
 * imported is considered long-overdue and goes straight to £99/yr at launch
 * with no honour year.
 *
 * Set to the actual BD CSV import instant: 14 Jun 2026 17:24:51 UTC
 * (verified from `bd_member_seed.created_at`).
 */
export const LEGACY_HONOUR_CUTOFF = new Date("2026-06-14T17:24:51.000Z");

export const LAUNCH_GATE_ENABLED = true;

/**
 * Preview unlock — lets a known person bypass the coming-soon gate to browse
 * the full public site before launch.
 *
 * - Set PREVIEW_UNLOCK_CODE to whatever you want to share privately.
 * - On the /coming-soon page, clicking the © in the footer opens a password
 *   dialog. Correct code → flag stored in localStorage → gate bypassed.
 * - Clear the flag by running `localStorage.removeItem('reps_preview_unlock')`
 *   in the browser console, or by changing the code below.
 */
export const PREVIEW_UNLOCK_CODE = "repsbeta2026";
export const PREVIEW_STORAGE_KEY = "reps_preview_unlock";

export function hasPreviewUnlock(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(PREVIEW_STORAGE_KEY) === PREVIEW_UNLOCK_CODE;
  } catch {
    return false;
  }
}

/**
 * Paths that should remain reachable for everyone (auth flows, the
 * coming-soon page itself, server routes, static assets).
 */
export function isAllowlistedPath(pathname: string): boolean {
  if (pathname === "/coming-soon") return true;
  if (pathname.startsWith("/auth")) return true;
  if (pathname.startsWith("/reset-password")) return true;
  if (pathname.startsWith("/accept-invite")) return true;
  if (pathname.startsWith("/api/")) return true;
  if (pathname.startsWith("/__l5e/")) return true;
  if (pathname.startsWith("/_build/")) return true;
  if (pathname.startsWith("/lovable/")) return true;
  return false;
}

