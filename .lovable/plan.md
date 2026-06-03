## Summary
Add the three head-to-head comparison pages plus a hub link to the **For Professionals** column in the public footer, so comparison content is one click away without bloating the header nav.

## Changes

### `src/components/public/PublicFooter.tsx`
In the "For Professionals" `links` array, insert four new entries after the existing five items:

1. `REPs vs Trainerize` → `/compare/reps-vs-trainerize`
2. `REPs vs MyPTHub` → `/compare/reps-vs-mypthub`
3. `REPs vs PT Distinction` → `/compare/reps-vs-pt-distinction`
4. `Compare all platforms` → `/compare`

These routes already exist in `src/routes/compare_*.tsx` and `src/routes/compare.tsx`. No new routes, components, or nav-config changes are required.

## Verification
- Run `node scripts/check-nav-links.mjs` to confirm the comparison routes are no longer flagged as orphans.
- Verify each link resolves to its existing route file in `src/routes/`.

## Technical Details
- Footer column uses a simple `links.map(...)` loop — adding items is a single array edit.
- No design-token or styling changes; the existing `text-[14px] text-reps-muted hover:text-white` link style applies automatically.