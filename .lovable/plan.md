## Audit findings

I traced the "member pages now with zero online" bug end to end and pulled live counts from the database.

### 1. Root cause (P0) — server returns ghost rows
`getCurrentPages` in `src/lib/ops/activity-panels.functions.ts` (lines 277–341) merges three sources into one `perPage` map:
- **Live sessions** (`user_sessions`, last 5 min, `ended_at IS NULL`)
- **24h page views** (`member_session_events`)
- **Prior 24–48h page views** (for trend)

The 24h/48h loops call `perPage.get(r.path) ?? { online: new Set(), ... }`, so **any path viewed in the last 24 h leaks into the "now" list with `online_count = 0`**. That is why you see `/dashboard 0`, `/forgot-password 0`, `/reset-password 0`, `/dashboard/profile 0`, `/dashboard/settings 0`.

Verified against the live DB right now:
- `live_sessions_5m = 0`, `live_sessions_30m = 0`
- `journeys_live_5m = 0`, `journeys_30m = 0`
- `distinct_paths_24h = 10` ← these are the ghost rows the panel is displaying
- Last member session heartbeat: **~1.5 h ago**; last visitor journey: ~13 min ago

So the header line "0 public · 0 members" is correct; the "Member pages now" list is lying.

### 2. Secondary bug (P1) — no online heartbeat
`useActivityBeacon.ts` only posts to `/api/public/activity/session-event` on **route change**. There is no interval heartbeat. A signed-in member sitting on `/dashboard` for >5 min silently drops out of "online now", and `last_seen_at` on `user_sessions` never advances (confirmed: newest session row is 1.5 h old even though members were on the site more recently). This under-reports every "members online" figure in the whole page.

### 3. Cosmetic layer (already partially fixed)
`LiveActivityRail.tsx` was updated earlier this session to filter `online_count > 0`, but the panel still renders because the server sends the rows in the first place, and the fix must land server-side to be authoritative (client filter is only a belt-and-braces guard).

### 4. Zone contradictions to reconcile
- "Live activity" panel header shows `0 public · 0 members` while its own child sections list 5 rows.
- "Countries live" / "Public visitors" empty states are correct given `journeys_live_5m = 0`.
- CompactStatusStrip Health tile now downgrades to "Quiet" on stale ingest (already shipped this session).

---

## Fix plan

### A. Server: stop emitting ghost rows (P0)
File: `src/lib/ops/activity-panels.functions.ts`
- In `getCurrentPages`, after building `perPage`, filter to `b.online.size > 0` before mapping to `CurrentPageRow`.
- Keep the 24h/48h views in the aggregation so `views_24h` and `trend_pct` are still populated **for paths that are online now**, but do not create map entries from those loops. Change:
  ```
  for (const r of views24) {
    const b = perPage.get(r.path);
    if (!b) continue;         // only annotate paths that are actually live
    b.views24++;
  }
  ```
  Same for the 48h loop.
- Sort/limit unchanged.

Net effect: "Member pages now" only ever lists paths with at least one member online, with truthful counts.

### B. Client: heartbeat so "online now" is truthful (P1)
File: `src/hooks/useActivityBeacon.ts`
- Add a low-cost heartbeat interval (default 60 s) that reposts `/api/public/activity/session-event` with the current `pathname`, tab `session_id`, and `duration_ms`. Skip when tab is hidden (`document.visibilityState !== "visible"`) and when path starts with `/admin`.
- On `visibilitychange` back to visible, fire one immediate beacon.
- On `beforeunload`, keep the existing keepalive path.

Server side no change needed — the existing `/api/public/activity/session-event` handler already bumps `user_sessions.last_seen_at`.

### C. Defensive client filter stays
Leave the `p.online_count > 0` filter in `LiveActivityRail.tsx` as a belt-and-braces guard; it costs nothing.

### D. QA after deploy
1. Sign in as `demo-verified@repsuk.org`, sit on `/dashboard`, wait 3 min. Expect:
   - `admin/activity` "Members now" ≥ 1, "Member pages now" shows `/dashboard 1`, no zero rows.
2. Navigate to `/dashboard/profile`. Expect list to switch within one poll.
3. Close tab. Wait 6 min. Expect member drops off "online now" and "Member pages now" empties (no ghosts).
4. Re-run the SQL from the audit — `live_sessions_5m` should track reality; `distinct_paths_24h` staying higher is expected and no longer bleeds into the panel.

### Out of scope for this pass
- PostHog / journey ingest debugging (public visitors panel already correctly shows empty).
- Any UI restyling — only data-correctness fixes.
- Diagnostics drawer changes.

## Technical details
- `getCurrentPages` runs under `requireSupabaseAuth` + `assertAdmin`, so filtering on the server is safe.
- Heartbeat interval must be `clearInterval`-ed in the effect cleanup, and only start once auth is present (`authHeaders()` already no-ops when unauthenticated).
- 60 s interval + 5 min freshness window gives us five heartbeats before drop-off, which is well within the existing table's write budget and matches the polling cadence of the admin page (60 s in the queries).
