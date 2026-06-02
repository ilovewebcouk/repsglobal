## Scope
Single-file change to `src/components/public/PublicHeader.tsx`.

## Changes
1. **Desktop nav** — remove the "Pricing" link and "Become a Pro" link.
2. **Desktop "Join REPs" button** — change destination from `/signup` to `/for-professionals`.
3. **Mobile drawer** — remove "Become a Pro" and "Pricing" accordion items, and change the "Join REPs" button destination from `/signup` to `/for-professionals`.

No other files affected. The `/for-professionals` page already contains the pricing anchor and signup CTAs, so this is the correct single entry point into the pro funnel.