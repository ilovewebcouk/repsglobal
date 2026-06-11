---
name: Locked /reviews
description: /reviews public consumer-landing page, frozen 2026-06-11. Dark hero, light alternating body, pro-positive proof block (no critical-feedback showcase), shared FinalCta.
type: design
---

# Locked /reviews (Phase 1)

Frozen 2026-06-11. Public consumer-landing page. Migrated from fully-dark
pillar styling to the homepage theme pattern (dark hero → alternating
warm-white/ivory body → dark FinalCta). One file: `src/routes/reviews.tsx`.

## Classification

`/reviews` is a **public consumer-landing page**, not a `/features/*` pillar.
It follows the homepage (`src/routes/index.tsx`) theme pattern, not the
`/features/*` or `/about` dark-everywhere pattern.

## Section order (FINAL)

1. **Hero** — `bg-reps-black`, `pt-24 pb-20 lg:pt-28 lg:pb-24`, MarketingHeroEyebrow.
   H1: "Reviews you can trust — for every fitness pro." (orange split on
   second clause). Search bar + 3 trust chips. **No breadcrumb. Ever.**
2. **Headline rating + stat strip** — `bg-reps-warm-white`. Two-column
   `lg:grid-cols-[1fr_1fr]`: left = 4.9 rating panel with breakdown bars on
   `bg-reps-ivory`; right = STATS in homepage stat-strip pattern
   (`grid-cols-2 gap-px overflow-hidden rounded-[22px] border border-reps-stone
   bg-reps-stone` with `bg-reps-ivory` cells, `font-display 26 → 32 → 40px`,
   uppercase `tracking-wider` labels).
3. **Methodology** — `bg-reps-ivory`. 4 steps (Book / Train / Invite /
   Moderate) in `bg-reps-warm-white` cards.
4. **Editor's picks** — `bg-reps-warm-white`. 3 ReviewCard `variant="pick"`.
5. **Browse by specialism** — `bg-reps-ivory`. 9 tiles in
   `sm:grid-cols-2 lg:grid-cols-3`: Personal Training, Strength Coaching,
   Group Exercise, Online Coaching, Pilates, Yoga, Nutrition, Gyms & Studios,
   Training Providers.
6. **Full feed** — `bg-reps-warm-white`. Sort options only (Most recent /
   Highest rated / Most helpful). **No "4★ and under" filter.**
7. **Why pros choose to be reviewed on REPs** — `bg-reps-ivory`. 3 cards
   aimed at the pro reader (real clients only / right of reply / reviews
   follow you across REPs). Orange CTA → /for-professionals.
   **This section REPLACES the deleted "We don't hide critical feedback"
   block. Do not reintroduce a critical-reviews showcase on this page —
   it's a public-facing sales surface for pros as much as clients.**
8. **Trust mechanics** — `bg-reps-warm-white`. 4 cards: verified-only,
   moderated for legality (not sentiment), pros respond publicly,
   transparent reporting.
9. **FAQ** — `bg-reps-ivory`. Hand-rolled `Accordion` in light tokens
   (`text-reps-charcoal` triggers, `text-reps-muted-light` content,
   `border-reps-stone`). 5 questions only.
10. **FinalCta** — shared `<FinalCta />` component (its own dark panel).
    Primary "Find a professional", secondary "List your business".

## Surface token map

| Surface          | Background          | Card / inset       | Border        | Text                     |
| ---------------- | ------------------- | ------------------ | ------------- | ------------------------ |
| Hero             | `bg-reps-black`     | `bg-white/[0.04]`  | `border-white/10` | white + `/55` `/70` `/80` |
| Section A (warm) | `bg-reps-warm-white`| `bg-reps-ivory`    | `border-reps-stone` | `text-reps-charcoal` / `text-reps-muted-light` |
| Section B (ivory)| `bg-reps-ivory`     | `bg-reps-warm-white`| `border-reps-stone` | same |
| FinalCta         | dark, owned by component | — | — | white |

## Radius map (locked scale)

- Buttons → `rounded-[10px]`
- Search input wrapper / inner inputs → `rounded-[12px]`
- ReviewCard / methodology / why-pros / specialism tile / trust card → `rounded-[18px]`
- Rating panel + stat-strip outer + hero search shell → `rounded-[22px]`
- Pro thumbnail in ReviewCard → `rounded-[14px]` (locked exception for
  scaled-down profile photos, same as enquire summary card).

## Type scale (page-local)

Section H2 = `font-display text-[30px] lg:text-[40px]` in
`text-reps-charcoal`. Eyebrow = `text-[12px] uppercase tracking-wider
text-reps-orange` (homepage-style; NOT the marketing-primitive eyebrow,
because the marketing primitives are dark-only). H1 = `text-[40px] →
sm:[52px] → lg:[64px]` in white.

## Why we DON'T use the marketing primitives here

`SectionEyebrow`, `SectionHeading`, `SectionHeader`, `MarketingFaq` are all
baked for dark surfaces (`text-white`, `bg-reps-ink`). `/reviews` is a
light-body page following the homepage pattern, which itself opts out of
the primitives. Mirroring the homepage's hand-rolled section headings is
correct here. The primitive-must rule applies to dark `/features/*` and
brand-pillar pages.

## Data shape (Phase 1 placeholder — unchanged contract)

- `EDITOR_PICKS: Review[3]` (above-the-fold trio)
- `REVIEWS: Review[]` (full feed; do NOT spread EDITOR_PICKS into it again)
- `STATS: { v, k }[4]`, `RATING_BREAKDOWN`, `METHODOLOGY`, `PROFESSION_TILES`,
  `SORT_OPTIONS`, `WHY_PROS`, `TRUST_MECHANICS`, `FAQ_ITEMS`.
- No `CRITICAL_REVIEWS` array. Deleted. Do not re-add.
- ReviewCard variants: `"default" | "pick"`. The old `"critical"` variant
  and any `response` field on the Review type were intentionally removed.

## Out of scope (Phase 1)

Real review data, functional sort/search, pro-response moderation backend,
per-profession real counts, auth, DB, payments.

## Compliance

`bash knowledge://skill/reps-build-compliance/scripts/audit.sh` — expected
exception: `src/routes/reviews.tsx:799 rounded-[14px]` on pro thumbnail
(allowed under the radius memory). No other violations.
