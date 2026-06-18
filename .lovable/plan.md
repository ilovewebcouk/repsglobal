## Plan — Featured rail QA (city + profession pages)

You're right on both counts: no fallback chips, no monograms. If a pro can't earn the slot with a real headshot and a real profile, they don't appear. Period.

Scope: the "Featured" rail on `/in/$location` and `/professions/$profession`. Both routes feed `FeaturedProCard` (`src/components/public/FeaturedProCard.tsx`). The homepage rail is **out of scope** (you said leave it).

---

### 1. Eligibility — only the best get in

A pro qualifies for the featured rail only if **all** of these are true. This is the new rule for `fetchFeaturedPool` in `src/lib/directory/featured.functions.ts`:

| Requirement | Why |
| --- | --- |
| `is_published = true` | already enforced |
| `avatar_url` is non-null | no monograms, no stock photos, no exceptions |
| `identity_status = 'approved'` | the green Verified pill must be earned |
| `quality_score >= 60` (configurable in `featured.config.ts`) | filters out thin / migrated stubs |
| `headline` non-empty AND `specialisms.length >= 1` | the card has real content to render |
| Has a primary `professional_locations` row (city/profession scopes only) | so the location chip is truthful |

Paid pros (Verified / Pro / Studio) still rank first via tier weight. Backfill is the same pool with the same gates — just non-paid pros. If a scope can't fill 4 cards after these gates, **render fewer cards** (or hide the rail entirely below a minimum of 3). No padding the rail with low-quality profiles.

### 2. Kill the bad fallbacks

- `src/routes/in.$location.tsx` and `src/routes/professions.$profession.tsx`: remove the `proJames / proSophie / proDaniel / proLaura` fallback array entirely. `image` must come from `avatar_url` and only `avatar_url`. (Eligibility above guarantees it exists, so no null path is needed.)
- `FeaturedProCard`: remove any monogram path. The card type stays `image: string` (required). If we ever pass null we want a TypeScript error, not a silent UX regression.

### 3. Card honesty (no invented copy)

- **Rating row**: when `reviews === 0`, **hide the entire star/rating block**. No "5.0 (0)", no "New on REPs" chip, nothing. The card loses one visual element; that's fine.
- **Role line**: if `primary_profession` is null we never get here (eligibility requires headline + specialisms, and most pros have a profession), but as a belt-and-braces, fall back to the first specialism rather than the dead word "Professional".
- **Verified pill**: stays — it's earned by the `identity_status='approved'` gate.

### 4. "See all" already shipped

`/find-a-professional?city={loc}&featured=true` and `?profession={slug}&featured=true` are wired. No change.

### 5. Admin visibility (small)

Add two read-outs to the existing `/admin/directory` Featured panel:
- "Eligible globally: N pros" (the count that passes all gates).
- "Below threshold (would qualify with photo / verification / quality): N" — a queue for outreach.

No new UI page, just two numbers on the existing card.

---

### Files

- `src/lib/directory/featured.config.ts` — add `FEATURED_MIN_QUALITY = 60`, `FEATURED_MIN_CARDS = 3`.
- `src/lib/directory/featured.functions.ts` — tighten `fetchFeaturedPool` with the eligibility rules; surface eligible/below-threshold counts in `getDirectoryHealth`.
- `src/components/public/FeaturedProCard.tsx` — required `image: string`; conditional rating block; specialism fallback for role.
- `src/routes/in.$location.tsx` — drop `fallbackImgs`; if eligible pool < `FEATURED_MIN_CARDS`, hide the rail.
- `src/routes/professions.$profession.tsx` — same as above.
- `src/routes/admin_.directory.tsx` — show the two new counts.

### Out of scope

- Homepage Featured rail (locked, you said leave it).
- Card visual redesign — frame, radius, palette stay.
- Wiring the Save bookmark.
- Any schema / migration change.

### Verification

- Visit `/in/london` and `/in/leeds` — every card has a real headshot, no monogram, no stock face, rating row hidden where reviews=0.
- Visit `/professions/personal-trainer` — same.
- Run `bash knowledge://skill/reps-build-compliance/scripts/audit.sh` — must exit 0.
- Confirm a scope with <3 eligible pros renders no rail rather than a thin one.