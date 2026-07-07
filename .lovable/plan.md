## Goal

Add a small, trust-focused review stat to the training-provider directory card without changing the card's shape or layout weight.

## What changes

### 1. Extend the server function

`src/lib/directory/providers.functions.ts`

- Add `rating_avg: number | null` and `review_count: number` to `ProviderCard`.
- After the profile/website fetches, run one extra parallel query:
  ```
  supabaseAdmin.from("reviews")
    .select("professional_id, rating, status")
    .in("professional_id", ids)
    .eq("status", "published")
  ```
- Aggregate in-memory into `{ count, sum }` per provider (same pattern used by `featured.functions.ts` line 202–208).
- Populate `rating_avg = sum / count` (or `null` when count = 0) and `review_count` on each row.

### 2. Render on the card

`src/routes/find-a-training-provider.tsx` → `ProviderCardTile`

Add one inline chip to the existing meta row (same row as city + delivery — the card grows by zero pixels):

- **Has reviews:** `★ 4.8 · 24 reviews` — star in REPS orange (`#FF7A00`), rating in bold black, count in muted black/60.
- **No reviews:** `★ New` — muted star + muted "New" label. Chosen deliberately over hiding, because on a trust page a missing signal is itself information.

Placement (left → right on the meta row): `★ rating · N` · `📍 City` · `👥 Delivery`. If the row wraps on narrow columns, the review stat wraps first — it's the newest, least-critical piece.

### 3. No layout changes

- Card radius, hero aspect, logo chip, body padding, min-height — all unchanged.
- No new sections. Just one extra `<span>` on the existing meta flex row.
- Skeleton height unchanged.

## Technical notes

- Reviews query joins the batch of provider IDs we already have — one extra round-trip, ~10ms.
- `rating_avg` formatted with `.toFixed(1)` so it always reads `4.0`, never `4`.
- Star icon: `Star` from `lucide-react` (already common in the codebase); filled orange for real ratings, hollow muted for "New".

## Out of scope

- The `/t/$slug` page (already has its own review section).
- Coach cards.
- Any change to review-collection flow.

## Acceptance

- Forge and Northline tiles show `★ New` (accurate — zero published reviews).
- If we later publish reviews for either provider, the tile automatically shows `★ 4.8 · 24 reviews` (or whatever the aggregate is) with no code change.
- Card visual weight and layout unchanged in the default (populated) state.