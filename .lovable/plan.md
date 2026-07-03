# /admin/activity — Rebuild (revised) + Brutal Backend Cleanup

You want the Realtime card kept. Fine — it stays, wired to the new command function so its numbers actually agree with the rest of the page. Now the honest part: **what to rip out of the backend.**

---

## Part A — What each vendor/table actually costs you (brutal honesty)

### 1. PostHog — **RIP IT OUT. Completely.**

**What it does for you today:** Historical rollups (7-day pageviews), a "realtime" feed that duplicates Supabase, sparkline data.

**What it costs you:**
- Money (per-event pricing, forever).
- A second source of truth that disagrees with Supabase — this is the single biggest reason your page contradicts itself.
- A browser SDK that ad-blockers eat, that Playwright can't run, that needs consent-banner plumbing, that made the beacon fail QA twice.
- A whole proxy route (`/e/*`), diagnostics table, ingest state table, HogQL query code, PostHog cron.
- Complexity every debugging session pays for.

**What you actually lose by deleting it:** The 7-day pageview number on this page. That's it. Supabase already stores everything else (journeys, sessions, conversions, events).

**Verdict: DELETE.** Uninstall the SDK, delete the proxy route, delete the rollup cron, delete `metrics_daily_public_analytics` (or freeze it read-only if you want to keep the history you already collected). Every "Last N days" number can be computed from `visitor_journeys` / `member_session_events` in SQL, on-demand, for free.

### 2. MaxMind — **KEEP for now. Reconsider later.**

**What it does:** Turns raw IPs into city + lat/lng for map dots.

**What it costs you:** A licence key, a lookup on every ingest, a cache table, edge-case failures.

**Honest take:** Country you get free from Cloudflare headers. **City** is the only thing MaxMind buys you, and city is what makes the map interesting instead of "a picture of the UK." You said keep enrichment for now — I agree, but only because you have a map. If you later decide the map isn't earning its keep, MaxMind goes with it.

**Verdict: KEEP** (in line with your amendment). Flag for review in 90 days: "is anyone actually making a decision from city-level dots? If not, drop MaxMind and use CDN country only."

### 3. `ip_geo_cache` + `ip_geolocation_cache` — **CONSOLIDATE.**

You have two IP geo cache tables. That's a straight-up bug. Pick one, drop the other. (I'd need one read to tell you which is live — I'll do that at build time.)

### 4. `page_view_events` — **DELETE.**

Docs already flag this as deprecated (`page-view-events-deprecation-decision.md`). It's superseded by `visitor_journeys` + `security_visitor_ip_observations`. Kill the table, kill any remaining writers.

### 5. `proxy_ingest_diagnostics` — **KEEP but hide.**

Useful for you when something breaks. Not useful on `/admin/activity`. Move the reader to `/admin/system` (the diagnostics drawer already covers this). Add a nightly purge (>7 days) so it doesn't grow forever.

### 6. `public_analytics_ingest_state`, `public_analytics_consent_events` — **DELETE with PostHog.**

They exist only to serve the PostHog proxy. When PostHog goes, these go.

### 7. `member_session_events`, `user_sessions`, `auth_events`, `visitor_journeys`, `security_visitor_ip_observations`, `public_visitor_conversions`, `admin_audit_log` — **KEEP, untouched.**

These are the evidence layer you told me to protect. They're the right shape, they're populated by triggers/RPCs you already own, and they're the only source the new command function reads from.

### 8. `metrics_monthly_activity`, `metrics_daily_public_analytics` — **FREEZE, don't feed.**

Stop writing to them. Leave the historical rows in place in case you want a `/admin/analytics` page later. If in 90 days you haven't built that page, drop the tables.

---

## Part B — The rebuild (amended: Realtime card stays)

Same shape as before, one canonical function powers the page.

### `getActivityCommandCenter()` returns:

```
{
  last_updated, stale,
  live_now              { public, members, total },
  public_live[],        // for Online Now + drawer
  members_live[],       // for Online Now + drawer
  online_now[],         // deduped union
  pages_being_viewed_now[],
  map_markers[],        // MaxMind city dots, deduped per session
  realtime_summary: {   // ← feeds the KEPT Realtime card
    visitors_members_online_now: number,
    public_now: number,
    members_now: number,
    events_30m: number,
    activity_per_minute_30m: number[],   // 30-length array for the sparkline
    peak_per_minute_30m: number,
    devices_online_now: { mobile: number, desktop: number, tablet: number },
    stale: boolean,
    updated_at: string,
  },
  recent_session_events[],  // for the drawer only
}
```

Everything the current Realtime card renders (visitors+members big number, three tiles, sparkline, device split, stale pill, "updated HH:MM:SS") is fed from `realtime_summary` — but computed from Supabase only, not PostHog. So the card *keeps its look*, and its numbers finally agree with Online Now and the map.

### UI layout (unchanged from prior approval, Realtime card kept)

```
┌─────────────────────────────────────────────────────────────┐
│ [ Map — city dots, ≤600px ]         │ [ Realtime card ]     │
├─────────────────────────────────────┴───────────────────────┤
│ [ Online Now ]                     │ [ Pages Being Viewed ] │
└─────────────────────────────────────────────────────────────┘
```

Drawer opens from any row/marker: journey · device/location · masked IP · Reveal IP (audited) · Member 360 link.

Nothing else on the page.

---

## Part C — Ordered demolition + rebuild

1. **Command function.** `command-center.server.ts` + `command-center.functions.ts`. Single Supabase read pass. Includes the `realtime_summary` slice needed by the kept card.
2. **Rewire /admin/activity.** One `useQuery`; pass slices to Map, RealtimeSummaryCard, OnlineNow, PagesBeingViewedNow. Delete every other data source on the route.
3. **Rewire RealtimeSummaryCard.** Take a single `realtime_summary` prop; delete its own fetch calls. Look stays identical.
4. **Move DiagnosticsDrawer + BackfillGeoButton** to `/admin/system`.
5. **Rip PostHog:**
   - Delete the SDK import from `usePublicAnalyticsBeacon`.
   - Delete `src/routes/e.*` proxy route(s).
   - Delete the PostHog rollup cron + `scripts/ops/trigger-posthog-rollup.sh`.
   - Delete PostHog env vars from `.env*`.
   - Delete `getPublicRealtime`, PostHog paths in `getRealtimeSummary`, sparkline HogQL queries.
   - Migration: drop `page_view_events`, `public_analytics_ingest_state`, `public_analytics_consent_events`. Freeze `metrics_daily_public_analytics` (revoke inserts).
6. **Consolidate IP geo cache:** pick the one that's actually written to, drop the other.
7. **Nightly purge** on `proxy_ingest_diagnostics` (>7d) and `security_visitor_ip_observations` (>90d) via `pg_cron`.
8. **Playwright smoke:** load `/admin/activity`, assert no request goes to `posthog.com` or `/e/`, assert the four panels render, assert the Realtime card numbers equal the derived numbers from Online Now.

---

## Part D — Definition of done

- One server function feeds the whole page.
- Numbers agree with each other because they share a payload.
- Realtime card stays visually; its numbers finally match reality.
- No PostHog. Zero. Not in the browser, not on the server, not in cron, not in `.env`.
- MaxMind kept, on 90-day review.
- Evidence tables in §Part A/7 untouched.
- Diagnostics + backfill live at `/admin/system`.
- One IP geo cache table, not two.
- `page_view_events` gone.

---

## Two things I need from you before I start

1. **PostHog historical data — bin or keep?**
   - "**bin**" → I drop `metrics_daily_public_analytics` too. Cleanest.
   - "**keep**" → I freeze it read-only. You can build `/admin/analytics` off it later.

2. **Purge windows OK?**
   - Diagnostics >7d deleted.
   - Raw IP observations >90d deleted (masked/hashed fields could survive longer if you want — say the word).

Reply with those two answers (or "bin, defaults") and I'll start with the command function.