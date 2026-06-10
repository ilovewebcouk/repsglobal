## Goal

Replace the current 36-line `FeatureGroupLayout` stub at `/features/growth` with a full pillar page that matches the locked Operations / Visibility / Shop-front pattern, but owns a clearly distinct promise:

**Growth = improve the business you already have** — retention, revenue, reviews, referrals, reactivation, AI growth actions.

Not "get found" (Visibility), not "convert visitors" (Shop Front), not "manage admin" (Operations), not "deliver coaching" (Coaching), not "work faster" (AI).

## Positioning (locked copy)

- **H1:** Grow a stronger fitness business with clearer decisions.
- **Sub:** Use REPs Pro to understand your leads, clients, revenue, reviews, referrals and retention — so you can see what's working and what needs attention.
- **CTAs:** Start using REPs Pro · Explore growth tools
- **Pillar one-liner (used in Verified vs Pro matrix and FAQ):** Improve revenue, retention, reviews, referrals and business performance.

## Page structure (12 sections)

Standalone route (not `PillarPage`), matching the Operations/Visibility shape.

```
1.  Hero                       — H1 + sub + dual CTA + HeroOverlay (copySide="left")
2.  Problem                    — "You cannot improve what you cannot see."
3.  Growth dashboard           — AnnotatedMock of a Growth dashboard mock (centrepiece)
4.  Lead conversion insights   — funnel: enquiries → consults → conversions → drop-off
5.  Retention & client risk    — inactive, missed check-ins, low adherence, renewals
6.  Reviews & referrals        — prompts, milestones, reputation momentum
7.  Packages & revenue         — best-sellers, MRR, one-offs, expiring, value trends
8.  Reactivation & follow-up   — dormant leads, lapsed clients, goal-review nudges
9.  AI growth recommendations  — ranked next actions (links to /features/ai)
10. Growth for different models— 6 cards: PT, online, transformation, strength, small group, studio
11. Verified vs Pro matrix     — TierCard pair; Growth = Pro-only
12. FAQ                        — MarketingFaq, 6 questions
13. FinalCta                   — "Grow with clearer decisions"
```

(12 numbered sections in the brief + FAQ + FinalCta; FAQ is required by the marketing-section-primitives rule.)

## Components to reuse (no new primitives unless noted)

- `HeroOverlay` (LOCKED 5-layer wash)
- `SectionEyebrow`, `SectionHeading`, `SectionHeader`, `BlockHeading`
- `AnnotatedMock` + `Callout` — for the growth dashboard centrepiece
- `TierCard` — Verified vs Pro matrix
- `MarketingFaq`
- `FinalCta`
- `MarketingHeroEyebrow`
- shadcn `Card`, `Badge`, `Separator`, `Tooltip` as needed

## New mock to build inline (no new shared primitive)

A **Growth Dashboard mock** for the AnnotatedMock in section 3, built as a local component in the route file (same approach Operations uses for `/dashboard` and Visibility uses for the profile):

- Top KPI row: MRR · Active clients · New leads (30d) · Conversion rate · Retention · Avg client value
- Left column: "This month's growth actions" — ranked list of 5 AI-suggested moves with impact tags
- Right column: Funnel (Enquiries → Consults → Conversions) + Reviews collected + Referrals requested
- Footer row: Clients at risk (3 chips) · Renewals due (2 chips)

Callouts (4) annotate: ranked actions, churn-risk chip, MRR trend, "request review" prompt.

Mini-mocks for sections 4, 5, 7, 8 are small inline cards (funnel bars, risk list, package table, follow-up queue) — no full AnnotatedMock, keep the page weight similar to Operations.

## Distinctness guardrails (must not drift into other pillars)

| Theme | Belongs to | Growth angle |
|---|---|---|
| Get found / SEO | Visibility | ❌ Do not mention |
| Booking flow / forms / payments mechanics | Operations | Only as "revenue visibility", not as feature |
| Shop-front layout / public profile | Shop Front / Visibility | Only as "improve this section" AI suggestion |
| Programme delivery / check-ins | Coaching | Only as "missed check-ins = churn signal" |
| Chatbot / AI agent | AI | Growth surfaces *recommendations*; AI page owns *how* |

Banned phrases on this page: "marketing", "SEO", "social media", "paid ads", "£10k/month", "get found", "scale to 6 figures".

## Compliance (REPs build-compliance skill)

- Tokens: brand-orange via semantic classes; emerald only for status (verified / on-track / growth-up)
- Radius: cards 16/18, large panels 22, hero 24, buttons 10, inputs 12 — no 14/20/28/32 or `rounded-xl/2xl/3xl`
- Rhythm: hero `pt-24 pb-20 lg:pt-28 lg:pb-24`, sections `py-20 lg:py-28`, alternating `bg-reps-panel/15`–`/30`, no hairline `border-y`
- Headings: `SectionHeading` for H2s, `BlockHeading` for in-block H3s; hero lede 16px, section lede 15–15.5px
- White opacities limited to /45 /55 /70 /80
- No "UK" qualifier; no CIMSPA; no booking-fee language; £ pricing

## Files

**Edit**
- `src/routes/features.growth.tsx` — rebuild from 36 lines → ~900-line pillar page; keeps existing `heroGrowth` asset for `og:image` and as hero background passed into `HeroOverlay`. Update `head()` meta to the new H1/sub.

**Memory (after build)**
- New: `mem://design/locked-growth` — section list, dashboard mock spec, distinctness guardrails
- Update `mem://index.md` Memories list with the new entry

## Out of scope

- No new shared marketing primitive (Growth dashboard mock stays inline; promote later only if reused)
- No changes to `/features/ai`, `/features/operations`, `/features/visibility`, `/features/shop-front`, `/features/coaching`
- No data wiring, no real KPI calculations — Phase 1 static mock only
- No changes to `FeatureGroupLayout` or `feature-config.ts` (the `/features/$slug` overview still links to `/features/growth` as before)

## Acceptance

- `/features/growth` renders all 12 sections + FAQ + FinalCta
- Compliance audit passes (no banned hex, no banned radii, no button shadows)
- Page reads as a *business performance* pillar — a reviewer skimming it cannot confuse it with Visibility, Shop Front, Operations or AI
- H1 is exactly: "Grow a stronger fitness business with clearer decisions."
