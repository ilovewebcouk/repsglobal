# /for-professionals → 10/10

The current page is information-complete but visually monotonous: 13 identical 50/50 blocks, iframed dashboard routes used as marketing screenshots, no sticky navigation, no pricing on page, and two testimonial sections doing the same job. This plan fixes the six things blocking 10/10 — *without* touching the homepage, shop-front, profile, city, enquire or coach-shop-front locks, and without rewriting the underlying brand, tokens or copy voice.

## Locked taste (no design ritual)

We keep the existing locked design system from the source-of-truth memory: dark ink background, brand orange accent, REPs radius scale, display + body type pairing, 1320px max. This is structural, not a redesign — so we skip the palette/type/layout ritual.

## Section-by-section overhaul

### 1. New `<PillarSubnav />` — sticky on scroll

Pinned bar under the global header. Six chips: **Visibility · Shop-front · Operations · Coaching · REPs AI · Growth**. Active chip highlights based on scroll position (`IntersectionObserver` on the six pillar section ids). Hidden until the user has scrolled past the hero (`scrollY > 720`), hides again over the footer. Mobile: horizontal scroll strip.

Anchors: `#visibility`, `#shop-front`, `#operations`, `#coaching`, `#ai`, `#growth`.

### 2. Replace the six-pillar grid (Act 2) with a denser visual map

Same six cards, but: a **2-column hero-pair** at the top (Visibility + Shop-front, both with a thumbnail strip), then four equal cards below. Each card gets a tiny stat ("5 features inside", "Pro+Studio", "Included on every tier"). The Act 2 intro stays as the map — but now visually anchors the rest of the page instead of being a generic grid.

### 3. **Operations → one bento section** (replaces 5 stacked 50/50s)

New `<OperationsBento />`:

```
┌─────────────────────────────┬─────────────────┐
│ LEADS (tall, hero tile)     │ BOOKINGS        │
│  pipeline mockup + AI score │  calendar mock  │
│                             ├─────────────────┤
│                             │ PAYMENTS        │
│                             │  MRR card mock  │
├──────────────┬──────────────┴─────────────────┤
│ CLIENTS CRM  │ MESSAGES                       │
│  record card │  inbox preview                 │
└──────────────┴────────────────────────────────┘
```

5 tiles, mixed sizes, each ~280–500px tall, all clickable → `/features/operations`. One pillar opener above ("Operations — the practice runs itself."). One CTA below ("Explore Operations →"). Visual cohesion replaces 5× scroll fatigue.

### 4. **Coaching → split-scroll panel** (replaces 3 stacked 50/50s + adds Nutrition)

New `<CoachingScrollPanel />`: sticky 60/40 layout. Left = sticky device mockup that **swaps** as the user scrolls. Right = 4 stacked copy blocks (Programmes / Check-ins / Nutrition / Client portal). Active block highlights its bullet list and updates the sticky mockup via `IntersectionObserver`. Mobile falls back to 4 stacked cards.

Adds **Nutrition** which is currently missing from the page (it exists on `/features/coaching` and AI). Resolves the pillar-grid card lie.

### 5. Move Client Record back to Coaching (where the pillar grid promised it)

Out of Operations bento, into the Coaching split-scroll as a fifth block. Operations bento becomes 4 tiles (Leads tall hero, Bookings, Payments, Messages). Aligns with the pillar grid copy.

### 6. AI section: keep, but make it *the* moment

Keep `AiCommandCentreMock`. Replace the 6 static AI capability cards with a **single hovering "Next Move" card mock** (left) + a 3-row "this week REPs noticed…" feed (right) that scrolls/animates. Move the 6 AI capabilities into a compact horizontal carousel below — less card-soup, more product demo.

### 7. New `<PricingSnapshot />` strip — above the Final CTA

3 tier cards in one strip, same data as `pricing-data.ts`. Verified £99/yr · Pro £59/mo (founding) · Studio £149/mo. Each shows 3 "best included" bullets and a link to `/pricing`. Phase-1 rule respected: no checkout, just a snapshot.

### 8. Final CTA rewrite

Founding-price urgency frame. Replace "Join the verified register" duplicate hero copy with:
- Eyebrow: "Founding Pro pricing — locked for life"
- Headline: "£59/month, forever. Before public launch."
- One testimonial quote inline (lift from `TestimonialTriad`).
- Two CTAs: Join REPs (primary) · See pricing (ghost).
- Drop the "Compare platforms" third button (already in the page above).

### 9. Cut one testimonial section

Keep `<TestimonialFeature />` (single hero quote, between Operations and Coaching). Drop `<TestimonialTriad />` from inside `ReplacedStackBoard` section — that section already does the "we replace your stack" job; doubling up with three more headshots is filler.

### 10. Mockup quality pass

The iframed `/dashboard/*` and `/portal/today` routes look thin in laptop frames. For the new bento/scroll-panel/AI moment, build **small bespoke React mock components** (the same approach as `AiCommandCentreMock`, `PlatformMockups`, `HeroDeviceCluster`):

- `OpsLeadsMock`, `OpsBookingsMock`, `OpsPaymentsMock`, `OpsClientsMock`, `OpsMessagesMock` — 5 small composed UI cards (already partly exist in `PlatformMockups.tsx`, will extend).
- `CoachProgrammeMock`, `CoachCheckinsMock`, `CoachNutritionMock`, `CoachPortalMock` — 4 sticky-scroll devices.
- `AiNextMoveCard`, `AiNoticedFeed` — for the AI moment.

No image generation, no external assets. Everything stays in-component, on-token, dark-mode native.

## Final section order

1. Hero (unchanged)
2. PressMarquee
3. **PillarSubnav (sticky, appears on scroll)**
4. Act 1 · Register
5. Pillar 1 · Visibility (single 50/50 — unchanged)
6. Act 2 · Six-pillar map (denser)
7. Pillar 2 · Shop-front (single 50/50 — unchanged)
8. **Pillar 3 · Operations — bento (4 tiles)**
9. TestimonialFeature
10. **Pillar 4 · Coaching — split-scroll panel (5 blocks: Programmes, Check-ins, Nutrition, Client record, Client portal)**
11. ComparisonStrip
12. ReplacedStackBoard *(TestimonialTriad cut)*
13. UseCaseTriad
14. **Pillar 5 · REPs AI — Command Centre + Next Move card + noticed feed + compact carousel**
15. Pillar 6 · Growth (single 50/50 — unchanged)
16. WeekWithReps
17. **PricingSnapshot strip**
18. FAQ
19. **Final CTA — founding-price moment**

Section count drops from 22 to 19; visual layouts drop from 1 (50/50) to ~6 distinct shapes. Scannability and pacing go up. Bandwidth goes down.

## Out of scope (Phase 1 guard)

- No auth, DB, payments, AI, BD migration logic.
- No homepage / profile / city / enquire / coach-shopfront / professions changes.
- No new routes, no new tokens, no image generation.
- `PillarTabs.tsx` stays in repo (unused) — don't delete in case it's wanted later.

## Open questions

1. **Sticky sub-nav under header** — confirm. Some pages don't want it; this one needs it.
2. **Drop `TestimonialTriad`?** It's 3 more testimonials. I think yes (we keep `TestimonialFeature`). Confirm.
3. **Build bespoke React mocks vs. screenshot the actual dashboard routes** — I'm proposing bespoke React mocks because they read tighter at marketing scale. Confirm or push back.
