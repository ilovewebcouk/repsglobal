## Goal

Split `/admin/members` into two segments — **Professionals** and **Training Providers** — with columns tailored to each. Retire the `training_provider` value from the tier filter (the segment tab replaces it).

## UX

Top-level segmented control above the existing status tabs (All / Verified / Unverified / Payment failed / Suspended). Segment persists via search param `segment=professionals|providers` (default `professionals`).

```text
┌ Members ────────────────────────────────────────────┐
│ [Professionals] [Training Providers]                │
│ ─────────────────────────────────────────────────── │
│ All  Verified  Unverified  Payment failed  Suspended│
│ ─────────────────────────────────────────────────── │
│ table (columns depend on segment)                   │
└─────────────────────────────────────────────────────┘
```

Status tabs stay on both segments (providers can also be unverified / suspended / payment_failed). KPI cards above are unchanged — they already count the whole register.

## Columns

### Professionals segment (unchanged)
Professional · Profession · Plan · Status · Lifetime value · Renewal date · Plan MRR · Joined

### Training Providers segment (new)
Provider · Location · Courses · Verified pros linked · Plan · Status · Renewal date · Joined

Rationale: providers don't have a single "profession"; they operate from a location, sell courses, and their business value on the platform is measured by the pros they've verified. LTV / MRR are still meaningful but demoted — surfaced in the row detail drawer, not the primary grid.

## Data / server

Extend `listAdminProfessionals` in `src/lib/admin/professionals.functions.ts`:

1. Add `segment: 'professionals' | 'providers'` to the input. Default `professionals`.
2. Base query filter:
   - `professionals`: `.neq('account_type', 'organisation')` (or `.is('account_type', null).or('account_type.eq.individual')`).
   - `providers`: `.eq('account_type', 'organisation')`.
3. When `segment === 'providers'`, additionally fetch:
   - `courses` count grouped by `provider_id` (or the equivalent FK — verified during implementation; if courses aren't linked yet, the column shows `—`).
   - Verified-pros-linked count. First implementation: if no explicit link table exists, show `—` and mark the column as "coming soon" via a tooltip. No new tables in this change.
4. Extend `AdminProRow` with optional provider fields: `location: string | null`, `coursesCount: number | null`, `verifiedProsLinked: number | null`. `profession` stays optional.

Row typing stays a single `AdminProRow`; the client picks which columns to render per segment. No new server fn.

## Client

`src/routes/admin_.members.tsx`:

1. Add `segment` to `validateSearch` (defaults `professionals`).
2. New `<SegmentTabs>` block above the existing status tabs — two-pill segmented control, swaps `?segment=` and resets `page` to 1.
3. Pass `segment` down to `listAdminProfessionals` via the existing query key (add to key so cache splits).
4. Column definitions become segment-conditional. Extract two small column arrays; render inside the existing `<table>` shell so filters / pagination / suspend / impersonate menus keep working.
5. Filter drawer changes when segment=providers: hide Profession filter (irrelevant); keep Status/Has-avatar; hide the "Training Provider" tier chip. **Retire** `training_provider` from `PLAN_OPTIONS` — its function is now the segment tab.
6. Row-avatar block reads "Provider" not "Professional" in the segment header column.

## Scope trims

- No new tables, no schema migration, no new KPIs. If courses / verified-pros-linked data isn't wired in the DB yet, those columns render `—` with a tooltip "Wired once course + pro-link tables land" — the split still ships this turn.
- Row action menu (suspend / impersonate / open profile) stays identical.
- Member 360 (`/admin/members/$userId`) unchanged.

## Acceptance

- `/admin/members` opens on the Professionals segment; table looks identical to today.
- Clicking **Training Providers** shows only `account_type='organisation'` rows (Northline, Forge) with Provider / Location / Courses / Verified pros / Plan / Status / Renewal / Joined columns.
- Status tabs still filter within the active segment.
- Tier filter dropdown no longer lists "Training Provider".
- URL reflects segment (`?segment=providers`), refresh preserves it.
