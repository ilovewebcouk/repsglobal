---
name: Locked /reviews page
description: Frozen 2026-06-11 dark rebuild — /reviews is a trust pillar, dark throughout, score panel anchored in hero, /about-pattern stat strip, no filter bar
type: design
---

# /reviews — LOCKED (2026-06-11)

`/reviews` is a **dark trust pillar**, not a Trustpilot-style aggregator. It sits in the same dark marketing system as `/about` and `/features/*`. Do not flip to light surfaces — that breaks the global `PublicHeader` (header reads as a grey ghost-nav over light heroes).

## Surfaces

- Root: `bg-reps-ink text-reps-text`.
- Hero: `bg-reps-black` + dual radial wash + bottom fade-to-ink. NO HeroOverlay (no photo hero).
- Body: alternating `bg-reps-panel/15` ↔ `bg-reps-panel/30` ↔ plain ink. No hairline section dividers.
- All cards: `bg-reps-panel` + `border-reps-border`.
- FinalCta: shared dark `<FinalCta />` component.

## Section order (10) — do not reorder or add light sections

1. **Hero** — `MarketingHeroEyebrow` ("Reviews on REPs") + H1 "Every review here came from a real booking." + lede + 3 trust chips + dual CTA. **Score panel anchored in hero right column** (`lg:grid-cols-[1.1fr_1fr]`): 4.9 / 5 + stars + emerald "100% verified" status pill + 5-bar rating breakdown. Hero copy uses staggered `animate-fade-in` (80/180/260/340ms, 560–640ms).
2. **Stat strip** — EXACT `/about` pattern: `rounded-[22px] border border-reps-border bg-reps-border gap-px` wrapper, `bg-reps-panel` cells, `font-display 32→40` numbers, `uppercase tracking-[0.14em] text-white/55` labels. Stats: 12,400+ verified reviews · 4.9 avg · 96% would rebook · 100% booking-verified. Rhythm `pt-10 pb-16 lg:pt-12 lg:pb-20`.
3. **Methodology** (`#methodology`) — `bg-reps-panel/15`, 4 numbered cards (Book → Train → Invited → Moderated).
4. **Editor's picks** — 3 `ReviewCard variant="pick"` (orange border + Editor's pick chip).
5. **Browse by specialism** — `bg-reps-panel/30`, 9 tiles `sm:grid-cols-2 lg:grid-cols-3` (PT, Strength, Group ex, Online, Pilates, Yoga, Nutrition, Gyms & Studios, Training Providers).
6. **Full feed** — sort-only pill row ("Most recent / Highest rated / Most helpful"). NO rating filter, NO search input, NO breadcrumb. 4 cards in `lg:grid-cols-2` + Load more.
7. **Why pros choose to be reviewed on REPs** — `bg-reps-panel/15`, 3 pro-positive cards + soft CTA → `/for-professionals`. Replaces the old anti-pattern "we don't hide bad reviews" section — never reintroduce that framing.
8. **Trust mechanics** — 4 commitments (verified-only · moderated for legality not sentiment · public right of reply · transparent reporting).
9. **FAQ** — `MarketingFaq` primitive, 5 Qs.
10. **FinalCta** — shared component.

## Primitives (must use)

- `MarketingHeroEyebrow` / `SectionHeader` / `SectionHeading` / `SectionEyebrow` / `MarketingFaq` / `FinalCta`.
- Never hand-roll section headers or hero eyebrows on this page.

## Constraints

- **No light surfaces anywhere on /reviews.** No `bg-reps-warm-white`, `bg-reps-ivory`, `text-reps-charcoal`, `border-reps-stone`.
- **Header is default `PublicHeader`** — no `variant="solid"` overrides.
- **Score panel must stay in the hero** — never split into a separate row below the stat strip.
- **No breadcrumb.** No fake search input. No rating-filter pill row.
- **Phase 1 honesty:** sort dropdown is decorative; no working sort, search, real counts, or AI summaries.
- 14px radius exception applies only to the pro thumbnail in `ReviewCard` (matches enquire-page pattern).
- Vertical rhythm: hero `pt-24 pb-20 lg:pt-28 lg:pb-24`; sections `py-20 lg:py-28`; stat strip uses the locked proof-strip rhythm `pt-10 pb-16 lg:pt-12 lg:pb-20`.

## Out of scope (Phase 1)

Real review data, working sort/search, per-profession real counts, response moderation backend, AI summaries, auth, DB, payments.
