## Honest answer on "10/10"

Not yet. Two real problems on `/features/visibility`:

1. **Inconsistent with `/for-professionals`.** That page uses the `ProductBlock` 50/50 with a small-caps orange eyebrow (`Pillar 1 · Visibility`) and a real laptop iframe of an actual REPs route (`/pro/james-carter`, `/c/james-wilson`, `/dashboard/leads`). The visibility page uses a different component (`PillarPage` + bespoke `VisibilityMockups.tsx`), a different eyebrow style (orange pill chip with words like "Verified profile"), and hand-drawn fake UI. They don't look like the same site.
2. **The mockups aren't cinematic and aren't the real product.** You're right — the strongest pattern is a cinematic photo with real dashboard cards/screens composed over it (what `/for-professionals` already does with `HeroDeviceCluster` and `DeviceMockup` iframes of live routes). The current `SearchResultsMockup`, `ReviewsMockup`, `SeoLandingMockup`, `ShareKitMockup` are pure Tailwind illustrations — they aren't pulled from `/dashboard` or `/find`, so they drift from the real product and have to be maintained separately.

## What to build

Rebuild `/features/visibility` so every 50/50 block is the **same `ProductBlock` component** used on `/for-professionals`, pointed at the real REPs routes. No new components, no bespoke mockups, eyebrows aligned.

### Eyebrow scheme (matches `/for-professionals`)

Drop the orange chip. Use the small-caps orange eyebrow from `ProductBlock`:

- `Capability 1 · Verified profile`
- `Capability 2 · Directory placement`
- `Capability 3 · Reviews on the record`
- `Capability 4 · City & specialism pages`
- `Capability 5 · Share kit & social proof`

Same typographic treatment as `Pillar 1 · Visibility` on the for-pros page — instantly reads as the same site.

### 50/50 blocks — reuse `ProductBlock` with real routes inside `DeviceMockup`

| # | Capability | Device | Live route in the laptop frame |
|---|---|---|---|
| 1 | Verified profile | laptop | `/pro/james-carter` |
| 2 | Directory placement | laptop | `/find?city=manchester&specialism=personal-trainer` |
| 3 | Reviews on the record | laptop | `/pro/james-carter#reviews` |
| 4 | City & specialism pages | laptop | `/in/manchester` |
| 5 | Share kit & social proof | phone | `/c/james-wilson` (Pro shop-front renders as the share target) |

This is exactly the "icons / sections / cards from the actual `/dashboard`" idea — except the laptop shows the **real REPs page** for that capability, so it stays in sync forever and is visually identical to the for-pros blocks.

### Files

- **Rewrite** `src/routes/features.visibility.tsx`
  - Keep the existing `PillarPage` hero / ActIntro / Comparison / cross-links / CTA shell (those are already the shared chrome).
  - Replace the `features` array's `mockup: <ReviewsMockup />` style with `mockup: { device: 'laptop', src: '/pro/james-carter', title: '…' }` and let `PillarFeatureBlock` render `DeviceMockup` the same way `ProductBlock` does. Smallest change: extend `PillarFeature` so `mockup` can be a `DeviceMockup` config (preferred) instead of `ReactNode`, and route through `DeviceMockup` inside `PillarPage.tsx`.
  - Rename `tag` values to the `Capability N · …` scheme.
- **Update** `src/components/features/PillarPage.tsx` — `PillarFeatureBlock` renders `MockupStage` + `DeviceMockup` when given a config object (matches `ProductBlock`); render the small-caps eyebrow instead of the chip pill.
- **Delete** `src/components/mockups/VisibilityMockups.tsx` (no longer referenced; bespoke illustrations replaced by real routes).

### What I won't do

- No new mockup components, no new section components, no new hero variants.
- No backend/data work — Phase 1 visual only.
- No change to `/for-professionals` (it's the source of truth for the pattern).

### Future option (separate ask, not in this plan)

If you later want the "cinematic photo + floating dashboard cards" composition (à la `HeroDeviceCluster`), we'd build **one** shared `CinematicCardStack` component and adopt it on both `/for-professionals` and every pillar page in the same pass — so it never drifts again. Flag it and I'll spin it up.
