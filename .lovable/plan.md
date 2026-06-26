## Goal
Hide the 7 fake demo professionals from the default views in `/admin/professionals` and surface them under a new **Demos** tab so you can still inspect James Wilson's record for the `/c/james-wilson` mock-up.

## Demo records (confirmed in DB)
- `emily-carter` (pilates)
- `sophie-taylor` (pilates)
- `liam-roberts` (strength)
- `marcus-lee` (strength)
- `priya-sharma` (nutritionist)
- `hannah-thompson` (PT)
- `james-wilson` (PT — coach shop-front mock)

(`james-carter` is a route-level fixture, not in the DB — already gated.)

## Approach

### 1. Flag demos in the DB
Add a boolean `is_demo` column to `professionals` (default `false`, indexed). Backfill `true` for the 7 slugs above. Single source of truth — future demo accounts just flip the flag, no code change.

### 2. Filter them out of the admin list + KPIs
`src/lib/admin/professionals.functions.ts`:
- `listAdminProfessionals`: select `is_demo`; when `tab !== 'demos'`, append `.eq('is_demo', false)`; when `tab === 'demos'`, append `.eq('is_demo', true)`.
- KPI / count helpers in the same file (the confirmed-pro count RPCs and any `count_*` calls): exclude `is_demo = true` so headline numbers stop including demos.

### 3. Add the Demos tab to the UI
`src/routes/admin_.professionals.tsx`:
- Extend `AdminProTab` union with `'demos'`.
- Append `{ label: "Demos", value: "demos" }` to `TABS` (rightmost, after "Recently joined").
- No other UI changes — existing row actions (view, suspend, etc.) keep working for demo rows under that tab.

### 4. Keep public surfaces clean
Belt-and-braces — also filter `is_demo` out of:
- `src/lib/directory/search.functions.ts` (directory results)
- `src/lib/directory/featured.functions.ts` (featured grids, profession + city pages)

These should already be hidden via `is_published = false` on the 7 records, but the explicit flag prevents accidental publication from leaking them.

## Out of scope
- No change to `/c/james-wilson` mock-up route — still renders from the same DB record.
- No change to James Carter route fixture.
- No change to `bd_seed_thin` migrated pros (those are real, not demos).

## Technical notes
- Migration: `ALTER TABLE public.professionals ADD COLUMN is_demo boolean NOT NULL DEFAULT false;` + partial index `WHERE is_demo` + `UPDATE` for the 7 slugs. No RLS change needed (admin reads use service role; public reads already gate on `is_published`).
- Types regenerate after migration; admin functions ship in the same turn after that.
