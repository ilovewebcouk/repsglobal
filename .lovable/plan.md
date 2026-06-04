# Match homepage navbar style on pillar pages

## Problem
The five pillar pages (`/features/visibility`, `/features/coaching`, `/features/growth`, `/features/operations`, `/features/ai`) render `PublicHeader` with `variant="solid"`, so the navbar is opaque from the top and covers the top of the hero imagery.

The homepage uses `variant="transparent"`, which renders fixed and transparent over the hero, then fades to solid once the user scrolls — exactly the behavior requested.

## Change
In `src/components/features/FeatureGroupLayout.tsx` (line 46), change:

```tsx
<PublicHeader variant="solid" />
```
to:
```tsx
<PublicHeader variant="transparent" />
```

That's the only edit. `PublicHeader` already handles the scroll-listener and the fixed/sticky positioning swap internally (lines 64–73, 199), so no other files need to change and every pillar page picks it up automatically.

## Out of scope
- Hero copy, imagery, gradients, or spacing on the pillar pages
- Header behavior on any other route
- Mobile-only tweaks (the transparent → solid behavior is already responsive)

## QA
Screenshot `/features/visibility` at 1484px:
- Navbar transparent over hero photo on load
- Fades to solid background after scrolling past hero
- Match the homepage behavior 1:1
