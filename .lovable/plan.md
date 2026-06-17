## Goal

1. Remove "New on REPs" pill from listing cards entirely.
2. On `/c/$slug` (coach shop-front), drive "Verified since" and "Years coaching" from the member's signup date — BD members use their BD signup date, new sign-ups use their REPs sign-up date.

Reviews-when-zero is a separate task, saved for later.

## Source of truth: `member_since`

One derived date per professional:

```
member_since = COALESCE(bd_member_seed.legacy_signup_at, professionals.created_at)
```

- Add `professionals.member_since timestamptz`.
- Backfill from `bd_member_seed.legacy_signup_at` where linked; otherwise `created_at`.
- Insert trigger defaults to `created_at` when null so brand-new sign-ups get today.
- Expose `member_since` on the `/c/$slug` loader payload.

Derived for the page:
- `verified_since_year = year(member_since)`
- `years_coaching = max(1, current_year - verified_since_year)`

## Changes

1. **Migration** — add `professionals.member_since`, backfill, insert trigger.

2. **Listing card — `src/routes/find-a-professional.tsx` (lines 817–934)**
   - Delete the `NEW_PILL_WINDOW_MS` / `isNewPro` constant and the entire `{isNewPro && (...)}` "New on REPs" pill JSX.
   - No replacement element. Header stays: name + VerificationPill.

3. **Coach shop-front — `src/routes/c.$slug.tsx` (lines 621–624)**
   - For real coaches: "Verified since" tile = `year(member_since)`; "Years coaching" tile = `years_coaching` (no `+` suffix when 1).
   - Mock Katie Gibbs coach object retains its hardcoded `verifiedSince` / `years` values so the locked demo screen does not change visually.

## Out of scope (saved for later)

- Showing "0 reviews" on listing cards (separate reviews wiring pass).
- Any other change to the listing card layout.
- Renaming "Verified since" copy or touching the verification badge.
- Admin/migration table surfacing of `member_since`.
