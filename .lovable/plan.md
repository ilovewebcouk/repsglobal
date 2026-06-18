# Live verified-pro count per profession page

Currently the "Verified pros" number in the at-a-glance card on `/professions/$profession` is a hardcoded `count` per profession in `PROFESSIONS` (e.g. `1284`, `412`, `326`, …). Wire it to the real count from the database so every page shows its own live number.

## What

- On `/professions/personal-trainer`, `/pilates-instructor`, `/nutritionist`, `/strength-coach`, `/online-coach`, `/yoga-teacher`, `/group-exercise-instructor`, the "Verified pros" row in the right-hand "At a glance" card reads the live count of verified professionals for that profession instead of a static number.
- "Verified" matches the existing directory rule: `professionals.verification = 'verified'` AND `identity_status = 'approved'`, filtered by `primary_profession = <slug>`.
- If the live count is `0` (early days), fall back to a dash `—` rather than rendering "0" — avoids a thin-looking page.

## How (technical)

1. **New server fn** `getVerifiedProCount` in `src/lib/directory/search.functions.ts` (or a new `src/lib/directory/counts.functions.ts`):
   - Public (no auth middleware), uses the server publishable Supabase client (same pattern as other public reads).
   - Input: `{ profession: string }` validated against `PROFESSION_SLUGS`.
   - Query: `supabase.from('professionals').select('id', { count: 'exact', head: true }).eq('primary_profession', data.profession).eq('verification', 'verified').eq('identity_status', 'approved')`.
   - Returns `{ count: number }`.

2. **Loader wiring** in `src/routes/professions.$profession.tsx`:
   - Add a `queryOptions` for `['profession-verified-count', slug]` calling the new server fn with a 5-minute `staleTime`.
   - In the route `loader`, `ensureQueryData` it alongside any existing loader work.
   - In the component, read with `useSuspenseQuery` (or `useQuery` if the route currently has no loader) and render `count.toLocaleString()` in the `<dd>` at line 477, with a `—` fallback when `count === 0`.

3. **Cleanup**: remove the hardcoded `count` field from each entry in the `PROFESSIONS` constant and from the `ProfessionMeta` type — it is no longer the source of truth.

## Out of scope

- The "Avg. rating" (`4.9 / 5`) and "Typical rate" stay static for now — user only asked about the number they selected.
- No change to the city pages, homepage stats, or any other count surfaces.
