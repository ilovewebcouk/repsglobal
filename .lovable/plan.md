# Operations navbar + shift hero subjects down

## What I missed
`/features/operations` uses a different component (`PillarPage`) from the other four pillars (which use `FeatureGroupLayout`). My previous edit only fixed the `FeatureGroupLayout` group. Operations still renders a solid navbar that covers the hero photo.

## Changes (CSS-only, no regen)

### 1. Operations navbar — match homepage scroll behavior
`src/components/features/PillarPage.tsx` line 65:
- `<PublicHeader variant="solid" />` → `<PublicHeader variant="transparent" />`

`PillarPage`'s hero already has full-bleed art directly under the header (no white band), so the transparent → solid-on-scroll behavior works the same as on the homepage and the other four pillars.

### 2. Shift hero subjects down (all five pillars)
The hero `<img>` in both layouts is `object-cover object-center lg:object-right`. Because the hero container is wider than the source images' aspect ratio, the image gets scaled up vertically and ~190px is cropped — split evenly top and bottom with `object-center`, which puts the subjects' heads near the top edge.

Switching the Y anchor to `top` reveals the source's natural headroom and pushes the subjects visually downward (no regen, no transform, no layout change):

- `src/components/features/PillarPage.tsx` line 74:
  `object-cover object-center lg:object-right`
  → `object-cover object-top lg:object-right-top`
- `src/components/features/FeatureGroupLayout.tsx` line 56:
  same swap.

`right-top` keeps the existing right-anchored framing on desktop (so the copy column on the left stays clear) while moving the crop window to the top of the source.

## QA
Screenshot at 1484px for `/features/operations`, `/features/visibility`, `/features/coaching`, `/features/growth`, `/features/ai`:
- Navbar transparent over hero on load, solidifies on scroll
- Subjects' heads sit lower in the frame with visible headroom
- Copy column legibility unchanged

## Out of scope
- Image regeneration, swapping, or retouching
- Hero copy, gradient overlays, or button styles
- Any non-pillar route
