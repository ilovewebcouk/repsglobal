// Server-only writer for admin-restricted raw-IP observations.
// Called from every capture endpoint. Deduped on (session_id, ip_hash, user_agent_hash);
// repeat sightings bump last_seen_at + path.
//
// This table is the ONLY place raw IPs are stored. PostHog never receives raw IP.

import { createHmac } from "node:crypto";
import type { CaptureContext } from "./capture.server";

export type EventContext =
  | "page_view"
  | "member_event"
  | "auth"
  | "auth_failed"
  | "enquiry"
  | "conversion"
  | "backfill";

export interface ObservationInput {
  ctx: CaptureContext;
  eventContext: EventContext;
  sessionId?: string | null;
  anonymousId?: string | null;
  posthogDistinctId?: string | null;
  professionalId?: string | null;
  path?: string | null;
  referrer?: string | null;
  ttlSeconds?: number; // default: 30d anon / 90d authed
}

export function hashUserAgent(ua: string | null | undefined): string | null {
  if (!ua) return null;
  const salt = process.env.ACTIVITY_IP_SALT;
  if (!salt) return null;
  return createHmac("sha256", salt).update(ua).digest("hex");
}

export async function recordVisitorObservation(input: ObservationInput): Promise<void> {
  const { ctx, eventContext } = input;
  if (!ctx.ip) return; // nothing to observe
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { hashIp, prefixHash } = await import("./ip-geo.server");
  const ipHash = ctx.ipHash ?? hashIp(ctx.ip);
  const ipPrefixHash = prefixHash(ctx.ip);
  const uaHash = hashUserAgent(ctx.userAgent);

  const now = new Date();
  const ttlMs = (input.ttlSeconds ?? (ctx.userId ? 90 * 24 * 60 * 60 : 30 * 24 * 60 * 60)) * 1000;
  const expires = new Date(now.getTime() + ttlMs);

  const row = {
    session_id: input.sessionId ?? null,
    anonymous_id: input.anonymousId ?? null,
    posthog_distinct_id: input.posthogDistinctId ?? null,
    user_id: ctx.userId,
    professional_id: input.professionalId ?? null,
    event_context: eventContext,
    path: input.path ? input.path.slice(0, 500) : null,
    referrer: input.referrer ? input.referrer.slice(0, 1000) : null,
    raw_ip: ctx.ip,
    ip_hash: ipHash,
    ip_prefix_hash: ipPrefixHash,
    user_agent: ctx.userAgent?.slice(0, 500) ?? null,
    user_agent_hash: uaHash,
    country_code: ctx.countryCode,
    region: ctx.region,
    city: ctx.city,
    postal_code: null,
    latitude: ctx.latitude,
    longitude: ctx.longitude,
    timezone: ctx.timezone,
    asn: null,
    org: null,
    location_source: ctx.locationSource,
    location_confidence: ctx.locationConfidence,
    last_seen_at: now.toISOString(),
    expires_at: expires.toISOString(),
  };

  // Prefer upsert on the unique index (session_id, ip_hash, user_agent_hash)
  // but only when all three are present. Otherwise, plain insert.
  const res =
    row.session_id && row.ip_hash && row.user_agent_hash
      ? await supabaseAdmin
          .from("security_visitor_ip_observations")
          .upsert(row, { onConflict: "session_id,ip_hash,user_agent_hash" })
      : await supabaseAdmin.from("security_visitor_ip_observations").insert(row);
  if (res.error) {
    console.error("[obs-write] insert failed", {
      code: res.error.code,
      message: res.error.message,
      details: res.error.details,
      hint: res.error.hint,
      has_session: !!row.session_id,
      has_ip_hash: !!row.ip_hash,
      has_ua_hash: !!row.user_agent_hash,
      event_context: row.event_context,
    });
    throw new Error(`obs_write_failed: ${res.error.message}`);
  }
}
