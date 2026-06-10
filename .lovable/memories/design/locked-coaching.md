---
name: Locked /features/coaching
description: Frozen 2026-06-10. 17-section coaching pillar built to PDF spec. Section 5 reuses the locked NutritionSection verbatim (Sarah K. ribbon + Manual/Templates/AI-draft triad + ApprovalStrip) — do not redesign without explicit, section-named request.
type: design
---

# /features/coaching — locked 2026-06-10

Source of truth: `Coaching---Deliver-better-coaching-from-one-connected-platform.pdf` (rebuilt to spec on 2026-06-10). Standalone route — not PillarPage.

## Section order (17 + FAQ + FinalCta)

1. Hero — "Deliver better coaching from one connected platform." HeroOverlay copySide="left". Three trust chips: REPs Pro · Connected to your client record · No extra add-ons.
2. Problem split — "Six apps. One overwhelmed coach." vs "One workspace. Every client connected." Two checklist columns (6 lines each).
3. Programme delivery — block/week/session. Bullet column + programme builder mock with Sarah K. week 6 lower body.
4. Exercise library — 10,000+ exercises. Library mock with filter chips + 8 cards + custom-add CTA, bullet column.
5. **Nutrition — LOCKED, UNCHANGED.** `NutritionSection` reuses Sarah ribbon, three `MealModeCard`s (Manual / Templates / AI-draft highlighted), the "AI should speed up meal planning…" quote and the `ApprovalStrip` emerald-status workflow.
6. Habits & wearables — 4 vendor chips (Apple Health / Garmin / Whoop / Fitbit) + bullets + weekly summary mock with sleep/steps/HR/sessions tiles.
7. Client check-ins — inbox mock (Pending/Replied/Flagged tabs, 5 clients) + bullets. Emerald "Replied" status pill, orange "Flagged" pill.
8. Progress tracking — 4 lens tabs (Strength / Body / Adherence / Photos) + 6-stat sparkline grid.
9. Messaging — bullets + single-thread mock with text, voice and form-reply bubbles. Mic affordance.
10. Client portal view — phone mock + 4 portal tiles + bullets.
11. Coaching notes & client context — profile card with 8-field dl + bullets + 6-event timeline.
12. Accountability & next actions — 5 scenario rows (overdue, low adherence, quiet, milestone, programme ending).
13. Automations — 4 cards + emerald "Set it once, edit before it sends" pull-quote.
14. Templates — 6-tile grid matching PDF (programme, nutrition, onboarding, check-in, automation, message).
15. AI assist — 6 cards + emerald "An assistant, not a substitute" pull-quote with AI drafts → Coach reviews → Coach approves → Client sees output strip.
16. Verified vs Pro — two TierCards (Verified £99/yr, Pro Founding £59/mo) + 13-row capability matrix.
17. Built for every coaching model — 6 use-case cards (PT, online, strength, transformation, small-group, studio teams).
18. MarketingFaq — 6 questions from PDF.
19. FinalCta — "Deliver coaching clients can follow, track and stay engaged with."

## Guardrails

- Pricing is locked at Verified £99/yr, Pro £59/mo Founding (PDF's £90 / £50 was stale).
- "10,000+ exercises" is marketing copy only — current sample library has 30. Acceptable for a mock.
- Coaching is a Pro pillar — no Studio-only or Verified-only positioning anywhere in the page.
- Emerald-only-for-status rule respected: status pills (On track / Replied / Approved) + ApprovalStrip + the two pull-quote panels in Automations + AI assist. Nothing decorative.
- Marketing primitives only (SectionHeader, BlockHeading, MarketingFaq, FinalCta, TierCard, HeroOverlay, MarketingHeroEyebrow). No hand-rolled H2/H3.
- Vertical rhythm + dividers per locked rules (hero pt-24 pb-20 lg:pt-28 lg:pb-24; sections py-20 lg:py-28 + border-b border-reps-border).
- Radii from locked scale (16/18/22/24, full pills, button 10, input 12). No 14/20/28/32.
- No CIMSPA. No UK qualifiers. No booking commission claims.

## Hands-off rule

Never restructure these sections, change the section order, or replace the NutritionSection without an explicit, section-named request from the user.
