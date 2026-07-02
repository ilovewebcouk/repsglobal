
# Activity Command Center — v4 Rebuild Plan

Mapped 1-to-1 against `REPs_Activity_Command_Center_Build_Contract_v1.md`. Every step below is scoped to one contract section so you can accept, reject, or defer each in isolation. Nothing here changes ingest, journeys, security tables, or PostHog hygiene — those P0 fixes are already in.

Build order is enforced (§25). Do not skip ahead.

---

## Step 0 — Contract landing
**Contract:** §0, §30
- Save the contract to `docs/admin-v2/build-contract-v1.md`.
- Add a `mem://phase/activity-command-center` note pinning the north star and the "must answer one of five operator questions" rule.
- No UI change.

**Accept =** contract is in-repo and referenced by every subsequent PR.

---

## Step 1 — Shared live logic (foundation)
**Contract:** §4 (windows), §11 (`LiveCommandSummary`), §14 (location resolver), §24 (data contracts)

New server + shared code, no UI yet:
- `src/lib/activity/live-command-summary.functions.ts` — one server function returning the `LiveCommandSummary` shape verbatim. Computed once, server-side, from `visitor_journeys`, `user_sessions`, `member_session_events`, `public_visitor_conversions`, `needs_attention` view.
- `src/lib/activity/location-resolver.ts` — pure `formatLocationLabel(row)` + `locationConfidence(row)`. Exported for every surface.
- `src/lib/activity/windows.ts` — single source for `LIVE_MINUTES = 5`, `RECENT_MINUTES = 30`, plus `classifyStatus(last_seen_at)`.
- Extend `getPublicVisitorsLive` to return the full `PublicVisitorLiveRow` shape (adds `location_label`, `location_confidence`, `path_history`, `page_count`, `status`).
- New `getPagesBeingViewedNow` server fn returning `PageBeingViewedRow[]` — dedup by `latest_path`, join member sessions + public journeys, drop zero rows.

**Accept =** three server fns return typed data; unit-level sanity via psql; no UI regression. This unlocks every zone below.

---

## Step 2 — Zone 3: compact status strip
**Contract:** §5 Zone 3, §10, §26 (remove Views 5m, standalone Ingest)
- Replace current `AnalyticsStrip` at the top with a new `CommandStatusStrip` bound to `LiveCommandSummary` — six tiles max: Live now / Public now / Members now / Key actions / Action queue / Health.
- Height cap 72–96px. No sparkline in this strip (sparklines move to the historical section, Step 8).
- Health tile shows only Healthy / Degraded / Action needed; details live in the diagnostics drawer.

**Accept =** strip renders from the shared summary, all five operator questions have a home, no jargon.

---

## Step 3 — Zone 2: AlertBand
**Contract:** §5 Zone 2, §9, §19 (interaction with Action Queue)
- New `AlertBand` component. Renders 0px unless `summary.action_queue.critical > 0` or ingest broken.
- Copy set from §9 + our two additions: verification blocker spike, email bounce spike.
- Sits above the status strip.

**Accept =** invisible when clean, correct copy + action link when a fixture critical row is present.

---

## Step 4 — Zone 4: hero map + realtime card
**Contract:** §12, §13, §14
- `RealtimeSummaryCard` rewritten to consume `LiveCommandSummary` only. Big hero number = `summary.live_now`. Add per-minute bar chart from `summary.activity_per_minute` and device donut from `summary.devices_online`. State copy per §12 table. Forbidden words list enforced by lint comment.
- `ClientOnlyMap` marker rules:
  - Sizing formula `clamp(6 + sqrt(count) * 2, 6, 18)`, screen-space (not geo-scaled).
  - Public = filled blue, Member = filled orange, mixed = split pill cluster, country-only = hollow ring.
  - Live/Recent/Stale visual states from §13.1; Stale hidden by default.
  - Tooltip uses `formatLocationLabel`.
- Layout: map 8/12 (560–680px, cap 600), card 4/12, both align to same height.

**Accept =** T04 marker sizing, T02 city consistency, T05 quiet state pass on staging fixtures.

---

## Step 5 — Zone 5: Online Now + Pages Being Viewed Now
**Contract:** §15, §16
- Delete the current `LiveActivityRail` tab pattern. Replace with two side-by-side panels:
  - `OnlineNowPanel` — sections: Members, Public visitors, (optional collapsed) Recent. Member row exactly per §15.2 (avatar, name, tier, current page, device/browser, resolved location, last seen, Open button, row-click → member drawer). Public row per §15.3 with masked IP only.
  - `PagesBeingViewedPanel` — grouped by path, counts + chips, sort live/count/recent, zero rows never rendered, empty state copy per §22.
- Both panels use `formatLocationLabel`.

**Accept =** T06 member row + T07 pages now pass; owner has restored the pre-regression member row.

---

## Step 6 — Zone 6: Action Queue
**Contract:** §19, §26
- Rename `NeedsAttentionPanel` → `ActionQueuePanel`. Split into Critical (always expanded) + Warning (compact) + Other (collapsed by default).
- Drop non-actionable rows (support news emails, delivery notices) into the Other bucket; do not surface at top.
- Wires the AlertBand from Step 3.

**Accept =** critical items float; no old warnings visible in normal state.

---

## Step 7 — Drawers
**Contract:** §17, §18, §27
- `PublicVisitorDrawer` rewritten to the §17 field list. Journey uses `path_history` + event history from the extended row. Masked IP always default.
- New `MemberSessionDrawer` opened by row-click on member (Open button still routes to admin member profile per §18). Timeline from `member_session_events`; linked pre-signup journey via existing `linkVisitorToUser` join.
- Reveal IP flow per §17.1: modal with `reason` (min 8 chars) → `revealVisitorIp` server fn (already exists, admin-gated, writes `security_ip_reveal_audit` with no raw IP in the audit row) → reveal in-drawer.

**Accept =** T08, T09 pass. Audit row confirmed no raw IP via SQL check.

---

## Step 8 — Zone 7 + 9: historical + audit demotion
**Contract:** §20, §22
- Move `PublicVisitorsPanel` (24h rollup) below the fold, labelled "24h analytics summary — refreshed Xm ago", collapsible.
- Sparklines (Signups/Conversions/Enquiries/Checkouts trend) live here, not in the top strip.
- Member analytics + Recent activity feed stay below rollup, both labelled historical.
- Add clear divider between "Live operations" (Zones 3–6) and "Historical" (Zone 7+).

**Accept =** owner opens page and sees no historical data above the fold.

---

## Step 9 — Zone 8: Diagnostics drawer
**Contract:** §21, §26
- Existing `DiagnosticsDrawer` stays as the only home for: Backfill geo, ingest health detail, PostHog rollup status, proxy diagnostics, linker health.
- Remove Backfill from anywhere it's still referenced in header/strip.
- Diagnostics entry point is a small "Diagnostics" link in the footer of the page, not a top-level control.

**Accept =** T10 passes — no `ingest`, `linker`, `rollup nominal`, `scope` visible in normal state.

---

## Step 10 — Responsive + empty/loading/error states
**Contract:** §7, §23
- Verify §7 breakpoints. Map never shrinks into decoration; at <1280 it stacks above the realtime card at full width, min-height 480px.
- Apply the §23 state matrix everywhere. Owner copy from §22.

**Accept =** T11 responsive screenshots at 1440 / 1280 / 1024 / 768 attached.

---

## Step 11 — Playwright acceptance suite
**Contract:** §28
- New `tests/e2e/admin-activity.spec.ts` with T01–T12 as separate `test()` blocks. Uses the existing incognito + Supabase session restore pattern from `journey-ingest.py` (ported to TS/Playwright).
- CI hook: block merge on any T01–T12 failure.

**Accept =** all 12 tests green against production preview.

---

## Step 12 — Definition of Done gate
**Contract:** §29, Appendix A
- Walk the Appendix A checklist. Any item failing = do not ship.
- Publish, then re-run acceptance suite against `repsuk.org`.

---

## Deviations I'm flagging up-front (need your call)

1. **Search in header (§8):** deferred to a follow-up phase — it needs its own server fn spanning professionals/members/journeys/IP hash/city. Accept deferral, or fold into Step 2?
2. **PostHog rollup ingestion (§3 "Historical analytics ← PostHog rollup into Supabase where useful"):** no rollup job exists yet. I propose we surface PostHog's own 24h numbers in Step 8 for now, with the rollup job as a separate Phase 3 workstream. Accept?
3. **Map cap 600px** vs contract's 560–680px range: I want to lock a single value so hero card height alignment is deterministic. Accept 600px, or prefer 640?

---

## Technical notes (internal)

- All new server fns live in `src/lib/activity/`, follow the `.functions.ts` + `.server.ts` split, are admin-gated with `requireSupabaseAuth` + `has_role('admin')`.
- `LiveCommandSummary` is the ONLY source of live counts. Any component computing its own live count is a bug and fails T01.
- `formatLocationLabel` replaces every ad-hoc `city, country` string in `src/components/admin/activity/**`. A codemod-style search-replace pass is part of Step 1.
- No changes to `visitor_journeys`, `security_visitor_ip_observations`, `public_visitor_conversions` schemas — the contract fits current shape.
- No new migrations required until Step 11 (test fixtures) and only if we choose to seed instead of live-generate.

---

## What I'm NOT doing (out of scope)

- No changes to Member 360 pages, admin member list, or any non-`/admin/activity` route.
- No PostHog dashboard changes.
- No new tables or auth changes.
- No visual redesign of the admin shell / sidebar.
