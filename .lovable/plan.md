## Goal

Stop overloading one field with two jobs. Introduce a structured **Profession** (primary + up to 2 secondary) drawn from the canonical list, and rename the freeform one-liner to **Tagline**. Directory cards lead with Profession.

## Data model

New columns on `professionals`:
- `primary_profession TEXT` — slug from canonical list (`personal-trainer`, `nutritionist`, `strength-coach`, `online-coach`, `pilates-instructor`, `yoga-teacher`)
- `secondary_professions TEXT[] DEFAULT '{}'` — max 2, validated by trigger, must not include the primary
- Keep `headline` column (renamed in UI to "Tagline") — no DB rename, just relabel; avoids breaking migrations elsewhere.

Validation trigger: enforce `array_length(secondary_professions, 1) <= 2`, all values in the allowed enum-style list, no duplicates with primary.

Shared canonical list extracted to `src/lib/professions.ts` (single source of truth, currently inlined in `professions.$profession.tsx`). That route imports from the new module.

## Dashboard (`dashboard_.profile.tsx`)

Replace the current "Professional title" field with two fields:
1. **Profession** (required) — shadcn `Select` for primary, plus a "Add secondary profession" control (up to 2) using shadcn `Select` + `Badge` removable chips.
2. **Tagline** (optional, ≤160 chars) — relabel existing `headline` input; helper text: *"One line that appears under your name on the directory card."*

Server fn `updateMyDashboardProfile`:
- Add `primary_profession` (required), `secondary_professions` (array, ≤2) to Zod schema.
- Keep `headline` as-is.

`getMyDashboardProfile` returns the two new fields.

## Publish gating

`setPublished({ is_published: true })` server fn rejects publish when `primary_profession` is null. UI: disable the Publish toggle with tooltip *"Set your profession to publish"* until set.

## Directory card (`find-a-professional.tsx` + `FeaturedProCard`)

Under the pro's name, show **Profession** (resolved label from slug) as the primary line. Tagline drops off the card (still shown on profile page). Secondary professions render as small chips below the tag row when present.

`listPublishedProfessionals` returns `primary_profession` + `secondary_professions`; `getPublicProfileBySlug` returns both for the profile page.

## Profile page (`pro.$slug.index.tsx`)

Hero: Profession label as eyebrow/sub-name (replaces current `headline` slot), Tagline beneath if present. Secondary professions as Badge chips. Schema.org `jobTitle` = primary profession label.

## Backfill

For existing rows where `primary_profession IS NULL`: leave null. They become unpublished automatically on next save. No guessing from `headline` — too unreliable, and the seed pros are few enough to set manually.

## Out of scope

- Profession-based filtering on `/find-a-professional` (separate task — easy follow-up once data exists).
- Wiring `primary_profession` into `/professions/$profession` listing queries (follow-up).
- Onboarding signup-flow change (you chose "Required before Publish", not "Required at signup").

## Technical notes

- Canonical list lives in `src/lib/professions.ts` exporting `PROFESSIONS: { slug, label }[]` and `getProfessionLabel(slug)`.
- DB validation via `BEFORE INSERT OR UPDATE` trigger (not CHECK — array length checks are fine in CHECK but a trigger keeps allowed-slug enforcement co-located).
- No new table needed; the array column is sufficient for 0–2 secondaries.
- `dashboard-profile.functions.ts` schema additions; no breaking changes to existing callers.

## Files touched

- new `src/lib/professions.ts`
- new migration: columns + trigger + grants already in place (existing table)
- `src/lib/profile/dashboard-profile.functions.ts` (read + update + Zod)
- `src/lib/profile/profile.functions.ts` (`setPublished` gate)
- `src/lib/profile/public-profile.functions.ts` (return new fields)
- `src/routes/_authenticated/_professional/dashboard_.profile.tsx`
- `src/routes/find-a-professional.tsx`
- `src/components/public/FeaturedProCard.tsx` (if used for live cards — currently mock)
- `src/routes/pro.$slug.index.tsx`
- `src/routes/professions.$profession.tsx` (import shared list)
- `src/integrations/supabase/types.ts` (regenerates after migration)

## Brutal-truth recap

This is the right move and overdue. Without structured profession the directory cannot filter, the profession landing pages can't list real pros, and SEO schema is weak. Doing it now — before services, AI credits, nutrition — is correct sequencing.