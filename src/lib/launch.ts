/**
 * Pre-launch configuration.
 *
 * LAUNCH_AT_UTC: the public launch instant in UTC.
 *   Friday 19 June 2026, 00:00 Europe/London (BST = UTC+1)
 *   = 2026-06-18T23:00:00.000Z
 *
 * LAUNCH_GATE_ENABLED: when true, every non-authenticated visitor is
 * redirected to /coming-soon. Authenticated users see the real site.
 * Flip to false at launch — single line change.
 */
export const LAUNCH_AT_UTC = new Date("2026-06-18T23:00:00.000Z");

export const LAUNCH_GATE_ENABLED = true;

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
