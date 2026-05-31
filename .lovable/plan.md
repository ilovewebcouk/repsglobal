## Goal
Replace the 3-equal-column row with a 2-column layout so each card holds the right amount of content for its width. Removes the empty-space problem at the source and lets us drop the redundant "Works with" and "Training style" sections.

## Layout

```text
┌──────────────────────────────┬─────────────────────┐
│                              │ Specialisms        │
│  About James (wider)         ├─────────────────────┤
│                              │ Location           │
└──────────────────────────────┴─────────────────────┘
```

Grid: `lg:grid-cols-[1.4fr_1fr]` with `gap-5`. Right column is a vertical stack (`flex flex-col gap-5`) holding Specialisms then Location.

## Card content

### About (left, wide)
- Keep bio paragraphs.
- Keep 2×2 stats grid (years, clients, rating, response time).
- **Remove** "Training style" pills.
- No new content needed — the wider column makes the bio breathe.

### Specialisms (right, top)
- Heading + chip cloud (existing tags).
- **Remove** "Works with" group and the italic footer line.
- Card shrinks to fit its contents; no forced height.

### Location (right, bottom)
- Keep enlarged `aspect-[16/9]` map.
- Keep 4-row key/value list (Area, Region, Format, Travel).
- Keep footer row (View on map · Get directions).

## Out of scope
- No changes to hero, sub-nav, Services & Pricing band, reviews, FAQ, footer, page max-width, or tokens.
- Remove unused `worksWith` and `trainingStyle` fields from the `Pro` type and `james-carter` data (cleanup only).
- Radii stay locked (panel 22, map 12, chips full, buttons 10).

## Verify
Screenshot `/pro/james-carter` at 1469 viewport; confirm About fills its wider column, Specialisms and Location stack cleanly on the right, and no card has a large empty tail.
