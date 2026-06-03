## Goal

Make sure no part of the compare table ever paints on top of `PublicHeader` during scroll.

## Root cause

`PublicHeader` sits at `z-30`. The table currently uses:

- `<thead>` → `z-30`
- sticky header `<th>` cells (Feature + REPs) → `z-40`
- sticky body cells → `z-10`

The two `z-40` header cells are higher than the public header. With the header's semi-transparent `bg-reps-ink/95 backdrop-blur` and sub-pixel rounding during scroll, those cells visibly bleed through where they meet at y = 72.

## Fix (single file: `src/components/marketing/CompetitorCompare.tsx`)

Re-tier the table's stacking so the whole table stays *below* `PublicHeader` while preserving the intra-table order (sticky header above sticky body cells, sticky cells above non-sticky cells).

| Element | Current | New |
|---|---|---|
| `<thead>` wrapper | `z-30` | `z-20` |
| Sticky `<th>` (Feature column, header row) | `z-40` | `z-20` |
| Sticky `<th>` (REPs column, header row) | `z-40` | `z-20` |
| Sticky `<th>` (Feature column, body rows) | `z-10` | unchanged |
| Sticky `<td>` (REPs column, body rows) | `z-10` | unchanged |

Result: `PublicHeader (z-30)` > `table sticky thead cells (z-20)` > `table sticky tbody cells (z-10)` > non-sticky cells (auto). No more bleed-through under the header.

## Out of scope

- No layout, color, copy, row, column, or sticky-position changes.
- No change to `PublicHeader`, `compare.tsx`, or `styles.css`.

## QA after change

- Mobile (390) + tablet (768): scroll down past the table — pinned logo row sits cleanly under `PublicHeader`, no bleed-through during scroll. Scroll horizontally — sticky Feature + REPs columns still float above the other columns inside the table.
- Desktop (1280+): scroll down — pinned logo row sits cleanly under `PublicHeader`.
