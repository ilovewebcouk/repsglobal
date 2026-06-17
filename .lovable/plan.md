## Goal

"Years coaching" on `/c/$slug` = years since the date on the certificate that **unlocks their primary profession**. "Verified since" still uses `member_since`.

## Source

`verification_submissions` for the pro, filtered to:
- `status = 'approved'`, and
- `derived_title_slug = professionals.primary_title_slug` (the cert that unlocks the profession).

From those, take the earliest by `COALESCE(issue_date, make_date(year, 1, 1))` — `issue_date` is the date on the certificate, `year` is the fallback when only a year was captured.

```
coaching_since_year = year(earliest qualifying cert date)
years_coaching      = max(1, current_year - coaching_since_year)
```

If no approved cert matches `primary_title_slug` (or the pro has no `primary_title_slug` set), fall back to `base.years` so the locked Katie Gibbs mock keeps its hardcoded value.

## Changes

1. **`src/lib/shop-front/shop-front.functions.ts`**
   - Select `primary_title_slug` alongside the other professional columns.
   - Add a parallel query on `verification_submissions` filtered to `professional_id = pro.id`, `status = 'approved'`, `derived_title_slug = pro.primary_title_slug`, selecting `issue_date, year`, ordered ascending by `COALESCE(issue_date, make_date(year,1,1))`, limit 1.
   - Add `coaching_since_year: number | null` to `ShopFrontDTO` and populate from that row.

2. **`src/routes/c.$slug.tsx` — `mergeLiveIntoCoach`**
   - Replace the `member_since`-based `yearsCoaching` calc with `sf.coaching_since_year`-driven calc.
   - Keep `verifiedSince` derived from `member_since` (unchanged).
   - Fall back to `base.years` when no qualifying approved cert exists.

## Out of scope

- Editing the mock Katie Gibbs values.
- Changing the "Verified since" tile or label.
- Exposing this elsewhere (admin, listing card, /pro/$slug).
