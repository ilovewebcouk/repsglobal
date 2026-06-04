
# Pillar hero — mirror `/for-professionals` beat-for-beat

## Goal

The current `/features/operations` hero uses a soft radial glow + a single laptop browser frame. We're replacing it with the same hero treatment as `/for-professionals`, parameterised so all 5 pillars share it:

- Full-bleed moody gym backdrop (`for-pros-hero-gym.jpg`)
- The full overlay stack: ink wash + centred vignette + right-edge fade + brand glow + floor seal
- Eyebrow pill (border + panel + Sparkles + tracking-[0.18em])
- Two-line H1: white "lead" line on top, orange "accent" line beneath, same 34/44/64px scale
- Sub paragraph + dual CTAs (`Join REPs` / `Explore features`)
- `HeroDeviceCluster` on the right (laptop iframe + floating phone iframe), per-pillar routes

Below the hero, the existing PressMarquee → Act intro → feature blocks → comparison → cross-links → CTA stack stays unchanged.

## Changes

### 1. `src/components/marketing/HeroDeviceCluster.tsx` (edit)

Currently hardcoded to `/dashboard` (laptop) + `/portal/today` (phone). Make those configurable so each pillar can show its own routes, defaults preserved so `/for-professionals` keeps working untouched:

```tsx
type Props = {
  laptopSrc?: string;        // default "/dashboard"
  laptopTitle?: string;      // default "REPs dashboard preview"
  laptopScale?: number;      // default 0.5
  phoneSrc?: string;         // default "/portal/today"
  phoneTitle?: string;       // default "REPs client portal preview"
  phoneScale?: number;       // default 0.32
};
```

### 2. `src/components/features/PillarPage.tsx` (edit)

Replace the current hero `<section>` (lines ~58–95) with the for-professionals hero treatment. Accept new optional props on `PillarPage`:

```tsx
type Props = {
  groupKey: FeatureGroupKey;
  /** Two-line H1. `lead` white, `accent` orange. */
  heroLead: string;
  heroAccent: string;
  /** Device cluster routes for this pillar. */
  heroCluster: { laptopSrc: string; phoneSrc?: string };
  features: PillarFeature[];
  children?: React.ReactNode;
};
```

Remove the old `heroMockup` prop (it was a single `BrowserFrame` — replaced by the cluster). The pill eyebrow keeps `group.hero.eyebrow`; the sub keeps `group.hero.sub`; the H1 now comes from `heroLead` + `heroAccent` instead of `group.hero.title` so we can split the accent line.

### 3. `src/routes/features.operations.tsx` (edit)

Wire the new props:

- `heroLead`: `"Not just bookings."`
- `heroAccent`: `"An operating system for your whole practice."`
- `heroCluster`: `{ laptopSrc: "/dashboard/calendar", phoneSrc: "/portal/today" }`
- Feature blocks below stay exactly as they are.

## Out of scope

- The other 4 pillars stay on the old hero shape for now — we'll lock Operations first, then I'll roll the same cluster/copy across Visibility, Coaching, AI, Growth (each gets its own `laptopSrc`/`phoneSrc` and its own two-line H1).
- No new backdrop image — reusing `heroGym` so all five pillars sit on the same brand surface. We can swap per-pillar imagery later if you want.
- No changes to PressMarquee, Act intro, feature blocks, comparison, cross-links, CTA, or footer.
- No new mockups, no copy changes outside the hero.

## Compliance

- Tokens only (`bg-reps-ink`, `text-reps-orange`, `border-reps-border`, etc.) — no hex.
- Radii: button 10px, pill full, panel 22px — no banned values.
- No shadows on buttons. Phase 1 still static-only.
- Will run the `reps-build-compliance` audit before handing back.

Approve and I'll ship Operations, then we move to the next section.
