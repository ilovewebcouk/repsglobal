## Context

On `/find-a-professional`, the `ProCard` (`src/routes/find-a-professional.tsx:804`) currently shows the rating row **only when `pro.reviews > 0`**:

```ts
const showRating = pro.reviews > 0;
// later, in the meta row:
{showRating && (<><Star/> {rating} ({reviews})</>)}
```

So pros with no reviews yet (like Katie Gibbs in your screenshot) get nothing in that slot — which is what you're seeing. What we agreed previously was a 2-state row:

- `review_count > 0` → real star + `4.9 (37)`
- `review_count === 0` AND joined within the last **60 days** → a small **"New on REPs"** pill in the same slot
- After 60 days with no reviews → render nothing (no fake stars)

That "New on REPs" fallback is what got dropped. The `created_at` field is already on the `Pro` shape and selected from the query (`find-a-professional.tsx:156, 294`), so no data work is needed.

## Change

One file: `src/routes/find-a-professional.tsx`, inside `ProCard`.

1. Compute a second flag alongside `showRating`:
   ```ts
   const SIXTY_DAYS_MS = 60 * 24 * 60 * 60 * 1000;
   const createdAt = pro.created_at ? Date.parse(pro.created_at) : 0;
   const isNew = !showRating && createdAt > 0 && Date.now() - createdAt < SIXTY_DAYS_MS;
   ```
2. Extend the rating slot in the meta row (around line 938):
   ```tsx
   {showRating ? (
     <span className="flex items-center gap-1.5">
       <Star className="h-3.5 w-3.5 fill-reps-orange text-reps-orange" />
       <span className="font-semibold text-reps-orange">{pro.rating.toFixed(1)}</span>
       <span>({pro.reviews})</span>
     </span>
   ) : isNew ? (
     <span className="inline-flex items-center gap-1 rounded-full border border-reps-orange/30 bg-reps-orange/10 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-reps-orange">
       <Sparkles className="h-3 w-3" />
       New on REPs
     </span>
   ) : null}
   ```
   (`Sparkles` is already imported in this file for the Featured badge.)

That's it — no schema, no query, no other component touched. Pros with reviews show the rating again; brand-new pros get the "New on REPs" pill in the same slot; long-tail no-review pros still render cleanly without a fake stars row.

Want me to ship it?