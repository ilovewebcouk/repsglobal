# Widen Professional Profile to site-wide 1320px

Bring `src/routes/pro.$slug.tsx` in line with `/` and `/find-a-professional` by switching every section wrapper from `max-w-[1180px]` to `max-w-[1320px]`. No structural changes — same sections, same grids, same components.

## Change

In `src/routes/pro.$slug.tsx`, on every `<div class="mx-auto max-w-[1180px] …">` wrapper:

- Hero band
- Sub-nav band
- About / Services / Specialisms+Location row
- Qualifications + Trust & Assurance row
- Reviews + FAQ row
- CTA band
- Stats band

Replace `max-w-[1180px]` → `max-w-[1320px]`. Keep all other classes (padding, py, lg:px-10) as-is.

## Out of scope

- No restructure of the About / Services / Specialisms grid (Services cards stay in the middle column for now — you'll see them breathe with the extra ~140px).
- No token, radius, or color changes.
- No edits to header, footer, or other routes.

## Verify

Screenshot `/pro/james-carter` full page at 1440 viewport, confirm horizontal alignment matches `/find-a-professional`.
