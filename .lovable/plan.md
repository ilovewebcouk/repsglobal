# Fix: Remove Pro Card Glow Spill into Enterprise

## Problem
The Pro ("Founding Pro") pricing card casts a large orange drop-shadow (`lg:shadow-[0_30px_80px_-30px_rgba(255,122,0,0.45)]`) that visually bleeds into the Enterprise strip directly below it, making the Enterprise section look compromised.

## Change
In `src/components/pricing/PricingPlans.tsx`, remove the `lg:shadow-[0_30px_80px_-30px_rgba(255,122,0,0.45)]` class from the `p.featured` Card variant. The card will keep its orange `border-2`, `ring-1`, "MOST POPULAR" badge, and `lg:-translate-y-3` lift — just without the overflow shadow.

## Verification
After the edit, visually confirm the pricing page at `/pricing#plans` shows a clean dark gap between the Pro card and the Enterprise strip, with no orange haze overlap.