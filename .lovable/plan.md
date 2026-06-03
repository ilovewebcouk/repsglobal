## Problem

On `/compare`, the new `PlansLimitsSummary` rows don't line up. The REPs row puts the "Recommended" pill inline next to the "REPs Pro" label, which pushes the Entry / Clients / Paid add-ons columns to the right. Competitor rows (logo only in column 1) start those columns further left, so nothing vertically aligns.

## Fix

Make every row share the same column grid, and move the Recommended pill out of the flow.

### Layout change in `src/components/marketing/PlansLimitsSummary.tsx`

- Replace the `flex` rows with a CSS grid that all rows share, so column edges align across REPs + 3 competitor rows. Single source of truth for column widths.
  - Mobile (`< md`): stacked (grid collapses to one column per row, as today).
  - `md+`: `grid-cols-[180px_110px_140px_120px_1fr]` for: brand · Entry · Clients · Paid add-ons · trailing CTA. (Widths tuned to current content; final values picked during implementation to fit longest values like "Unlimited" and "$9/mo for 2".)
- First column holds the REPs wordmark or the competitor logo only. No pill inline.
- Move the "Recommended" pill to a small absolute badge in the top-right corner of the REPs row, so it does not consume grid space. On mobile it stays inline above the brand label (since the row stacks anyway).
- Keep the orange-tint background and green emphasis on REPs values unchanged.
- Keep the row a `<Link>` for competitors and a plain `<div>` for the REPs row (REPs already links to `/pricing` via the trailing CTA).

### What stays the same

- Same data sources (`COMPETITOR_LIST`, `HREF_BY_SLUG`).
- Same content per row (Entry / Clients / Paid add-ons + Compare CTA).
- Footnote unchanged.
- `PlansLimitsStrip` on the `/compare/reps-vs-*` pages untouched.

## Out of scope

- No changes to `/compare/reps-vs-*` pages, competitor data, editorial copy, or the feature matrix.
- No new components beyond the existing `PlansLimitsSummary` file.
- No design-token or radius changes.
