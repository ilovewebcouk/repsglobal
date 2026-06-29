/**
 * Public-visibility gate (Phase 5).
 *
 * REPs is a public register, but only paying members appear on public-facing
 * surfaces. A professional is "publicly visible" when:
 *   - professionals.is_published = true
 *   - professionals.is_demo      = false
 *   - they have a subscription in (active|trialing|past_due) at a paid tier
 *     (verified|pro|studio)
 *
 * This file is server-only (`.server.ts`) and is loaded inside handler bodies
 * via dynamic import so the helper stays out of client bundles.
 */

import { supabaseAdmin } from "@/integrations/supabase/client.server";

let _cache: { ids: Set<string>; expires: number } | null = null;
const TTL_MS = 30_000;

/** Returns the canonical set of professional IDs that may appear on public
 *  surfaces (directory, profession + city landing pages, hero rail, public
 *  profile, shop-front). Cached briefly to keep page loads fast. */
export async function getPubliclyVisibleProIds(): Promise<Set<string>> {
  const now = Date.now();
  if (_cache && _cache.expires > now) return _cache.ids;
  const { data, error } = await supabaseAdmin.rpc("list_publicly_visible_pro_ids");
  if (error) throw error;
  const ids = new Set(
    ((data ?? []) as Array<{ id: string } | string>).map((r) =>
      typeof r === "string" ? r : r.id,
    ),
  );
  _cache = { ids, expires: now + TTL_MS };
  return ids;
}

/** Single-profile gate. Returns true when the pro should be public-facing. */
export async function isProPubliclyVisible(proId: string): Promise<boolean> {
  const { data, error } = await supabaseAdmin.rpc("is_pro_publicly_visible", {
    _pro_id: proId,
  });
  if (error) throw error;
  return !!data;
}
