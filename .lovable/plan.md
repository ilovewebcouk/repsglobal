## Goal

One shared 50/50 component every pillar page can drop in: cinematic hero photo on one side, real REPs UI floating over it as small dashboard cards. Reusable, configurable, and consistent — so all six pillar pages read as the same site.

## Component

**New:** `src/components/marketing/CinematicCardStack.tsx`

### Props

```ts
type FloatingCard =
  | { kind: "iframe"; src: string; title: string; scale?: number }   // live REPs route, scaled
  | { kind: "stat"; label: string; value: string; delta?: string }   // KPI tile
  | { kind: "node"; node: React.ReactNode };                         // escape hatch

type CinematicCardStackProps = {
  image: { src: string; alt: string };
  /** Anchor 2–3 floating cards. `position` chooses a preset slot so layouts stay consistent across pages. */
  cards: Array<FloatingCard & { position: "top-left" | "top-right" | "bottom-left" | "bottom-right" | "center-right" }>;
  /** Optional orange glow strength; defaults to 0.22. */
  glow?: number;
  /** Flip the photo to the right side. */
  reverse?: boolean;
  className?: string;
};
```

### Visual recipe (locked)

- Outer wrapper: `relative w-full aspect-[4/5] lg:aspect-[5/4]` with `rounded-[22px] overflow-hidden`.
- Background `<img>` covers the wrapper (`object-cover`), `loading="lazy"`, with `bg-reps-ink/40` legibility wash and a brand-orange radial glow (matches `HeroDeviceCluster`).
- Floating cards are absolutely positioned to preset slots (no free coordinates — keeps every page consistent). Each card uses:
  - `rounded-[16px] border border-reps-border bg-reps-panel/85 backdrop-blur shadow-[0_30px_60px_-30px_rgba(0,0,0,0.7)]`
  - For `iframe` kind: wraps `ScaledFrame` from `DeviceMockup.tsx` at a default `scale: 0.45` inside a `192–260px` wide chip.
  - For `stat` kind: `12px` uppercase orange label + `28px` white value + optional emerald `delta` (status-only emerald rule).
- Fade-in: same animation as for-pros hero cards (`animate-fade-in`, 560ms, 80/160/240ms staggered delays).

### Layout integration

**Extend** `PillarPage.tsx` `PillarFeature.mockup` to also accept a new config:

```ts
| { kind: "cinematic"; image: {src;alt}; cards: [...] }
```

When present, `PillarFeatureBlock` renders `<CinematicCardStack {...}/>` instead of `MockupStage + DeviceMockup`. The existing `DeviceMockupProps` and `ReactNode` paths stay — adoption is opt-in per feature block.

No changes to `/for-professionals` in this pass. Adoption happens pillar-by-pillar in future asks; we'll wire one example block on `/features/visibility` (Capability 1) to prove the pattern.

## Files

- **Create** `src/components/marketing/CinematicCardStack.tsx`
- **Edit** `src/components/features/PillarPage.tsx` — add the `cinematic` branch to `PillarFeature.mockup` + `PillarFeatureBlock`
- **Edit** `src/routes/features.visibility.tsx` — switch Capability 1 only to the new layout (cinematic trainer photo + floating verified-profile card + floating reviews stat tile), so the pattern is live and reviewable before we propagate

## What I won't do

- Won't change `/for-professionals` or any other pillar page in this pass.
- Won't add new image assets — reuse `hero-visibility-bg.jpg` for the proof block.
- No backend, no new mockup illustrations — floating cards reuse `ScaledFrame` of real routes plus a tiny stat tile.
- No new radii (sticks to 16/22), no new colors (orange + emerald-for-status only).

## Memory update (after build)

Save `mem://design/cinematic-card-stack` describing this component as the shared cinematic 50/50 pattern, and add it to the marketing-primitives core rule so future pillar pages must use it instead of hand-rolling a photo + cards composition.
