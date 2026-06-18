### Problem
On `/in/$location` and `/professions/$profession`, the search-results cards show the pro's primary-location **town** (e.g. "Shoreditch") via `r.location?.town ?? r.city`, but the **Featured rail** only shows `r.city`. Same pro can appear in both rails with different locations.

### Fix
Add primary-location town to the Featured server response, then prefer it on the client.

1. **`src/lib/directory/featured.functions.ts`**
   - Extend `FeaturedProRow` with `town: string | null`.
   - Inside `fetchFeaturedPool`, after the existing `Promise.all` for profiles/subs/reviews, fetch primary locations:
     ```ts
     supabaseAdmin
       .from("professional_locations")
       .select("professional_id, town")
       .in("professional_id", ids)
       .eq("is_primary", true)
     ```
   - Build `townById = new Map<string, string | null>()` and set `town: townById.get(p.id) ?? null` on each enriched row.
   - No change to ordering, backfill, or shuffle logic.

2. **`src/routes/in.$location.tsx`** — in `featuredRowToFeaturedPro`, change:
   ```ts
   city: r.city ?? "",
   ```
   to:
   ```ts
   city: r.town ?? r.city ?? "",
   ```

3. **`src/routes/professions.$profession.tsx`** — same one-line swap in its `featuredRowToFeaturedPro` (or wherever it maps `FeaturedProRow → FeaturedPro`).

### Out of scope
- No UI changes to `FeaturedProCard`.
- No change to `getDirectoryHealth` admin rotation (still shows `city`; admin uses canonical city on purpose).
- No change to home-rail consumers — they'll just start preferring town automatically once they swap (separate request if wanted).

### Verification
Reload `/in/london` — the same pro should now show the same neighbourhood (e.g. "Shoreditch") in both the Featured rail and the results grid below.
