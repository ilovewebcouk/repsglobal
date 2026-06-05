## Problem

Removing `open` from `<details>` collapsed it on every breakpoint. The summary chevron is `lg:hidden`, so on desktop there's no way to expand it — the filter rail looks empty.

`<details>` can't be conditionally open via CSS media queries, so we need a small React state instead.

## Fix

In `src/routes/find-a-professional.tsx` (filter rail block, ~lines 284–290):

1. Replace the `<details>/<summary>` pair with a `useState` toggle (`mobileFiltersOpen`, default `false`).
2. Render a `<button>` (mobile-only, `lg:hidden`) showing "Filters (5)" + chevron that toggles state.
3. Wrap the filter content in a `<div>` with classes `${mobileFiltersOpen ? 'block' : 'hidden'} lg:block` so it's:
   - collapsed by default on mobile
   - always visible on `lg+` regardless of state
4. Rotate the chevron based on state (`mobileFiltersOpen && 'rotate-180'`).

No other files change. No business logic change.
