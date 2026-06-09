---
name: Locked /features/coaching
description: Frozen 2026-06-09. 12-section Coaching Delivery pillar page — programmes, check-ins, progress, client view, notes, accountability, templates. Pro pillar. Do not redesign without explicit section-named request.
type: design
---

# Locked /features/coaching

Frozen 2026-06-09. The Coaching pillar page is the canonical statement of what REPs Pro delivers **after** a client signs on. Narrow scope: programme delivery, check-ins, progress, client view, notes, accountability, templates. NOT visibility, NOT shop-front, NOT operations admin, NOT a workout-builder, NOT nutrition, NOT AI hype.

## Hard scope rules (do not violate)

- **NOT a profile / SEO / discovery page** → that's `/features/visibility`.
- **NOT a shop-front / enquire-book-pay page** → that's `/features/shop-front`.
- **NOT admin / pipeline / payments / forms** → that's `/features/operations`.
- **NOT an AI pillar page** — AI gets a single one-card callout, not a section. Full AI story lives at `/features/ai`.
- **NOT a nutrition app** — nutrition appears only as one optional bullet inside check-ins.
- **NOT a generic workout builder** — frame as professional programme delivery.

The page owns one sentence: **"Deliver better coaching from one connected platform."**

## Section order (LOCKED)

1. Hero — `HeroOverlay copySide="left"`, hero image right (`hero-coaching-bg`), H1 `Deliver better coaching from one connected platform.`, dual CTA, 3 trust chips.
2. Problem — split card (scattered vs organised) with 4 fragmentation chips and 6 organised lines. Close line: *"Operations gets the client organised. Coaching helps you deliver the result."*
3. Programme delivery — `CoachingDashboardMock` + bullets. Anchor: *"Build structured coaching plans clients can actually follow."*
4. Client check-ins — static check-in card (mock) + bullets. Anchor: *"Check-ins turn coaching from a programme into a relationship."*
5. Progress tracking — 4-card grid (measurements / strength / adherence / milestones). Anchor: *"Clients stay engaged when they can see progress, not just feel it."*
6. Client view — `ClientPortalMock` + bullets. Framed as **browser portal via magic link**, not a native app.
7. Coaching notes & client context — bullets + `ClientRecordMock`. Anchor: *"Coach with context, not guesswork."*
8. Accountability — 8 alert chips + summary card. Anchor: *"The best coaching systems show you who needs support before they disappear."*
9. Templates — 6-tile grid. Anchor: *"Create a repeatable coaching standard without making every client feel generic."*
10. AI callout — inline card with link to `/features/ai`. NOT a full section.
11. Verified vs Pro — `TierCard` × 2 + 10-row comparison matrix. Verified row is intentionally all empty except final "verified profile" row.
12. Use cases — 6-card grid (PT, online, strength, transformation, small-group, studio team).
13. FAQ — `MarketingFaq` × 6.
14. `FinalCta` — *"Deliver coaching clients can follow, track and stay engaged with."*

## Components

- New: `src/components/marketing/CoachingMocks.tsx` exporting `CoachingDashboardMock`, `ClientPortalMock`, `ClientRecordMock` — pure static JSX inside `LaptopFrame` + `MockupStage`. No iframes (the live routes don't exist yet). Replace with `AnnotatedMock` + real routes when the product ships them.
- Reuses: `HeroOverlay`, `MarketingHeroEyebrow`, `SectionHeader`, `BlockHeading`, `TierCard`, `MarketingFaq`, `FinalCta`.
- Does NOT use `FeatureGroupLayout` — route is standalone like `/features/operations`.

## Tier positioning

Coaching is a **Pro** pillar. Verified is genuinely excluded from coaching delivery (Verified = profile + reviews only). The Verified column in the matrix is empty except the final "verified public profile" row.

## What NOT to add later without an explicit, section-named request

- Nutrition section / macro tracker
- Progress photo gallery
- Native mobile app claim
- AI section (the one-card callout is the cap)
- Marketing growth angle
- Workout-builder framing
- "Guaranteed results" / transformation promises
