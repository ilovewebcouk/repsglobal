# Plan — directory + homepage, world-class pass

Folds the four asks, the previous 10/10 review, **and** the "Trains at" gym pills back into one plan. Profile-page wiring stays deferred.

## Part 1 — Quick fixes (the four asks)

### 1.1 Fix the "white nav" on the results page
`/find-a-professional` currently renders `<PublicHeader variant="transparent" />` — transparent is designed for the dark home hero, so on the ivory results page the white links wash out. Switch to `<PublicHeader variant="solid" />` so the dark `bg-reps-ink/95` bar sits properly above the sticky search bar.

### 1.2 Remove the location dropdown from the header
The hero and results bar now both have a proper Where field (Places autocomplete + geolocate + postcode), so the header pin is redundant chrome.
- Delete `<LocationPin city={…} onChange={…} />` from row 1 of `PublicHeader.tsx` (~line 201) and from the mobile sheet (~line 332).
- Remove the `LocationPin` component definition, `useLocationPin` hook, and `LOCATION_KEY` constant if no other consumer remains.
- Leave existing `localStorage` data on devices — becomes dead, no migration needed.

### 1.3 Results page default sort = "Nearest"
- `validateSearch` default for `sort` → `"nearest"`.
- `HeroSearch.handleSubmit` → set `sort: "nearest"` as the initial value; when no origin is known the server fn already falls back to recommended-style ordering, so the URL just looks consistent.
- Sort dropdown gains the full set: **Nearest · Best match · Most reviewed · Highest rated · Newest · Price (low→high)**.

### 1.4 Wire up the homepage specialism tiles
Each `<button>` in the Specialism grid becomes a typed `<Link>` to `/find-a-professional`:

| Label | Search params |
| --- | --- |
| Personal Trainer | `profession=personal-trainer` |
| Pilates | `profession=pilates-instructor` |
| Nutritionist | `profession=nutritionist` |
| Strength Coach | `profession=strength-coach` |
| Pre & Postnatal | `specialism=pre-post-natal` |
| Rehab Specialist | `specialism=rehab-injury` |
| Sports Coach | `specialism=sports-performance` |
| Online Coaching | `mode=online` |

All carry `page=1, sort="nearest"`. No visual change beyond hover/focus already present.

---

## Part 2 — Results page to a real 10/10

### Phase A — Density, price, ratings, unified CTA, "Trains at" pills

**ResultCard rewrite** (~120px photo, tighter padding, single-line bio, gym pills restored):

```text
┌──────────────────────────────────────────────────────────────┐
│ [photo]  Katie Gibbs  ✓ Verified                       ♡    │
│  120px   Personal Trainer · Lowestoft · 0.3 mi away          │
│          ★ 4.9 (37)   ·   From £45/session                   │
│          "Strength + functional fitness for over-50s…"       │
│          [In-person] [Online] [Over-50s] [Rehab]             │
│          Trains at  [Virgin Active · Barbican]               │
│                     [PureGym · Old Street] [+2]              │
│                                           [ View profile → ] │
└──────────────────────────────────────────────────────────────┘
```

Concrete changes:
- Photo: fixed `w-[120px] h-[120px]` (mobile `w-[88px] h-[88px]`), `rounded-[16px]`.
- Bio: `line-clamp-1`; `lg:` may expand to `line-clamp-2`.
- Vertical padding `p-4 lg:p-5`; density target 4–6 results on 1160px viewport.
- **Price row** — server returns `from_price_pennies` (lowest service price). `From £{n}/session`; row hidden if no priced service.
- **Rating row** — `★ {avg.toFixed(1)} ({count})` when `review_count > 0`; otherwise a single subtle emerald pill `New on REPs` (status-only, within allowed token).
- **Unified CTA** — every card gets one primary `View profile →`. Pro+Studio tier with instant-book enabled gets a small emerald `Instant book` chip beside the name, not a second button.
- **Distance hierarchy** — distance string becomes `font-semibold text-reps-charcoal`. First card when `sort=nearest` gets a small `Closest to you` ribbon top-left of the photo.
- **"Trains at" row (restored)** —
  - New row directly under the specialism chips, labelled `Trains at` in `text-[12px] uppercase tracking-wider text-reps-muted-light`.
  - Render up to 2 gym pills inline, each shown as `{Gym name} · {Branch}` (e.g. `Virgin Active · Barbican`) in a `rounded-full border border-reps-stone bg-reps-warm-white px-2.5 py-1 text-[12px]` pill (no shadow, matches existing pill chrome on the profile page so the directory and profile read as the same component family).
  - If the pro has > 2 gyms, show a third `+{N}` pill that links to the profile.
  - Online-only pros (no gyms) hide the row entirely — never show an empty "Trains at" label.
  - Source: each pro already has `professional_gyms` (the same join used on the locked profile's "Trains at" card). The directory server fn currently drops this — Phase A widens the select to include it (`gym_name`, `branch`, ordered by `display_order` ASC, limit 3).
  - Independent disclaimer (`Independent — not affiliated with the gyms shown`) is **not** repeated on the card; it stays on the profile page only, to keep the card visually quiet.

**Sort dropdown options** — as listed in 1.3. Default `nearest`.

**Skeletons** — 6 `ResultCardSkeleton` rows during `isPending`. No bare spinner.

**Mobile chip row** — wrap the active-filter chip row in a horizontally-scrolling `overflow-x-auto snap-x` container below `sm:`, so it never line-wraps ugly on <400px.

**Empty top gap** — reduce spacing between the sticky bar and the first card from ~80px to ~24px.

### Phase B — Map view (split-screen, the real 10/10)

- `MapToggle` in the results header: `[ ☰ List ] [ 🗺 Map ]`.
- URL state: `view=list|map|split` (default `list` on mobile, `split` on `lg:`).
- Split layout on `lg:` — list `w-[560px]` left, map flex-1 right. Virtualised with `@tanstack/react-virtual` once results > 50.
- Map uses the existing Google Maps Platform connector and `VITE_LOVABLE_CONNECTOR_GOOGLE_MAPS_BROWSER_KEY`. Custom orange marker for the hovered card; hover sync both directions (card ↔ pin). No `mapId`, no `AdvancedMarkerElement`.
- Bounds: fit to all visible results; respect `radius_mi` when set.
- Mobile: map opens as a full-screen bottom Sheet; no split.

### Phase C — Saved searches + compare drawer

Deferred. Logged so it doesn't get lost:
- Save current `?…` URL to a `saved_searches` table per user; chip strip on results.
- Per-card compare checkbox; sticky bottom drawer with 2–3 pros side-by-side.

---

## Backend touches required (Phase A only)

- `getDirectoryResults` server fn — widen the select to include:
  - `from_price_pennies`, `review_count`, `rating_avg`, `tier`, `instant_book_enabled` (already exist as columns / aggregates).
  - `professional_gyms` (gym_name, branch, display_order, limit 3) joined per pro.
- Sort branches added on the server: `best_match` (existing recommended), `most_reviewed` (`review_count desc`), `highest_rated` (`rating_avg desc nulls last`), `newest` (`created_at desc`), `price_low` (`from_price_pennies asc nulls last`).
- No schema migration — every field already exists for the locked profile page.

## Out of scope (deferred, acknowledged)

- Wiring `/pro/$slug` to live data.
- Phase C above.
- Any change to locked profile / homepage / city / enquire pages beyond what's listed here.

## Suggested ship order

1. **Part 1 + Phase A** in one PR — biggest quality jump per hour, lands every user-visible ask incl. gym pills.
2. **Phase B** (map) in a follow-up PR.
3. **Phase C** later, after real usage data.

## Verification

- `/find-a-professional`: dark solid nav, no header location pin, URL defaults to `sort=nearest`, 4–6 cards on 1160px viewport, each card shows price (or omits cleanly), rating or `New on REPs`, unified CTA, closest-result ribbon, **Trains at gym pills (max 2 + overflow)** on every in-person pro and hidden on online-only pros. Sort dropdown shows full option set. Mobile chip row scrolls horizontally without wrapping.
- `/`: no header location pin, every specialism tile keyboard-focusable and routes to the correct filtered results.
- Phase B only: `?view=map` and `?view=split` render the Google map; hovering a card highlights its pin and vice versa; mobile opens map as a bottom Sheet.
