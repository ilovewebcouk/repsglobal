---
name: Locked /features/growth
description: Frozen 2026-06-10. 10-section Growth pillar page (business-performance layer): problem → growth dashboard mock → conversion funnel → retention/risk → reviews/referrals → packages/revenue → reactivation queue → AI growth actions → use cases → Verified-vs-Pro matrix → FAQ → FinalCta. Pro-only pillar. H1 locked.
type: design
---

# /features/growth (LOCKED 2026-06-10)

Standalone route (not PillarPage). Mirrors Operations/Visibility/Shop-front shape.

## Locked copy

- **H1:** Grow a stronger fitness business with clearer decisions.
- **Sub:** Use REPs Pro to understand your leads, clients, revenue, reviews, referrals and retention — so you can see what's working, what needs attention, and what to do next.
- **Eyebrow:** Growth · Business performance, not marketing fluff
- **CTAs:** Start using REPs Pro · Explore growth tools

## Section order

1. Hero (HeroOverlay copySide=left, top-anchored copy, 3 trust chips)
2. Problem — "You cannot improve what you cannot see." + "Questions Growth answers" list
3. Growth dashboard centrepiece — inline mock (KPI row × 6, ranked actions panel, funnel, reviews/referrals tiles, at-risk + renewals footer). Uses emerald only for status (renewals/growth-up).
4. Lead conversion insights — funnel bars + bullets
5. Retention & client risk — signals list + sample client queue
6. Reviews & referrals — 6 cards
7. Packages & revenue — package table (clients, MRR, 90-day trend) + 3 KPI tiles
8. Reactivation & follow-up — bullets + follow-up queue
9. AI growth recommendations — 8 cards + link to /features/ai
10. Use cases — 6 cards (PT, online, transformation, strength, small group, studio)
11. Verified vs Pro — TierCard pair + comparison table (Growth = Pro-only)
12. FAQ — MarketingFaq (6 Qs incl. "is this marketing/ads?" and "is it in Verified?")
13. FinalCta — "Grow with better visibility, better follow-up and clearer business decisions."

## Distinctness guardrails (do not drift)

- **Visibility** owns get-found / SEO / directory presence — do NOT repeat
- **Shop Front** owns public profile / services display — do NOT redesign here
- **Operations** owns enquiry/booking/form/payment mechanics — Growth only references them as *signals* and *revenue visibility*
- **Coaching** owns programmes/check-ins — Growth only references them as churn signals
- **AI** owns chatbot/agent mechanics — Growth surfaces *which actions* to take; AI page owns *how*

Banned phrases on this page: "marketing", "SEO", "social media", "paid ads", "£10k/month", "get found", "scale to 6 figures".

## Mock data (illustrative, locked)

- MRR £5,750 +12%, 41 active, 42 leads (30d), 38% conversion, 86% retention, £140 avg client value
- Funnel: 42 → 28 → 16
- Packages: Hybrid 12-wk £2,420 +18% (best seller), 1:1 In-person £1,540 +6%, Online Programming £810 −4%, Group Strength £980 +11%
- At-risk: Megan R., Tom B., Alex P. (+ Hannah F. and Marcus T. in retention section)
- Renewals: James C. (9d), Sarah J. (14d)
- Illustrative footnote required under dashboard.

## Compliance

- All radii on 9-step scale (cards 16/18, large panels 22)
- Emerald only for status (renewals tile, growth-up trends)
- All H2s via SectionHeader; H3 in-block via BlockHeading
- Hero rhythm `pt-24 pb-20 lg:pt-28 lg:pb-24`; sections `py-20 lg:py-28`; alternating panel/15
- No hairline dividers between sections
- Flat buttons (shadow-none)

## Files

- `src/routes/features.growth.tsx` (single route file, ~900 lines)
- Hero asset: `src/assets/hero-growth-bg.jpg.asset.json`

Do not redesign without an explicit, section-named request.
