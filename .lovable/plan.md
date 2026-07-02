# Public Analytics v1.2 — World-Class Visitor Intelligence

Answer to "should we have built it like this / would it be 10/10?": **yes**. The current implementation is a v1 shortcut (subnet-only cache, no dedicated raw-IP table, no confidence/source model, no PostHog derived-property enforcement). Adopting the schema you've drafted moves us to 10/10 — proper separation of derived analytics (PostHog) from raw security telemetry (admin-only Supabase), explicit confidence, and a real retention story.

---

## Deliverables

### 1. Schema migration
- `public.ip_geolocation_cache` — provider cache keyed by `ip_hash`, with `ip_prefix_hash` for /24//48 dedupe, `lookup_status`, `raw_response_jsonb`, TTL via `expires_at`.
  - Success TTL 24h, failure 1h, private/reserved cached as `unavailable` without provider call.
- `public.security_visitor_ip_observations` — full spec fields (session_id, anonymous_id, posthog_distinct_id, user_id, professional_id, event_context, path, referrer, raw_ip, ip_hash, ip_prefix_hash, UA + UA hash, geo, asn, org, location_source, location_confidence, first/last_seen, expires_at). Unique on `(session_id, ip_hash, user_agent_hash)`; repeat sightings bump `last_seen_at`/path.
- Retention defaults: public anon 30d, member/auth 90d, dispute/flag excluded.
- Grants: `service_role` ALL, `authenticated` SELECT via RLS gated on `has_role(auth.uid(),'admin')`. No anon.

### 2. Server library (`src/lib/activity/`)
- `ip-geo.server.ts` — rewrite around new cache table. Lookup priority: **CF headers → cache → ipapi.co → country-only → none**. Emits `{ location_source, location_confidence }`. Skips private IPs. Timeout + failure caching.
- `ip-observations.server.ts` — new. `recordObservation(ctx)` writes to `security_visitor_ip_observations` (upsert on dedupe key). Called from capture pipeline.
- `capture.server.ts` — already wires CF→ipapi fallback; extend to compute confidence/source and to call `recordObservation`. Enforce: **never** put `raw_ip` / `$ip` / `cf-connecting-ip` on the outbound context that reaches PostHog.

### 3. PostHog proxy (`src/routes/api/public/[_]a/$.ts`)
- Confirm mutator strips all raw-IP-adjacent props and injects only `reps_*` derived props: `reps_proxy_v`, `reps_is_internal`, `reps_country_code`, `reps_region`, `reps_city`, `reps_lat`, `reps_lng`, `reps_postal_code`, `reps_timezone`, `reps_asn`, `reps_org`, `reps_location_source`, `reps_location_confidence`. Bump `reps_proxy_v` to 4.

### 4. Backfill (`src/lib/ops/backfill-geo.functions.ts`, admin-only)
- Pulls unique public IPs from `user_sessions`, `member_session_events`, `auth_events` for last 30d.
- Cache-first, ipapi fallback, rate-limited (batch 40/min).
- Writes derived location to source rows and to `security_visitor_ip_observations` where a session_id exists.
- Returns summary: {unique_ips, cache_hits, provider_calls, ok, failed, updated, skipped, rate_limited}.
- Admin trigger button in `/admin/activity` header (behind `has_role admin`).

### 5. Admin UI (`/admin/activity` + Member 360 → Sessions tab)
- `LiveActivityRail` + `WorldMapPanel` show: raw IP, city/region/country · `approximate`, current page, journey (last 3 events), device/browser/OS, referrer, session duration.
- Format helpers: `London, GB · approximate` / `United Kingdom · city unavailable` / `Unknown · location unavailable`.
- Member 360 Sessions tab: same IP block gated to admin.

### 6. Cleanup
- Delete `src/routes/api/public/geo-probe.ts`; drop `GEO_PROBE_TOKEN` from secrets.
- Nightly cron (`pg_cron`) → prunes expired rows per retention rules, skips flagged.

### 7. Proofs (attached in reply)
- Migration SQL, RLS policies, ipapi flow diagram, cache design summary.
- Backfill run report.
- Screenshot of `/admin/activity` with raw IP + confidence line.
- HogQL query showing `reps_*` present and `$ip` / `ip` / `raw_ip` absent.
- Supabase query showing raw IP in `security_visitor_ip_observations`, admin-only.
- Typecheck output.
- Rollback plan: revert migration (drop 2 tables), revert 4 files; PostHog proxy falls back to v3 mutator.

---

## Guardrails (non-negotiable)
- ipapi.co called **server-side only**, cache-first, private IPs never sent.
- Raw IP **never** leaves the server: not to PostHog, not to browser, not to public loaders.
- All raw-IP reads gated by RLS `has_role(auth.uid(),'admin')`.
- Confidence label always shown next to city; never present approximate data as precise.
- v1.1 acceptance checks re-run at the end (custom events arrive, DNT/GPC still suppress, rollup parity).

---

## Execution order (single pass)
1. Migration (2 new tables + RLS + cleanup cron).
2. Rewrite `ip-geo.server.ts` + add `ip-observations.server.ts`.
3. Extend `capture.server.ts` and PostHog proxy mutator.
4. Build backfill server fn + admin trigger.
5. Admin UI upgrades.
6. Delete probe + retire secret.
7. Run backfill on last 30d, capture proofs.

Approve and I'll ship it in one pass.
