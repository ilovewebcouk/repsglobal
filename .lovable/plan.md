## Problem

`deriveTown()` in `src/lib/profile/location.functions.ts` picks the Travel-to-Work Area (TTWA) as the public town name. For anywhere inside the M25 that returns **"London"**, for Greater Manchester it returns **"Manchester"**, etc. — far too broad for a directory where a client searching by postcode expects to see trainers in *their* neighbourhood, not 8 million other people's.

For WC2H 0JG the underlying postcodes.io payload actually contains the granular name the user wants — `admin_ward = "Holborn and Covent Garden"` — we're just not using it.

## Approach

Use `admin_ward` (district/neighbourhood) as the primary display name **inside large metros**, and keep TTWA as the city qualifier. Everywhere else, keep today's behaviour (TTWA = town).

### Display rule

| Metro postcode? | Public display | Example |
|---|---|---|
| Yes (TTWA ∈ big-city list) | `{admin_ward}, {ttwa}` | "Holborn and Covent Garden, London" |
| No | `{ttwa}` (current) | "Lowestoft", "Brighton" |

Big-city TTWA list (initial): London, Manchester, Birmingham, Leeds, Liverpool, Glasgow, Edinburgh, Bristol, Sheffield, Newcastle, Cardiff, Nottingham.

### Storage

Add two columns to `professional_locations`:
- `district text` — the ward name (e.g. "Holborn and Covent Garden")
- `region text` — the wider metro name when applicable (e.g. "London"); otherwise null

`town` keeps its current meaning (TTWA) so nothing existing breaks. New writes populate `district` + `region`; old rows fall back to `town` until the trainer re-saves their postcode.

A one-off backfill server function (admin-only) can re-resolve every existing primary location via postcodes.io and fill `district`/`region` in place — no user action required.

### Code changes

1. `src/lib/profile/location.functions.ts`
   - Extend `PostcodesIoResult` with `admin_ward`.
   - New helper `deriveDisplay(r)` → `{ district, region, town }` using the rule above.
   - Update `saveMyPostcode`, `resolveViewerPostcode`, `getMyPrimaryLocation`, `setMyLocationFromCoords` to write/return the new fields.
   - Drop the `professionals.city = town` back-compat mirror in favour of `district ?? town`.

2. `src/components/profile/...` (public profile location chip) + dashboard location card
   - Render `district ? \`${district}, ${region}\` : town`.

3. City/directory pages already covered by the locked `/in/$location` design — no visual change there; this only affects the per-profile chip.

4. Search/filter: out of scope for this plan. (Future: ward-level search pages — flag if you want it included.)

### Migration

```sql
ALTER TABLE public.professional_locations
  ADD COLUMN IF NOT EXISTS district text,
  ADD COLUMN IF NOT EXISTS region   text;
```
No new GRANT/RLS needed — inherits existing policies.

## Questions before I build

1. Confirm the big-city TTWA list above, or do you want me to derive it differently (e.g. show ward whenever TTWA population > X)?
2. Should the backfill run automatically for every existing primary location now, or only when each trainer next edits their postcode?
3. Anything to change on the public chip wording — `"Holborn and Covent Garden, London"` vs `"Holborn and Covent Garden · London"` vs just `"Holborn and Covent Garden"` with London hidden?
