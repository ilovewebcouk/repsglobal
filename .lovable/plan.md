## Goal

Stop the pillar hero H1 from drifting below optical centre when the sub-copy is short (e.g. `/features/coaching`). The H1 should land at the same vertical position across every pillar — `coaching`, `operations`, `visibility`, `growth` — regardless of how many lines of body copy that page has.

## Why the current behaviour is wrong

The hero content column uses `justify-center` with symmetric `py-20 lg:py-24`. That centres the whole block geometrically inside the 780px hero. When the sub-paragraph is 2 lines instead of 3, the entire block — eyebrow, H1, sub, CTAs — shifts down ~30px to stay centred. Verified on screenshots: `/for-professionals` eyebrow at ~170px, `/features/coaching` eyebrow at ~225px.

Optical centring for a hero headline should sit at ~42% from the top of the hero, not 50%. Anchoring from the top with a fixed offset fixes both problems (drift between pillars **and** sitting too low overall).

## Change

Two files, identical edit:

- `src/components/features/PillarPage.tsx` — hero content wrapper (line ~80)
- `src/components/features/FeatureGroupLayout.tsx` — hero content wrapper (matching line)

Replace:

```diff
- <div className="relative mx-auto flex w-full max-w-[1320px] flex-col justify-center px-6 py-20 lg:px-10 lg:py-24">
+ <div className="relative mx-auto flex w-full max-w-[1320px] flex-col justify-start px-6 pt-24 pb-20 lg:px-10 lg:pt-[260px] lg:pb-24">
```

What changes:
- `justify-center` → `justify-start`: copy anchors from the top, so sub-copy length no longer moves the H1.
- `lg:pt-[260px]`: lands the eyebrow at ~260px from the hero top on desktop, which puts the H1 baseline at ~42% — the same eye-line as `/for-professionals` and the optical sweet spot.
- Mobile stays `pt-24` (96px) — appropriate for 640px hero floor; the content still reads near the top.

Hero `min-h` values (`min-h-[640px] lg:min-h-[780px]`) stay the same. CTAs still finish well before the floor seal, so the marquee peek below the hero is unchanged.

## Out of scope

- Hero copy, photo, CTAs, feature pills — unchanged
- `/for-professionals` hero — unchanged (different component, already feels right; revisit only if it starts to look inconsistent against the pillars after this lands)
- Any other section, route, component, or token

## Verification

After the change, screenshot at 1440×900:
- `/features/coaching` (short sub) — eyebrow should sit at ~170–180px from viewport top (matching `/for-professionals`)
- `/features/operations` (uses `PillarPage` with 5 feature blocks below) — same eyebrow position
- `/features/visibility`, `/features/growth` — same eyebrow position

At 375px and 768px, confirm the H1 still reads near the top of the hero with comfortable breathing room above and the CTAs don't crash into the floor-seal gradient.
