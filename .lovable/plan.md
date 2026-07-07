## Goal
Restructure the provider page body into a persistent two-column shell below the hero: **left column = main content (full width of that column), right column = sticky rail led by the "What Learners Say" review card.** Header/hero/breadcrumbs and the bottom CTA/stats stay full-width edge-to-edge.

## Layout

```text
┌───────────────── Hero (full width, unchanged) ─────────────────┐
├────────────────────────────────────────────────────────────────┤
│  LEFT (main, ~2/3)              │  RIGHT (sticky, ~1/3)         │
│                                 │  ┌──────────────────────┐    │
│  About Diverse                  │  │ What Learners Say    │    │
│  Courses & Pricing              │  │ 0.0  ★★★★★           │    │
│  Verified Professionals Trained │  │ Based on N reviews   │    │
│  Locations & Delivery           │  │ 5 ★ ▓▓▓▓▓▓▓▓ 12      │    │
│  Accreditations & Recognition   │  │ 4 ★ ▓▓▓░░░░░  3      │    │
│  Trust & Assurance              │  │ ...                  │    │
│  Frequently Asked Questions     │  │ Featured review /    │    │
│                                 │  │ empty state          │    │
│                                 │  └──────────────────────┘    │
│                                 │  (future cards slot here)     │
├────────────────────────────────────────────────────────────────┤
│  CTA band (full width, unchanged)                              │
│  Trust stats strip (full width, unchanged)                     │
└────────────────────────────────────────────────────────────────┘
```

## Changes — `src/routes/t.$slug.index.tsx`

1. **Wrap** the current stack of `<section>` blocks that live between the hero and the CTA band in a single container:
   ```
   <div class="mx-auto max-w-[1180px] px-4 lg:px-6 py-10 grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_360px]">
     <div class="min-w-0 space-y-6"> {/* left column */}
     <aside class="lg:sticky lg:top-[88px] self-start space-y-6"> {/* right column */}
   </div>
   ```
   `top-[88px]` clears the sticky site header (72px) + breathing room.

2. **Left column** (in order — kept from current page): About Diverse, Courses & Pricing, Verified Professionals Trained, Locations & Delivery, Accreditations & Recognition, Trust & Assurance, FAQ. The current 3-column card grid inside these sections flattens to a single stack.

3. **Right column** (sticky): the existing `#reviews` "What Learners Say" article moves here as the first card. The internal layout collapses from its current 2-column (histogram + featured review) into a **single vertical stack** so it fits the 360px rail:
   - Big score + star row
   - `Based on N reviews`
   - 5-row histogram (5★→1★, orange bars, count on right) — unchanged style
   - Featured review OR dashed empty-state box underneath the histogram
   - "See all N reviews" link
   Placeholder space stays below for future rail cards (no new content added now).

4. **In-page tab nav** (`About · Courses · Verified Pros · Reviews · Accreditations · Locations`) — `Reviews` now scrolls to the sticky rail on desktop; on mobile the aside stacks under the left column and the anchor still works. No JS changes needed since anchors are already present.

5. **Responsive**: below `lg`, the grid collapses to one column and the aside is no longer sticky — it renders after the FAQ section (natural document order). Mobile experience is otherwise unchanged.

6. **Nothing else moves**: hero, breadcrumbs, in-page tab nav, CTA band and stats strip stay full-width outside the two-column grid.

## Out of scope
- No visual restyling — same tokens, radii, borders, orange, `bg-white` cards.
- No new sections in the right rail beyond the review card (the ask calls out room for future ones).
- No changes to server functions or data shape.
