# Show town, not council district

## Problem
`NR32 3FJ` currently resolves to **"East Suffolk"** (the council). It should resolve to **"Lowestoft"** (the town people actually know).

The postcode resolver in `src/lib/profile/location.functions.ts` is reading `admin_district` from postcodes.io and writing it into `town`. postcodes.io returns a richer set of fields — `post_town` is the right one.

## Change

Single file: `src/lib/profile/location.functions.ts`

1. Extend the Zod schema for the postcodes.io response to include `post_town`, `parish`, and `admin_ward` (all already returned, just not validated/used).
2. Replace the current `town` assignment with this fallback ladder:
   ```
   town = titleCase(post_town) ?? parish ?? admin_ward ?? admin_district
   ```
   `admin_district` stays as final fallback so we never write `null`.
3. Keep `region = admin_district` (already what we store) — it's still useful internally for regional grouping / `/in/$location` pages, just never shown on cards.
4. Add a small `titleCase()` helper — `post_town` arrives as ALL CAPS ("LOWESTOFT").

## What re-resolves
Existing rows keep their stored `town` until the pro re-saves their postcode. Two options:

- **A. Lazy** — only new saves get the fix. Zero risk, slow rollout.
- **B. Backfill** — one-shot migration that re-resolves every `professional_locations` row via postcodes.io bulk endpoint (`POST /postcodes`, up to 100 per call). Safe because we still have the full `postcode` stored.

Recommend **B**, since the seeded/demo data will otherwise show "East Suffolk" etc. on the live directory until each pro logs in.

## Out of scope
- Neighbourhood granularity for big cities ("Mayfair" instead of "London"). Possible follow-up using `parish`, but post_town is the correct default.
- International postcodes. Still UK-only.
- Any UI change — the card already renders `town`, we're just fixing what `town` contains.

## Open question
Backfill existing rows now (option B), or wait for pros to re-save (option A)?
