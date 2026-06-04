## Honest read of what's there today

**Trust strip (4 items, just under the hero):**
- Four icon + label pairs in a flat 4-up grid
- Generic phrasing: "Verified register heritage", "Built for fitness pros", "Reviews on the public record", "Bookings, payments, coaching in one"
- Visually thin: 12.5px muted text, no hierarchy, sits in a strip that competes with the press strip directly below it

**Press strip ("As featured in"):**
- Six monochrome logos at 70% opacity, label on the left
- Logos are inverted SVGs at ~20–24px — small, weightless, no anchoring
- Lives in its own bordered band immediately below the trust strip, so the eye crosses two near-identical horizontal bars before reaching Act 1

**Why it's not world-class yet:**
1. **Redundancy.** Two stacked horizontal "proof bars" doing the same job (trust → press) flatten each other. Stripe, Linear, Vercel, Whoop never stack two proof bars.
2. **Soft claims.** "Verified register heritage" and "Built for fitness pros" are abstract — they describe the brand, not what the pro gets. There's nothing concrete (years, count, scale) because we deliberately stripped quantitative claims in the copy QA.
3. **Weak logo treatment.** Inverted/desaturated logos at 70% opacity read as decoration, not endorsement. No "16 years on the register" anchor, no quote, no link to a press page.
4. **No visual rhythm.** Both bands use the same dark surface + thin border — the reader gets no payoff for scanning them.

## The plan

Collapse the two strips into **one premium proof band** sitting directly under the hero, with three deliberate moves:

**1. One band, three zones (left → right):**

```text
┌──────────────────────────────────────────────────────────────────────┐
│  THE UK'S          │  ✓ Verified register      │  AS FEATURED IN     │
│  VERIFIED          │  ✓ Reviews on the         │  [Times] [BBC]      │
│  FITNESS           │    public record          │  [Men's Health]     │
│  REGISTER          │  ✓ Built for fitness pros │  [GQ] [Runner's W.] │
│  SINCE 2009        │  ✓ One platform, no       │  [Women's Fitness]  │
│                    │    bolt-ons               │                     │
└──────────────────────────────────────────────────────────────────────┘
```

- **Left anchor** — a single bold statement of heritage ("The UK's verified fitness register · Since 2009"), set in display type with the orange accent. This is the one quantitative anchor we keep, because the year is factual, not a marketing claim.
- **Middle column** — the four trust points reframed as benefits with a tick mark, in a tighter list (not a 4-up grid).
- **Right column** — the press logos, rebalanced: larger (28–32px), better spacing, anchored by the "As featured in" eyebrow above.

**2. Tighten the trust copy** so each line is concrete and pro-facing:
- "Verified register heritage" → **"Verified pro badge — backed since 2009"**
- "Built for fitness pros" → **"Built for fitness, not general CRM"**
- "Reviews on the public record" → **"Reviews on the public record"** (keep)
- "Bookings, payments, coaching in one" → **"One platform — no bolt-ons or extra fees"**

**3. Lift the press treatment:**
- Logos at 100% opacity in their natural mono form, ~28px tall on desktop
- Subtle hairline above the row, generous gaps (32–40px)
- "As featured in" eyebrow in orange uppercase tracking, not muted white
- Optional: each logo wrapped in a `<Link>` to `/press` so it's not decorative

**4. Visual treatment:**
- One container, `rounded-[22px]` (large panel) instead of two flat borders
- Sits on `bg-reps-panel/40` with a subtle orange radial glow behind the left "Since 2009" anchor
- Vertical hairline dividers between the three zones on desktop
- Stacks vertically on mobile: heritage anchor → trust points → press logos

## Files to change

- `src/routes/for-professionals.tsx` — replace lines 139–160 (the two strips) with the single ProofBand block; remove the now-unused `<section>` for press
- No new components needed unless we want a reusable `ProofBand.tsx`; happy to inline it given it only appears once

## Scope guardrails

- Hero, header, footer, nav, routes, pricing, backend untouched
- No new claims, no numbers beyond "Since 2009" (factual, already in the brand language)
- Press logos stay the six already imported — no new assets
- Stays Phase 1: presentational only
