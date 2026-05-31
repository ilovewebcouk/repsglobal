# Restructure Profile: Services as a full-width band

Split the current 3-column row on `src/routes/pro.$slug.tsx` into two stacked rows so Services gets the full container width.

## Current

One row, 3 columns: `[1fr_1.4fr_1fr]`
- About | Services & Pricing | (Specialisms + Location stacked)

## New

**Row A** — three equal panels:
- About | Specialisms | Location  → `lg:grid-cols-3` with `gap-5`

**Row B** — full-width band:
- Services & Pricing  → single `rounded-[22px]` panel, three service cards in `lg:grid-cols-3` with `gap-5`

## Service card refinements (now that they're wider)

Each card stays `rounded-[18px]`, dark, but with the extra room:
- Image area: `aspect-[16/10]` instead of `aspect-[4/3]` (wider, less tall)
- Inside padding: `p-5` (was `p-4`)
- Title `text-[16px]`, no forced wrap
- Price row sits inline with the unit on one line: `From £60 · per session`
- Add a subtle outline "Select" link at the bottom-right of each card for affordance — `text-reps-orange text-[12px]` with chevron, no shadow

## Out of scope

- No changes to hero, sub-nav, qualifications, reviews, FAQ, CTA, stats, footer.
- No token changes. Radii stay on the locked scale: panels 22, service cards 18, buttons 10, pills full.
- No edits to other routes.

## Verify

Screenshot `/pro/james-carter` full page at 1440 viewport — confirm Services row breathes, About/Specialisms/Location read as a balanced trio above it, and nothing else shifted.
