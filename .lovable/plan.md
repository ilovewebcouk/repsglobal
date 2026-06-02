## Goal
The four-pillar trust strip (★ 4.9 · 25,000+ verified pros · 120+ countries · Qualifications & insurance checked) is already restored, but on mobile (390px) it reads directly over the coach's body — contrast is borderline and the last item pushes near the fold. On tablet (768px) it wraps to two ragged rows. Fix so it stays crisp, balanced, and high-contrast at every viewport while keeping the editorial hero feel.

## Changes (single file: `src/routes/index.tsx`)

Wrap the four pillars in a subtle dark chip and give it a responsive layout:

- **Container**: `inline-flex` (mobile auto-width, hugs content), `rounded-full` on lg+ / `rounded-[16px]` below, `bg-reps-ink/55`, `backdrop-blur-md`, `border border-white/10`, padding `px-4 py-3` / `lg:px-5 lg:py-2.5`. Guarantees contrast over the portrait edge on every device, reads as one premium artefact rather than loose text.
- **Layout**:
  - Mobile (`<sm`): 2×2 grid (`grid grid-cols-2 gap-x-4 gap-y-2`) — pairs read as a tidy block, no wrap raggedness, no text-over-face contrast risk.
  - sm–md: same 2×2 grid, wider gaps.
  - lg+: single horizontal row (`lg:flex lg:items-center lg:gap-5`) with thin `h-3 w-px bg-white/15` dividers between items.
- **Items**: keep the existing icon + value + label structure, tighten to `text-[12.5px]` on mobile / `text-[13px]` lg+, `text-white/85`, bold numbers `text-white`. Icons stay coloured (orange star, gold badge, white globe, green shield) — the brand signal of the strip.
- **Spacing**: bump `mt-8` → `mt-7 sm:mt-8` so on mobile it tucks tighter under the pills and the whole hero settles inside the typical fold.

No other hero or section changes. Pills row, search, image, and stats strip stay as they are.

## Acceptance
- 390×844 (mobile): trust strip sits inside a dark chip, 2×2 grid, all four items visible above the stats strip seam.
- 768×1024 (tablet): same 2×2 chip, comfortable gaps.
- 1280–1920 (desktop): single horizontal row with vertical dividers, sitting flush left under the pills.
- Contrast: text reads cleanly on both the dark left half and the portrait-edge bleed at every breakpoint.
- No new colors hardcoded — uses existing tokens (`reps-ink`, `reps-orange`, `reps-gold`, `reps-green`, white opacities).
- Radius stays compliant (`16px` chip on mobile, `pill/full` on lg+).
