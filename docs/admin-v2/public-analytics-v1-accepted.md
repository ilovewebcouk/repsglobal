# Public Analytics v1 — Accepted as Complete

**Date:** 2026-07-01
**Verdict:** A — Complete and safe to run (accepted by founder).

Supersedes / closes: `public-analytics-v1-end-to-end-qa.md`, `public-analytics-v1-activation-report.md`.

## Proven end-to-end

- Published bundle on `repsuk.org` uses `/api/public/_a/*` proxy.
- Legacy root `/config.js`, `/flags/`, `/e/` 404 bug not reproducible.
- Proxy `POST /api/public/_a/e/` → `200 {"status":"Ok"}` from PostHog EU.
- Consented browser activity reaches PostHog EU.
- Supabase rollup populated for `2026-07-01` (5 pv / 2 sessions).
- `public_analytics_ingest_state.last_status = ok`.
- `/admin/activity` Public Visitors panel reads `metrics_daily_public_analytics`.
- Public visitors isolated from member/admin activity streams.
- Admin + member traffic excluded from public analytics rollup (`is_internal != true`).
- DNT / GPC / bot UAs dropped at proxy (204).
- `$ip` stripped before forwarding to PostHog.
- No raw public event/session tables in Supabase (rollup + conversions only).
- `public_visitor_conversions` empty — expected (no live conversions since activation).

## Tracked follow-ups (non-blocking)

1. **Ingest-state clarity** — add `last_top_up_date` (or equivalent) so today's on-load auto-sync isn't confused with the nightly `last_pulled_date`.
2. **Auto-sync memoisation** — add a short cache (~60 s) around today's on-load auto-sync if admin traffic grows.
3. **First-conversion spot-check** — after the first real enquiry / signup / checkout, verify the resulting `public_visitor_conversions` row: `session_id`, `posthog_distinct_id` linkage, no IP columns.
4. **Ingest health pill** — surface `public_analytics_ingest_state.last_status` in `/admin/activity` with a red pill when `error`.

## Next: Public Analytics v1.1

See `public-analytics-v1-1-realtime-layer-plan.md`. Scope:

- Realtime "Public visitors online" KPI.
- Current public pages being viewed.
- Public visitor country bubbles on the world map.
- Members / Public / Both map toggle.
- Blue public map layer (distinct from member green).
- Cached live PostHog query (short TTL).
- Graceful fallback when the live PostHog query fails (fall back to last rollup + stale badge).
