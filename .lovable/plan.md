# Home rail: "Newest coaches on REPS"

Replace the current `Featured REPS Professionals` rail on `/` with a **Newest coaches on REPS** rail. Same 4-up card grid layout, same slot in the page — different data, simpler card.

## Rail spec

- **Eyebrow:** `Just joined`
- **Heading:** `Newest coaches on REPS`
- **View all:** links to `/find-a-professional` (no featured filter).
- **Prev/Next arrows:** keep as decorative (unchanged — they don't wire to a carousel today).

## Card spec (new `NewestCoachCard`)

Based on `FeaturedProCard` but stripped:

- Square avatar image (top, `object-cover object-top`)
- **No REPS Verified pill** (they haven't verified yet)
- **No Save/Bookmark button**
- Name, role/profession
- Rating row: shown **only if** `review_count > 0` (new pros won't have any — hide the whole row cleanly)
- City + delivery mode row (In-person / Online / Hybrid) — unchanged
- Full-width `View profile` CTA → `/c/$slug` (opens in same tab; the old card used `target=_blank` for the featured "View website" flow — for newest coaches the intent is discovery, so same-tab profile link is right)

Reasoning for a new component vs. adding a `variant` to `FeaturedProCard`: `FeaturedProCard` is used on the locked profession and city pages and the pill/save button are part of that locked design. A separate component keeps the locked one untouched.

## Data source (new server fn)

New file `src/lib/directory/newest.functions.ts`:

```ts
getNewestCoaches({ limit: 4 })
```

Query criteria (via `supabaseAdmin`):

- `professionals.is_published = true`
- `professionals.is_demo = false`
- `professionals.account_type` in `('individual', null)` — excludes training providers (`organisation`)
- Joined `profiles.avatar_url` **is not null and non-empty** (the one strict requirement)
- Order by `professionals.created_at desc`
- Limit `20`, then drop any without an avatar after the join, take top `limit`

Returned row shape (subset — no tier/verification since we don't render them):

```ts
{ id, slug, full_name, avatar_url, primary_profession, city, in_person_available, online_available, rating_avg, review_count }
```

Uses `supabaseAdmin` inside the handler (server-only import) — pattern matches `getFeaturedPros`.

## Wiring in `src/routes/index.tsx`

- Replace the `useQuery` at line ~221 (`home-featured-rail` → `home-newest-coaches`) — new queryKey, new fn, `staleTime: 5 * 60_000`.
- Replace the `featuredCards` mapping (line ~228) with a plain map to the new card props.
- Section wrapper (lines ~332–390): same background/spacing, updated eyebrow + heading, keep the grid.
- If `newestCoaches.length === 0`, hide the section (mirrors current `hasFeatured` guard).
- Remove the now-unused `rowToHomeCard` helper if the old featured import isn't used elsewhere on this page — check and keep only what's needed.

## Files touched

- `src/lib/directory/newest.functions.ts` (new)
- `src/components/public/NewestCoachCard.tsx` (new)
- `src/routes/index.tsx` (edit: section heading, query, card render)

## Explicitly not doing

- No change to `FeaturedProCard`, `/professions/*`, `/in/*`, `/find-a-professional`, or the admin featured tooling.
- No `sort=newest` filter added to the directory (out of scope — say the word and it's a follow-up).
- No pagination / arrows wiring (arrows stay decorative as today).
- No change to `professionals` schema.

## Verify

- Load `/`: rail shows the 4 most recently created published coaches that have an avatar; no verified pill, no save icon; unverified newcomers appear here.
- Rail hides entirely when zero qualifying coaches exist.
- `bunx tsgo --noEmit` clean.
