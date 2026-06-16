# Plan — Directory polish pass + Phase B (map)

Answers your five questions, then ships Phase B.

---

## Part 0 — The five things from your message

### 0.1 Sticky filter bar sits ~140px below header (looks disconnected)
Cause: `<PublicHeader variant="solid" />` is fixed-72px, then `find-a-professional.tsx` adds a **second** 72px spacer (`<div className="h-[72px]" />`) before `<ResultsSearchBar>`, which is itself `sticky top-[72px]`. So at scroll-top the bar sits at y≈144, not y≈72 — exactly the "big gap" in your screenshot.

Fix:
- Delete the 72px spacer. The header reserves its own 72px via the fixed-layout offset; the sticky bar should mount immediately under it so at scroll-top it visually butts up to the header (border-b becomes the seam).
- Drop the bar's own `py-3 lg:py-4` to `py-2.5 lg:py-3` so the row sits tighter under the dark nav.
- Add a 1px hairline shadow on scroll only (`shadow-[0_8px_24px_-12px_rgba(0,0,0,0.35)]` when `window.scrollY > 0`) so the bar separates from results without the current dead-ivory band.

Result: bar reads as "row 2 of the header", not a floating strip.

### 0.2 "New on REPs" — how long, and does it become reviews?
Today the pill shows whenever `review_count === 0`. That's fine but unbounded — a pro with zero reviews after 12 months should not still read "New".

Rule (Phase A.1 tweak):
- Show **New on REPs** only when `review_count === 0` **AND** `created_at` is within the last **60 days**.
- After 60 days with no reviews, hide the pill entirely (the rating row just doesn't render). No fake stars, no placeholder.
- The moment `review_count > 0`, the pill is replaced by the real `★ {avg} ({count})` row — automatic, no manual flip.
- Implementation: `created_at` already comes back from `searchProfessionals`; the check is a single `Date.now() - createdAt < 60d` on the card. No backend change.

### 0.3 "If origin is set, default to nearest" — make it bulletproof
Today `sort` defaults to `nearest` in the URL validator, but if the user lands with a stale URL (`?sort=best_match`) and an origin is present, we still honour the URL. That's wrong — origin-presence should win on first navigation.

Fix:
- In `HeroSearch.handleSubmit` and the homepage specialism `<Link>`s: always set `sort: "nearest"` when an origin (city / postcode / geo) is being submitted.
- In the results route: if URL has no explicit `sort` and `origin != null`, treat default as `nearest` (already true); additionally, when a user opens the location chip and **adds** an origin from inside results, `WhereChip.onCity` should call `patch({ city, sort: "nearest", page: 1 })`. Today it only patches `city`, so the sort stays on whatever it was.

### 0.4 Pagination shows 17 pages when only 2 results fit the 1-mile radius
Cause: `total` is the **server count** (399), which is computed before the **client-side** radius filter runs. Pagination uses `total`, so it offers 17 pages even though radius collapses the visible set to 2.

Fix (Phase A.2 — backend):
- Move radius filtering to the server. `searchProfessionals` already receives `origin` (we'll add `radius_mi` to the input schema) and joins `professional_locations` (lat/lng). Compute Haversine in-DB with a `RPC`, OR simpler: select all `professional_locations` for the matched id set, filter in the server function, and re-count.
- Cleanest: add an optional `radius_mi` + `origin_lat` + `origin_lng` to the input. When present:
  1. Run the filtered Supabase query (same filters as today).
  2. Fetch lat/lng for matched ids.
  3. Drop ids outside the radius.
  4. **Recompute `total` from the filtered id list**, then slice for the page.
- Result: `total` matches what the user sees. Pagination shows 1 page when 2 results, 17 pages only when 399 results are actually in scope.
- Side effect: removes the "Only N within X mi. Showing N more within 50 mi" rescue banner's need to widen client-side — we widen server-side instead and the banner just reads the server's "widened to 50 mi" flag.

### 0.5 "Is this 10/10?" — brutal honest
Right now: strong **8/10**. What's still missing to hit 10:
- **Map view** (Phase B below) — directories without a map feel 2015.
- **Price + rating on every card** — price is wired, rating only shows when reviewed; that's correct, but at zero coverage today every card reads "New on REPs", which is a tell. Phase A.1 60-day rule fixes that.
- **Origin-aware empty state** — when radius collapses to 0, show a single hero empty state ("No pros within 1 mi of Lowestoft — widen to 5 mi?") with one-tap radius buttons (1 / 5 / 10 / 25 / 50). Today we silently show 0 cards.
- **Saved searches + compare** — Phase C, still deferred.
- **Card scan-rhythm** — gym pill row currently labelled `TRAINS AT` in caps reads heavy; demote to lowercase `Trains at` and inline with the pills (one row, not a two-row block).

Parts 0.1–0.4 + the empty-state + the `Trains at` demotion are folded into **Phase A.1** below.

---

## Phase A.1 — Polish pass (the five fixes, ~1 PR)

1. Remove 72px spacer, tighten bar padding, add on-scroll shadow.
2. "New on REPs" gated by `created_at < 60d` AND `review_count === 0`.
3. `sort: "nearest"` enforced when origin is added (hero, homepage tiles, WhereChip in results).
4. Server-side radius filter → correct `total` → correct pagination.
5. Origin-aware empty state with 1/5/10/25/50 mi quick-widen buttons.
6. `Trains at` row: lowercase label, inline with pills, one row.

## Phase B — Map view (the real 10/10)

- `view=list|map|split` in URL (`validateSearch` + `fallback`).
- `MapToggle` in the results bar header (`[☰ List] [🗺 Map]`), `split` default on `lg:`, `list` on mobile.
- Split layout `lg:`: list `w-[560px]` left, map `flex-1` right. Virtualise list with `@tanstack/react-virtual` when `total > 50`.
- Google Maps via the existing browser key (`VITE_LOVABLE_CONNECTOR_GOOGLE_MAPS_BROWSER_KEY`). No `mapId`, no `AdvancedMarkerElement`. Custom orange `google.maps.Marker` for each result; pin scales + raises z-index on card hover and vice-versa.
- Bounds: fit to all visible markers; clamp to `radius_mi` circle when set (draw a soft orange `Circle` overlay).
- Mobile: map opens as a full-screen bottom `Sheet`, never split. "Show map" floating pill above the result list.
- Markers source `location.latitude/longitude` from the row shape we already return.

## Phase C — deferred (unchanged)

Saved searches, compare drawer. Not in this PR.

---

## Backend touches

- `searchProfessionals` input schema gains `radius_mi`, `origin_lat`, `origin_lng`.
- Handler: when radius present, fetch matched `professional_locations`, Haversine-filter, recompute `total`, then page.
- No schema migration.

## Out of scope

- Wiring `/pro/$slug` to live data.
- Phase C.
- Any locked profile / homepage / city / enquire visual changes.

## Ship order

1. **Phase A.1** — six-fix polish PR (lands every question above).
2. **Phase B** — map view, follow-up PR.
3. Phase C later.

## Verification

- Sticky bar sits flush under the dark header at scroll-top, gains a shadow on scroll.
- Pro created >60d ago with 0 reviews shows no rating row and no "New on REPs" pill.
- Submitting a city or postcode from the hero, homepage tiles, or WhereChip forces `sort=nearest`.
- `?radius_mi=1` in Lowestoft shows "1 page · 2 results", not 17 pages.
- 0 results in radius shows the radius-widen empty state.
- Phase B: `?view=split` renders the map; hovering a card highlights its pin; mobile opens the map Sheet.
