---
name: Locked /features/coaching
description: 15-section coaching pillar page — bespoke route, threads "Sarah K." client story across programme/nutrition/check-ins/progress, AI-trainer-approved rule, safety scope. Frozen 2026-06-10.
type: design
---

# `/features/coaching` — LOCKED 2026-06-10

Bespoke pillar route at `src/routes/features.coaching.tsx`. Replaces the prior generic `FeatureGroupLayout` stub. Sits alongside the other locked pillars (`operations`, `visibility`, `shop-front`) and follows the same architecture, primitives, type scale, vertical rhythm, dividers and hero-overlay system.

## Final section order (do not reorder without explicit request)

1. **Hero** — image (`hero-coaching-bg.jpg`), `HeroOverlay copySide="left"`, H1 "Deliver better coaching from one connected platform.", trust-chip row (Pro-tier coaches · Training+nutrition+check-ins · One client record)
2. **Problem** — fragmented delivery, 5 scattered-tool tiles + orange pull-line panel
3. **Workflow** (`#workflow`) — 7-stage pipeline: Assess → Plan → Deliver → Check in → Track → Adjust → Retain (mirrors Operations' 6-stage pattern)
4. **Programme delivery + exercise library** — bespoke side-by-side mock (programme card + library card) using `src/data/exercise-library.sample.json`; "+ Add custom exercise" CTA mandatory
5. **Meal planning + nutrition support** — 3-mode triad (Manual / Templates / AI-assisted draft = highlighted) + approval ribbon with emerald "Trainer approves" badge
6. **Client portal** — phone-frame mock + numbered callouts list (6 callouts)
7. **Check-ins + accountability** — check-in review mock + pull-quote *"Check-ins turn a plan into a coaching relationship."*
8. **Progress tracking** — 6-stat grid with sparklines; cautious copy line *"REPs reports adherence and trend — it doesn't promise transformations."*
9. **Coaching notes + client context** — profile-card + 6-event client timeline
10. **AI coaching support** — 8-tile grid + emerald rule panel **"AI drafts. The trainer reviews. The trainer approves."**
11. **Templates + repeatable systems** — 8-template grid
12. **Verified vs Pro** — `TierCard` pair (Pro highlighted)
13. **Use cases** — 6 cards (PT / online / strength / transformation / small group / studio)
14. **Safety + scope** — two-column: "REPs is not a replacement for" vs "What the platform asks the coach to handle"
15. **MarketingFaq** → **FinalCta** (heading "Deliver coaching clients can follow," + accent "track and stay engaged with.")

## Threaded client story

Sections 4, 5, 7, 8 lead with a `SarahRibbon` chip:
> Following **Sarah K.** · 12-week fat-loss client · 3×/week · 145g protein target

Every adherence number, programme name, meal note and check-in entry on the page references Sarah for continuity. Do not introduce a second named client.

## Data dependencies

- `src/data/exercise-library.sample.json` — 30 hand-curated exercises, AscendAPI-compatible shape. Static, Phase 1 only. **No runtime AscendAPI / RapidAPI call** — if a Phase-2 live integration is added later, route via a server function with a runtime secret; never inline keys.

## Primitives used (no new shared primitives)

`HeroOverlay`, `SectionHeader`, `SectionHeading`, `BlockHeading`, `MarketingHeroEyebrow`, `TierCard`, `MarketingFaq`, `FinalCta`, `PublicHeader`, `PublicFooter`.

## Local-only sub-components (inside the route file)

`Hero`, `ProblemSection`, `WorkflowSection`, `SarahRibbon`, `ProgrammeSection`, `NutritionSection` + `MealModeCard` + `ApprovalStrip`, `PortalSection` + `PortalTile`, `CheckinsSection`, `ProgressSection`, `NotesSection`, `AISection`, `TemplatesSection`, `TierMatrixSection`, `UseCasesSection`, `SafetySection`.

## Style guardrails (must hold)

- Vertical rhythm: hero `pt-24 pb-20 lg:pt-28 lg:pb-24`; every other section `py-20 lg:py-28`
- Every non-hero section: `border-b border-reps-border` (no `/60`, no `border-t`)
- All H2s via `SectionHeader` → `SectionHeading` (pure white, no orange split)
- Pull-quote H2s use `font-display text-[Npx]` ONLY in pull-quote panels (not section headers)
- Emerald (`border-emerald-400/30 bg-emerald-500/15 text-emerald-300`) used ONLY on: "Trainer approves" badge in the approval ribbon (sections 5 + AI rule panel) and "On track" check-in badge. Status only.
- Radii: cards 16/18, panels 22, hero 24, buttons 10, inputs/tiles 12-14. No 20/28/32 or `rounded-xl/2xl/3xl`.

## Pricing / tier copy (locked)

- Verified: £99 / yr
- Pro: Founding £59 / mo (includes Verified)
- Coaching delivery = Pro+Studio only. Never offered on Verified.
- Never repeat pricing elsewhere on the page; canonical pricing lives on `/pricing`.

## Out of scope (do not add without explicit request)

- Real programme/meal/AI/portal logic — visuals only
- Runtime AscendAPI call
- Replays from `/dashboard` or `/c/$slug` (this page uses bespoke mocks, not live AnnotatedMock)
- Pricing tables (live on `/pricing`)
- Transformation claims, before/after photos, weight-loss promises
- CIMSPA, third-party awarding-body names, UK qualifiers, booking-fee / 15% language

## Lock conditions

Do not redesign, reorder sections, change H1, swap hero image, or remove Sarah threading without an explicit, section-named request from the user.
