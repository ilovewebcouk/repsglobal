# /reviews — world-class rebuild plan

## Brutal honest truth

No, the current page is not 10/10. Three real problems:

1. **Theme mismatch + ghost nav.** We flipped the page to light (`bg-reps-warm-white`) while the global `PublicHeader` is built for dark surfaces. On a light hero the header reads as a grey strip with no contrast — it looks broken, not intentional. Every other top-level marketing page (`/about`, `/for-professionals`, `/features/*`, `/specialisms`, `/cpd`) sits on a **dark hero into dark body** with subtle `bg-reps-panel/15–/30` tinting for rhythm. `/` is the exception because it's the consumer landing page. `/reviews` is a **trust / proof pillar**, not a consumer landing — it belongs in the dark marketing system.
2. **"Headline rating block" got orphaned.** The 4.9 + bars panel now sits in its own row beneath the stat strip, floating, with no relationship to anything around it. World-class review pages anchor the score *inside* the hero so the number is the hero.
3. **It's still structured like Trustpilot.** Score → stats → methodology → feed. That's a review *aggregator*. REPs is not an aggregator — we're the register the reviews live on. The page should feel like a **trust pillar for the whole platform**, not a public leaderboard.

## What world-class looks like (reference register)

Stripe Trust Center, Linear Changelog, Vercel Security, Notion Customers — dark, editorial, opinionated, proof-led. One big idea per section. No filter bars pretending to be a product.

## New structure (dark, REPs-native)

```text
1. Hero (dark, bg-reps-black)
   ├─ MarketingHeroEyebrow: "Reviews on REPs"
   ├─ H1: "Every review here came from a real booking."
   ├─ Lede (16px): one sentence on verified-only + right of reply
   ├─ Trust chips: Verified bookings · Moderated for legality · Pro right of reply
   └─ FLOATING SCORE CARD (right column, lg+):
        4.9 ★★★★★  ·  12,400+ verified reviews
        5★ ████████ 84%
        4★ ███      11%
        3★ ▌         3%
        2★ ▌         1%
        1★ ▌         1%
        → score lives IN the hero, not below it

2. Stat strip (dark, /about pattern — single rounded-[22px] panel, gap-px)
   12,400 reviews · 4.9 avg · 96% would book again · 100% verified booking
   (Standardised to match /about exactly. No second variant.)

3. "How a review gets on REPs" (4-step rail, dark)
   Book → Train → Invited (only after booking confirmed) → Published
   Each step a small card. Methodology, not a sales line.

4. Editor's picks (3 cards, dark)
   Story-led — name + transformation + 1 pull-quote. Not generic stars.

5. Browse reviews by what you're looking for (8 tiles, dark)
   PT · Online coach · Group ex · Strength · Nutritionist · Yoga · Pilates
   · Gyms & Studios · Training providers (9 tiles, sm:2 / lg:3 / xl:5 mosaic)

6. Live feed (dark, no filter bar pretending to work)
   Two-column masonry, 8 reviews. Sort dropdown only (Most recent / Highest /
   Most helpful) — no rating filter, no search input. Phase 1 = static.

7. "Why pros choose to be reviewed on REPs" (3 cards, dark — pro-positive)
   ├─ Real clients only — no anonymous trolls
   ├─ You own the response — public right of reply
   └─ Reviews follow you across REPs (profile, shop-front, search, city pages)
   Soft CTA → /for-professionals

8. Trust mechanics (4 commitments, dark)
   Verified-booking gating · Moderated for legality/abuse/spam (not sentiment)
   · Right of reply · Reviews can't be bought, removed, or reordered for money

9. FAQ (MarketingFaq primitive, dark) — 5 Qs
10. FinalCta (shared dark component) — two CTAs (find a pro / list your business)
```

## Why this is 10/10 and the current page isn't

- **One visual system.** Dark throughout = the header sits on a dark hero like every other marketing page. No more grey ghost-nav.
- **Score is the hero, not a footnote.** The 4.9 + bars panel is anchored in the hero column, where world-class trust pages put it.
- **Stat strip standardised.** Identical pattern to `/about` — only one stat-strip in the whole product.
- **Pro-positive, not pillory.** "Why pros choose to be reviewed on REPs" replaces the old "we don't hide bad reviews" sales-anti-pattern.
- **No fake interactivity.** Phase 1 honesty — sort dropdown only, no filter bar, no fake search.
- **REPs-native.** Score → method → editor picks → browse by profession → feed → pro proof → mechanics → FAQ. Feels like REPs, not Trustpilot.

## Out of scope (Phase 1)

Real review data, working sort, search, profession counts, auth, DB, payments, AI summaries, per-profession averages, response moderation backend.

## Technical notes

- File: `src/routes/reviews.tsx` only.
- Surfaces: `bg-reps-black` hero → `bg-reps-panel/15` and `/30` alternating body → dark FinalCta. Drop all `bg-reps-warm-white`, `bg-reps-ivory`, `text-reps-charcoal`.
- Header stays default dark `PublicHeader` — no overrides.
- Stat strip = exact `/about` pattern (`rounded-[22px] border border-reps-border bg-reps-border gap-px`, `font-display 32→40`, `uppercase tracking-[0.14em] text-white/55`).
- Headline rating panel lives in hero right column at `lg:` with grid `lg:grid-cols-[1.1fr,1fr]`.
- Type: `SectionEyebrow` / `SectionHeading` / `SectionHeader` everywhere. Hero lede 16px, section lede 15–15.5px.
- Radius: hero 24, panels 22, cards 18, buttons 10, inputs 12 — no `rounded-xl/2xl/3xl`, no 14/20/28/32.
- Vertical rhythm: hero `pt-24 pb-20 lg:pt-28 lg:pb-24`; sections `py-20 lg:py-28`.
- Use `HeroOverlay copySide="left"` (locked primitive) for the hero wash.
- Use shared `<FinalCta />` — don't rebuild.
- No breadcrumb. No filter pill row. No light surfaces anywhere.
- Update `mem://design/locked-reviews` to reflect the dark rebuild and freeze.

## Audit expectations

`audit.sh` exits 0. Standard 14px pro-thumbnail exception only if a downscaled pro photo appears in editor picks (otherwise no exceptions).

## What I need from you before I build

Confirm:
1. Dark-system rebuild (yes / tweak).
2. Score panel anchored in hero (yes / keep as separate row).
3. Drop the filter bar entirely, keep only a sort dropdown (yes / keep filters).