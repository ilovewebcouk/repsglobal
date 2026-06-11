---
name: Locked /reviews
description: /reviews homepage-style mixed-theme rebuild — dark image-led hero, light editorial body, dark Why-Pros inset, dark close. Do not redesign without explicit section-named request.
type: design
---

# Locked: /reviews

**Frozen 2026-06-11.** Replaces all earlier reviews-page directions.

`/reviews` is a hybrid consumer-trust + pro-acquisition hub. It follows the
**homepage mixed pattern** (dark hero → light editorial body → dark close),
NOT the all-dark `/about` brand-pillar pattern and NOT the all-dark
`/features/*` pillar pattern.

## Section order (10)

1. **HERO** — dark, full-bleed editorial photo + `<HeroOverlay copySide="left" />`. Left: eyebrow, H1 "Every review here came from a real booking.", 16px lede, 3 trust chips, primary CTA + ghost. Right: single floating "verified review" card (initials, 5 stars, title, quote, programme, verified pill). **No rating-dashboard / bars panel.**
2. **TRUST RAIL** — dark `bg-reps-ink`, tight `pt-10 pb-16 lg:pt-12 lg:pb-20`. The `/about`-pattern 4-cell `rounded-[22px]` panel: 12,400+ / 4.9 / 96% / 100%. **Only stat moment on the page.**
3. **EDITORIAL FEATURE REVIEW** — `bg-reps-ivory`, 50/50, large portrait (rounded-[22px], aspect 4/5) + display-type pull-quote with Quote icon, stars, attribution, CTA to shop-front.
4. **METHODOLOGY** — `bg-reps-warm-white`, 4 numbered (01-04) cards on ivory.
5. **EDITOR'S PICKS** — `bg-reps-ivory`, 3 `ReviewCard variant="pick"` (orange-border, larger body).
6. **BROWSE BY SPECIALISM** — `bg-reps-warm-white`, 9 tiles `sm:2 lg:3`, ivory surface, orange chevron on hover.
7. **THE FEED** — `bg-reps-ivory`, sort pills only (no filters/search), 2-col `ReviewCard`, ghost "Load more".
8. **WHY PROS** — outer `bg-reps-ivory` wrapping a dark `rounded-[24px]` inset (`bg-reps-ink` + orange radial glow). 3 cards on `bg-reps-panel`. The single dark moment in the light body.
9. **FAQ** — `<MarketingFaq tone="light" />` (new prop) on warm-white.
10. **FINAL CTA + footer** — shared `<FinalCta />`.

## Header

`<PublicHeader variant="transparent" />` (matches homepage). Transparent over
the dark hero, solid-dark on scroll. **Never** `variant="solid"` on this page
— it produces the grey-ghost-nav effect over the light body.

## Surface tokens (no hardcoded hex)

| Role | Token |
| --- | --- |
| Page wrapper | `bg-reps-ivory` |
| Light section A | `bg-reps-ivory` |
| Light section B | `bg-reps-warm-white` |
| Light card | `bg-reps-warm-white` / `bg-reps-ivory` |
| Light border | `border-reps-stone` |
| Light body text | `text-reps-muted-light` |
| Light headings | `text-reps-ink` (via `SectionHeading className="text-reps-ink"`) |
| Dark hero / trust rail / Why-Pros inset / FinalCta | `bg-reps-black` / `bg-reps-ink` / `bg-reps-panel` |
| Status verified | emerald token triplet (light variant uses `text-emerald-700`) |

## Radius map (locked global scale)

Hero card 22, trust-rail panel 22, light section cards 18, pro-footer thumb
12 (rounded-full also acceptable for ≤10px thumbs), buttons 10, sort pills
full. No 14/20/28/32, no `rounded-xl/2xl/3xl`.

## Shared primitives used

- `MarketingHeroEyebrow`, `SectionEyebrow`, `SectionHeading` (with
  `className="text-reps-ink"` override on light sections),
  `<HeroOverlay copySide="left" />`, `<MarketingFaq tone="light" />`,
  `<FinalCta />`, `<PublicHeader variant="transparent" />`, `<PublicFooter />`.

## Out of scope (Phase 1)

Real review data, working sort, search, profession counts, per-profession
averages, response moderation backend, auth, payments, AI summaries.

## File

`src/routes/reviews.tsx` (rebuilt 2026-06-11). `MarketingFaq` gained a
`tone?: "dark" | "light"` prop in the same pass.
