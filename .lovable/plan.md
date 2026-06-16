## Goal

Wire `/find-a-professional` to the live database with real pagination, sort, and total counts so every seeded pro is browsable. Today the page hardcodes a "1–8 of 126" pager and the search server fn returns up to 100 rows without a total.

## Current state (verified)

- `searchProfessionals` (`src/lib/directory/search.functions.ts`) returns rows via `.range(offset, offset + limit - 1)` but **does not** return `count`. No `page` param.
- Route reads `useQuery({ queryKey: ['directory','search', {city,profession,specialism,q}] })` — no `page` in the key, no offset passed.
- Results render: `visiblePros.slice(0,4)` → break → `slice(4)` → fake pager. The pager block (lines 669–695) is decorative HTML — `PagerNum` buttons have no `onClick`.
- `Pro` type still merges `liveAsPros` with 8 hardcoded `directoryPros` seed cards (James/Sophie/etc.) which clutter real results.
- Seed status: `bd_migration` has 0 rows, only 1 published professional in DB. **The /admin_/migration "Seed all remaining" button needs to be run before any of this is visible** — out of scope for this code change but called out so you actually see results.

## Plan

### 1. Add page to URL search

In `validateSearch`, add:
- `page: number` (1-indexed, fallback 1)
- `sort: "recommended" | "nearest" | "rating"` (fallback "recommended") — promote the local state into the URL so deep links and pagination preserve sort

Use `fallback()` from `@tanstack/zod-adapter` per project convention (other routes already use this pattern). Add `search.middlewares: [stripSearchParams({ page: 1, sort: 'recommended' })]` so the URL stays clean.

### 2. Extend `searchProfessionals` to return `{ rows, total }`

Same file, no breaking changes elsewhere — just adjust the return shape and bump the type:

- Add `page` to schema (1-indexed); compute `offset = (page-1) * limit`, default `limit = 24`.
- Build the same filter chain twice via a helper, once with `{ count: 'exact', head: true }` for the total, once for the page rows. (Or use `select(COLS, { count: 'exact' })` on the data query — single round-trip.)
- Return `{ rows: SearchProfessionalRow[], total: number, page, pageSize }`.
- Update the one consumer (this route) to read `.rows` / `.total`.

### 3. Wire the route to real pagination

- Query key becomes `['directory','search', { city, profession, specialism, q, page, sort }]`.
- Pass `page` and `pageSize: 24` to the server fn. Keep tier-sort in the fn for "recommended"; for "rating" / "nearest" continue to do the client-side decoration we already have (rating/nearest currently depend on local viewer-origin coords).
- **Drop the static `directoryPros` merge** — they were placeholders. Real seeded pros now fill the directory. Keep the array in the file commented out or behind a `FEATURE_SHOW_SEED_DEMO = false` const so we can revive for design QA.
- Replace the decorative pager with a real one driven by `total` + `page`:
  - "Showing X–Y of N"
  - Prev / Next buttons disabled at edges
  - Numbered buttons with ellipsis using a `compactPagerRange(page, totalPages)` helper (truncate to 1, …, p-1, p, p+1, …, last)
  - All buttons call `navigate({ search: prev => ({ ...prev, page: n }) })`
  - Scroll to top of results on page change (`useEffect` on `page`, scroll the `#results` anchor)
- Sort `<select>` writes to `?sort=` instead of `useState`.
- Filter changes (city / profession / specialism / q / venue) reset `page` to `1`.

### 4. Empty / loading / error states

- While `useQuery` is pending, render 6 skeleton `ProCard`s (use existing shadcn Skeleton).
- On error, render the existing `EmptyResults` with a "Try again" button that calls `refetch()`.
- When `total === 0`, keep `EmptyResults`.

### 5. Avatar fallback

Live rows with `avatar_url = null` currently fall back to `proJames` (a stock photo). Swap to a monogram avatar — use the existing `MonogramAvatar` component if present, otherwise render initials in a circle inside `ProCard`'s image slot. Verified during seeding spot-check.

## Out of scope

- The hero search inputs (still cosmetic — `q`/`city`/`profession` already filter via URL but the inputs aren't wired to write them). Flag for a follow-up; the current ask is pagination.
- Venue filter rework — still client-side off hardcoded `venues`, which seeded pros don't have. Will read as empty under venue filter, which is correct.
- New design — pager visuals match the existing `PagerBtn`/`PagerNum` styles.

## Deliverable

Loading `/find-a-professional` shows real seeded pros, 24 per page, with working Prev/Next/numbered pagination, sort preserved in URL, and totals reflecting the live DB. `/find-a-professional?page=5&sort=rating` is a valid deep link.
