## Goal
Strip the /for-professionals page back to a clean feature-led layout: 10 alternating 50/50 ProductBlocks, no chapter dividers.

## Changes
1. **Delete** `src/components/marketing/PillarChapter.tsx` — no longer used.
2. **Edit** `src/routes/for-professionals.tsx`:
   - Remove all 6 `<PillarChapter />` imports and usages.
   - Keep the 10 existing ProductBlocks in their current order (Verified profile → Personalised page → Lead pipeline → Bookings & calendar → Payments → Clients CRM → Messaging → Programmes → Check-ins → Client portal).
   - Keep `reverse` alternating on every other block for visual rhythm.
   - Keep all existing rhythm-breakers (TestimonialFeature, ComparisonStrip, ReplacedStackBoard, TestimonialTriad, UseCaseTriad, REPs AI, Growth, WeekWithReps, FAQ, Final CTA) exactly where they are.
   - No new content, no rewrites — purely delete the dividers.

## Out of scope
- Hero, pillar grid, RegisterProof, ComparisonStrip, ReplacedStackBoard, TestimonialTriad, UseCaseTriad, WeekWithReps, FAQ, final CTA, footer.
- Any `/features/*` pages or feature-config data.

## Result
Page flows: pillar grid → 10 feature 50/50s → existing rhythm-breakers → closing sections. No chapter headers, no extra visual noise between pillars.