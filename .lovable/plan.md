## Goal

Align every section container with the navbar/footer (`max-w-[1320px]`) and finish the pillar-page hero cap fix from the previous turn.

## Changes

**1. Global container bump — `max-w-[1240px]` → `max-w-[1320px]`**

Find-replace across all 25 affected files (107 total occurrences). The 40px lateral gutter (`lg:px-10`) stays untouched — it keeps headlines off the screen edge on 13–14" laptops and preserves the press-marquee fade mask. Only the inner cap changes.

Files touched:
- Routes (19): `about`, `careers`, `compare`, `complaints`, `contact`, `cookies`, `cpd`, `faq`, `features.ai`, `for-professionals`, `help`, `how-it-works`, `press`, `pricing`, `resources.index`, `resources.$slug`, `specialisms`, `standards`, `verify`
- Components (6): `pricing/FoundingBanner`, `features/PillarPage`, `features/FeatureGroupLayout`, `features/FeaturePageLayout`, `legal/LegalShell`, `marketing/HeadToHead`

**2. Raise pillar hero cap — `lg:max-h-[1000px]` → `lg:max-h-[1440px]`**

In `src/components/features/PillarPage.tsx` and `src/components/features/FeatureGroupLayout.tsx`. This finishes the 1440p verification thread — hero now genuinely fills the viewport on 1080p, 1440p, and anything in between, while still capping ultra-tall 4K/5K monitors so the headline doesn't float in dead space.

## Out of scope

- Navbar/footer themselves (already at 1320px — they're the reference)
- Gutter (`lg:px-10`) — staying
- Any full-bleed backgrounds (hero photo, dark ink, marquee) — already full-width
- Any layout, copy, or component logic

## Verification after build

Spot-check 3 routes at 1484px viewport (current): pillar page (`/features/coaching`), pricing, and home — confirm the content edges line up vertically with the header's logo-left and account-right.
