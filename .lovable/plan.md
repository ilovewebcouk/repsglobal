## Goal

Keep the header row (Feature · REPs · Trainerize · MyPTHub · PT Distinction) visible at the top of the viewport while the user scrolls down through the compare table, on mobile, tablet, and desktop.

## Why it isn't working today

The `<thead>` already has `sticky top-0 z-30`, but the scrolling wrapper around the table is `overflow-x-auto`. Per CSS, `overflow-x: auto` with default `overflow-y: visible` is promoted to `overflow-y: auto`, which makes that wrapper the sticky scrollport. The wrapper isn't tall enough to scroll vertically, so the sticky never triggers — it just sits at the top of the table and scrolls away with the rows.

`PublicHeader` (variant `solid`) is itself `sticky top-0` and 72px tall, so the table header needs to pin *below* it, not under it.

## Changes (single file: `src/components/marketing/CompetitorCompare.tsx`)

1. **Stop the wrapper from being a vertical scrollport.** Change the scrolling wrapper from `overflow-x-auto` to `overflow-x-auto [overflow-y:clip]`. `overflow-y: clip` preserves the horizontal scroll on mobile/tablet but does NOT create a vertical scroll context, so a sticky element inside it pins to the page viewport. On desktop the wrapper is already `lg:overflow-visible`, which is unaffected.

2. **Pin the header row under `PublicHeader`.** Change the `<thead>` class from `sticky top-0 z-30` to `sticky top-[72px] z-30` so the logos sit flush under the 72px solid public header.

3. **Keep z-index stack correct.** Already fine: header row `z-30`, sticky header cells `z-40`, body sticky cells `z-10`. No change.

4. **Header row backgrounds stay opaque.** Already fine: `<tr className="bg-reps-panel">` is solid, REPs `<th>` uses `bg-reps-orange-tint` / `lg:bg-reps-orange-soft`, Feature `<th>` uses `bg-reps-panel`. Nothing translucent in the header row, so rows scrolling underneath won't bleed through.

## Out of scope

- No copy, row, column, icon, or data changes.
- No change to the existing sticky left columns (Feature + REPs) or to the group header pinning.
- No change to `PublicHeader`, `compare.tsx`, or `styles.css`.

## QA after change

- Mobile (390): scroll down — logos pin under the orange header. Scroll horizontally — logos move with the columns, REPs column stays on the left, Feature column stays leftmost.
- Tablet (768): same.
- Desktop (1280+): scroll down — logos pin under the header. No horizontal scroll involved.
- Scroll past the bottom of the table — header unpins and scrolls away with the rest of the section (because the outer rounded container clips it).
