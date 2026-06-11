Tighten three spacing/copy issues on `/pricing` without touching the locked layout structure.

## 1. Toggle ↔ Pro card badge gap (too tight)

`src/components/pricing/PricingPlans.tsx`
- Increase the toggle's bottom margin so the "30-DAY FREE TRIAL" badge that floats above the Pro card no longer crowds it. Change the toggle row from `mb-10` to `mb-14` (40 → 56px). Combined with the badge's `-top-3`, that leaves ~44px of clear air between the toggle pill and the badge.

## 2. Toggle row needs symmetric breathing room

`src/components/pricing/PricingPlans.tsx`
- Add a small top margin on the toggle wrapper so it doesn't feel glued to the hero copy above. Change the wrapper from `mb-10 flex justify-center` to `mt-2 mb-14 flex justify-center` (tiny top nudge; the section padding above already provides most of the air).

## 3. Stale promo strip copy ("card required")

`src/components/pricing/FoundingBanner.tsx`
- Replace `30-day free trial · card required · then £59/mo unless cancelled` with `30-day free trial · cancel anytime before day 30` so it stays consistent with the Pro card meta we just cleaned up (no more "card required" anywhere on the page).

## Out of scope

Not touching card heights, gap between cards, Pro card scale/translate, or the toggle's badge styling in this pass — those were items 3, 4, and 6 in the QA and need a separate decision.