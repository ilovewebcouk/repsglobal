# Widen Professional Profile to match site

You're right — the profile page is ~140px narrower than the rest of the site. Home and Directory both use `max-w-[1320px]`; the profile uses `max-w-[1180px]` on every section wrapper.

## Change

In `src/routes/pro.$slug.tsx`, replace every `max-w-[1180px]` with `max-w-[1320px]` (7 occurrences: hero, sticky sub-nav, About row, Services row, Reviews row, CTA band, similar-pros row). Keep the `px-6 lg:px-10` gutters and inner `max-w-[520px]/[460px]` text constraints unchanged.

## Out of scope

- No restructuring of the Services & Pricing layout in this turn — if cards still look stretched at 1320px, we can horizontalize them as a follow-up.
- No changes to other pages, tokens, radii, or components.

## Verification

Navigate to `/pro/sophie-taylor` at the current 1469px viewport, screenshot, and confirm the page chrome now aligns edge-to-edge with `/` and `/find-a-professional`.
