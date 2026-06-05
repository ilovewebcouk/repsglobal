## Problem

On `/find-a-professional`, the page sections (results grid, editorial break, testimonials, etc.) visually paint **over** the fixed navbar as you scroll. It is not actually a z-index value problem — `PublicHeader` already sets `z-30` and `fixed inset-x-0 top-0`.

The real cause is a **stacking context trap**:

```tsx
<section className="relative isolate overflow-hidden ...">   // hero
  <div className="absolute inset-0 -z-10 ..." />              // bg layers
  <PublicHeader variant="transparent" />                       // ← header is INSIDE
  ...
</section>

<section className="bg-reps-ivory">...results...</section>    // sibling
<section>...editorial break...</section>
<section>...testimonials...</section>
```

`isolate` on the hero creates a new stacking context. The fixed `PublicHeader` (z-30) is scoped *inside* that context, so its effective stacking is "hero's z-index (auto/0) + 30". The sibling sections that follow are painted **after** the hero in normal flow with z auto, so they render on top of the entire hero stacking context — including the fixed header. Result: cards/banners overflow the navbar on scroll.

## Fix

Lift `PublicHeader` out of the isolated hero so it lives at the page root, above every section's stacking context.

### Change in `src/routes/find-a-professional.tsx`

1. Render `<PublicHeader variant="transparent" />` as the first child of the page's outer `<div className="min-h-screen bg-reps-ivory">`, *before* the hero `<section>`.
2. Remove the `<PublicHeader />` line from inside the hero section.
3. Keep the hero's `relative isolate overflow-hidden` (it's needed to clip the `-z-10` background layers). No other layout/spacing changes — the hero already reserves top padding (`pt-[120px] sm:pt-[140px] lg:pt-[168px]`) for the fixed header, so visuals stay identical.

### Defensive bump (optional, recommended)

Bump `PublicHeader`'s wrapper from `z-30` to `z-50` so any future sibling that introduces its own stacking context (e.g. a modal backdrop, sticky filter rail with a custom z) still sits below it. The sticky filter `<aside>` on this page has no explicit z, so it stays under the header.

## Why not just remove `isolate`?

`isolate` is doing real work — it keeps the `-z-10` background image and gradient from leaking behind the page background. Removing it would risk the hero artwork disappearing or bleeding into other sections. Lifting the header out is the safer, scoped fix.

## Verification

- Screenshot at 1320 / 768 / 390 px, scrolled ~600px down: navbar must sit above the results grid, editorial break, and testimonial section.
- Backdrop-blur on header (if any) should still composite correctly over scrolled content.
- No layout shift in the hero (top padding unchanged).

## Out of scope

No other routes touched. No changes to `PublicHeader` internals beyond the optional `z-30 → z-50` bump.
