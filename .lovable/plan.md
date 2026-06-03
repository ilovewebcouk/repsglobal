## What's actually broken

**Sticky thead doesn't pin on any breakpoint.** Per the CSS spec, `overflow: hidden` makes an element a *scroll container*, even when no scrollbar is visible. A `position: sticky` descendant pins relative to its nearest scroll container, not the viewport. The outer wrapper around the table currently uses `overflow-hidden` (to clip the rounded corners), so the thead's "scrollport" is that wrapper. The wrapper isn't tall enough to scroll vertically, so the thead never sticks — it just scrolls away with the body rows.

**The "extra row" perception.** `PublicHeader` is `bg-reps-ink/95 backdrop-blur` (translucent). When body rows scroll under it, you see them faintly through the blur — that looks like a partial row peeking out below the header. Once the sticky thead actually pins under the header, it will sit between the body rows and the header and fully cover that ghost.

**The previous z-index pass was correct** (PublicHeader z-30 > thead z-20 > body sticky cells z-10) — but it doesn't matter while sticky isn't pinning at all. After this fix the z-index is what stops bleed-through during scroll.

## Fix (single file: `src/components/marketing/CompetitorCompare.tsx`)

1. **Outer wrapper:** change `overflow-hidden` → `[overflow:clip]`. `overflow: clip` still clips children to the padding box (so the rounded corners keep working), but does NOT create a scroll container. Sticky descendants then pin to the page viewport.

2. **Inner wrapper:** keep `overflow-x-auto [overflow-y:clip] lg:overflow-visible` as-is. `[overflow-y:clip]` is needed to stop CSS from promoting `overflow-y: visible` → `auto` when `overflow-x: auto` is set, which would otherwise re-create a vertical scrollport on mobile/tablet. On desktop `lg:overflow-visible` overrides both axes.

3. **No other changes.** thead `sticky top-[72px] z-20`, sticky header cells z-20, sticky body cells z-10 all stay — they're correct once the sticky pin actually works.

## Browser support note

`overflow: clip` is supported in Chrome 90+, Firefox 81+, Safari 16+ (Sep 2022). All in scope for this site.

## QA after change

- **Desktop (1318):** scroll down past the table — logo row pins flush under `PublicHeader`, no row peeks through.
- **Tablet (768):** same vertical pinning. Scroll horizontally — Feature + REPs columns still float above the other columns inside the table.
- **Mobile (390):** same as tablet.
- Scroll past the bottom of the table — the sticky thead unpins and scrolls away cleanly (because the outer `[overflow:clip]` wrapper still clips it at the bottom edge of the table).

## Out of scope

- No copy, row, column, color, or layout changes.
- No change to `PublicHeader`, `compare.tsx`, or `styles.css`.
