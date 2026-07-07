## Goal
Redesign the "What Learners Say" summary on `/t/$slug` into a Trustpilot-style rating breakdown: big score, star row, review count, and a 5-row histogram (5★ → 1★) with progress bars and percentages.

## Scope
Purely presentational — no schema changes, no server-fn changes. `listPublicReviewsBySlug` already returns the full published `reviews[]` with `rating`, so the distribution is computed client-side.

## Changes

**File: `src/routes/t.$slug.index.tsx`** — replace the summary block inside the `#reviews` article (currently lines ~550-583).

New layout on the left column of the summary grid:

```text
 4.8            ← 40px display bold
 ★ ★ ★ ★ ★    ← 5 stars, filled to Math.round(avg)
 Based on 24 reviews · REPS Verified

 5 ★  ████████████████████░  82%   (20)
 4 ★  ███░░░░░░░░░░░░░░░░░  12%    (3)
 3 ★  █░░░░░░░░░░░░░░░░░░░   4%    (1)
 2 ★  ░░░░░░░░░░░░░░░░░░░░   0%    (0)
 1 ★  ░░░░░░░░░░░░░░░░░░░░   4%    (1)
```

Details:
- Grid changes from `md:grid-cols-[180px_1fr]` to `md:grid-cols-[240px_1fr]` so the histogram sits on the left and the featured review excerpt stays on the right (unchanged).
- Compute `dist = [5,4,3,2,1].map(s => ({ stars: s, count: reviews.filter(r => r.rating === s).length }))` once with `React.useMemo`.
- Percentage = `count === 0 ? 0 : Math.round((c / ratingCount) * 100)`.
- Bar row: `<div class="h-2 rounded-full bg-black/8"><div class="h-full rounded-full bg-[#FF7A00]" style={{width: pct+'%'}} /></div>`, brand orange fill, muted track.
- Row layout: `grid grid-cols-[42px_1fr_44px]` → label (`5 ★`) · bar · pct (right-aligned).
- Keep the empty state (`No reviews yet`) unchanged.
- Keep the existing single featured review excerpt on the right — this change only replaces the summary column.

## Out of scope
- No changes to `reviews.functions.ts` — distribution is derived from already-returned rows.
- No changes to the provider directory card (bottom-right star chip already in place).
- No "See all reviews" list page — the existing "See all N reviews" button stays as-is.
