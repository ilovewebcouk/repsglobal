---
name: Trainer-to-Platform Composite
description: Shared cinematic 50/50 component — trainer photo with REPs UI cards emanating from the scene (three locked compositions). Replaces CinematicCardStack.
type: design
---

# Trainer-to-Platform Composite

Component: `src/components/marketing/TrainerToPlatformComposite.tsx`

A cinematic trainer/coach photo on one side of the 50/50, with real REPs UI
elements (device frames + stat tiles) expanding from the scene with depth.
This is the canonical "Cinematic Product Composite" for every pillar page.

## Three locked compositions

Pick ONE per feature block. Never invent free-positioned cards.

- **`card-trail`** — photo + 2 stat tiles trailing diagonally from the subject.
  Card 1: smaller, upper-right overlapping shoulder, `-rotate-[2deg]`.
  Card 2: larger, lower-right, `rotate-[1.5deg]`.
- **`device-and-stats`** — photo + 1 device (laptop or phone, real REPs route)
  bottom-right + 1 stat tile top-left.
- **`single-hero`** — photo subject behind one big device mockup, centred-right.

## Rules

- Use shadcn `Card` for stat tiles. Real `ScaledFrame` for devices. No bespoke
  panel markup.
- Stat tile colours: orange eyebrow label, white value, optional emerald delta
  (status-only — see `mem://design/status-colors`).
- Outer wrapper: `aspect-[4/5]` mobile / `aspect-[5/4]` lg, `rounded-[22px]`.
- Floating cards: `rounded-[16px]` (stat) / `rounded-[16px]` laptop / `rounded-[22px]` phone.
- Stagger: 80 / 180 / 280 ms fade-in, 640 ms duration.
- Brand-orange radial "ray" gradient anchored at 35% 45% (where the subject
  usually sits) — drives the "expanding from the scene" read.

## Heading inside the 50/50

The matching H3 on the copy side is always `BlockHeading` (28 → 36) — see
`mem://design/marketing-section-primitives`. Never hand-roll heading sizes.

## Currently wired

- `/features/visibility` Capability 1 → `composition: "card-trail"`.

When extending to other pillars, pick the composition that matches the
capability: dashboards/devices = `device-and-stats`; pure social proof
(reviews, ratings, verified status) = `card-trail`; single hero screen
(shop-front, AI workspace) = `single-hero`.
