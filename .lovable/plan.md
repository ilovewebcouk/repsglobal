## Goal

Revert the pillar/feature-group heroes from viewport-locked sizing to content-sized min-heights. Heroes should feel dense and consistent across 13–14" laptops, 1080p, and 1440p+ monitors, with a sliver of the next section (press marquee) peeking above the fold on most desktops.

## Change

Two files, identical edit:

- `src/components/features/PillarPage.tsx` (line 68)
- `src/components/features/FeatureGroupLayout.tsx` (line 50)

Replace the hero `<section>` height classes:

```diff
- min-h-[640px] lg:min-h-[calc(100svh-72px)] lg:max-h-[1440px]
+ min-h-[640px] lg:min-h-[780px]
```

That's it. No `svh`, no `max-h` cap — hero is sized by its content with a floor.

## Why these values

- **Mobile floor `640px`** — unchanged; matches what we had.
- **Desktop floor `780px`** — fits headline + sub + dual CTA + feature pills comfortably without dead space. On a 13–14" MBP (~800px viewport) this fills the fold; on 1080p it leaves ~220px for the marquee peek; on 1440p the hero stays the same size and the page feels denser instead of stretching.
- **No max cap needed** — the hero never grows past its content, so 4K monitors don't blow it out.

## Out of scope

- Hero copy, photo, CTAs, feature pills — unchanged
- Press marquee — unchanged; it just sits naturally below the hero now
- Any other section, route, or component
- The 1320px container width change from the previous turn stays

## Verification

Spot-check `/features/visibility`, `/features/coaching`, `/features/operations` at current viewport (1484×1152) — confirm hero feels intentional, marquee peeks above the fold, no awkward empty band between headline and CTA.
