## What this changes

Homepage hero only — no visual redesign, no other sections touched. The locked homepage layout stays exactly as it is; we're swapping dummy form/chips/avatars for live behaviour.

## 1. Search inputs wired

Convert the hero form into a tiny controlled component (`HomeHeroSearch`) inside `src/routes/index.tsx`:

- Two inputs (query + location) backed by `useState`.
- Submit (button or Enter) calls `navigate({ to: "/find-a-professional", search: { q, city, page: 1, sort: "recommended" } })` — `q` and `city` are already valid search params on that route (`validateSearch` accepts both). Empty strings are dropped.
- "Find your coach" button stays exactly as it looks today.
- No autocomplete in this pass — just the navigation. Autocomplete is a separate, bigger job.

## 2. Goal chips wired

The six chips already on the page map cleanly to existing specialism slugs in `src/lib/specialisms.ts`:

| Chip label (on-screen)   | Specialism slug          |
| ------------------------ | ------------------------ |
| Fat loss                 | `fat-loss`               |
| Strength                 | `strength`               |
| Mobility                 | `mobility`               |
| Pre/post-natal           | `pre-post-natal`         |
| Rehab                    | `rehab-injury`           |
| Sport-specific           | `sports-performance`     |

Each chip becomes a `<Link to="/find-a-professional" search={{ specialism: slug, page: 1, sort: "recommended" }}>` — keeps the existing pill styling untouched, just makes them navigable. (Behavioural change only; the design memory permits this — no markup restructure.)

## 3. Avatar rotation from real professionals

New server function `getHomepageHeroAvatars` in `src/lib/directory/hero.functions.ts`:

- Public (no auth), uses `supabaseAdmin` (loaded inside the handler).
- Selects from `professionals` joined to `profiles` where: `is_published = true` AND `identity_status = 'approved'` AND `bd_seed_thin = false` AND `avatar_url IS NOT NULL`.
- Orders by `quality_score DESC NULLS LAST`, limit 12.
- Returns `{ id, slug, full_name, avatar_url, city }[]`.

Homepage `loader` calls `context.queryClient.ensureQueryData(heroAvatarsQueryOptions)`; the hero renders the first 4 with a slow cross-fade rotation through the rest every 4s (CSS opacity transition, no library). Falls back to the existing four static imports (James/Sophie/Daniel/Laura) if the query returns fewer than 4 rows or errors during SSR.

Avatars served from the public `avatars` bucket render directly via their public URL; legacy `/demo-avatars/*` paths already work as static files.

## Files touched

- `src/routes/index.tsx` — extract hero block into `HomeHeroSearch` + `HomeHeroAvatars`; add loader call. No layout changes.
- `src/lib/directory/hero.functions.ts` — new file (server fn + queryOptions).

Nothing else changes. No DB migration, no styling tokens, no copy edits, no new routes.

## Brutal-honest truth

You asked for one — here it is, in order of severity:

1. **"Real avatars" is currently a polite fiction.** The directory has 8 demo seed pros (`james.wilson@demo.repsuk.org`, etc.) with stock photos, plus exactly **one** genuine real member with an uploaded avatar (Katie Gibbs). Every BD-migrated row is `bd_seed_thin = true` with no avatar. So "rotate real professionals" will, today, rotate **demo seed photos plus Katie**. That's still better than four hard-coded JPEGs, and the moment any real member uploads an avatar they'll appear automatically. But don't tell yourself we're showing real users yet — we're showing a placeholder pool that drains and refills as real onboarding happens.

2. **The "25,000+ verified professionals" / "50,000+ reviews" copy directly above the avatars is unverifiable today.** With 9 photo-bearing rows in the DB, a journalist or a competitor screenshotting this page pre-launch is a real reputational risk. That's not in scope for this ticket, but flag for you: at minimum we should soften to "Built on the BD register of 25,000+ members migrating to REPs" before launch.

3. **The location input is dumb.** It just shoves whatever the user types into `?city=`. Type "Lndon" and you get zero results. The proper fix is Google Places autocomplete (we already have `GOOGLE_MAPS_BROWSER_KEY` wired) feeding the canonical city + lat/lng. I'd recommend doing that as the very next ticket — it's the single biggest source of "I searched and saw nothing" bounces a homepage hero will produce.

4. **The query input is also dumb.** It free-text-searches by `q`, but `/find-a-professional`'s server fn treats `q` as a name/headline ILIKE match. So typing "yoga" returns trainers whose bio happens to contain "yoga", not yoga teachers. Profession routing ("yoga" → `profession=yoga-teacher`) needs a small slug-detection step. I can add that in this same ticket if you want, but it's worth being explicit — without it the query box is mostly for typing a coach's name.

5. **No analytics on submit.** We won't know which chip / which query / which city converts. Tiny add — a `console.log` or a `track("hero_search", {...})` stub — but worth deciding now whether you want it.

## Recommended order

Ship this ticket as scoped (1 + 2 + 3). Then immediately do "hero location autocomplete via Google Places" + "query string profession detection" as the very next pass. Don't push the homepage live with a dumb location box.

## Questions for you before I build

- **Avatar pool**: ship rotation now with the demo-pro pool (and accept it'll be mostly demos until real members onboard), or wait until you've imported BD avatars?
- **Smart query**: include the slug-detection (yoga → yoga-teacher etc.) in this ticket, or split it out?
- **Chip count**: the homepage shows 6 chips. The actual specialisms list has 16. Keep the curated 6, or rotate them?
