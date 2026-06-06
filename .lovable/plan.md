# Tighten /for-professionals to a 10/10 flow

The page currently has 14 stacked sections and three different "why switch" pitches. The fix is to **cut redundancy, not add polish** — and to let the six pillar deep-dives (the actual software tour) do the heavy lifting instead of being buried behind two text-heavy intros.

## What to remove (4 sections)

1. **Six-pillar grid / TOC** (lines 202–248) — six cards that just summarise the six 50/50 deep-dives sitting directly underneath. It delays the software tour by a full screen and repeats every label. Cut it; the deep-dives below ARE the tour.
2. **Comparison section** (lines 418–432) — we already have the full `/compare` hub and individual `/compare/*` pages linked from nav. Duplicating a comparison block here splits the story.
3. **Replaced stack** half of the "Replaced stack + triad testimonials" block (lines 433–450) — overlaps with "Software that also brings you clients" (same "you don't need 5 tools" message). Keep the triad testimonials, drop the replaced-stack visual.
4. **A week with REPs** (lines 469–486) — narrative device that competes with "Who's it for". Use cases wins because it pushes software capability per persona; "A week" is mood. Cut the week, keep use cases.

## What to keep and re-order

```text
1. Hero (unchanged)
2. Press marquee (unchanged)
3. Why coaches switch  ← keep, this IS the differentiator band (software + clients)
                         RegisterProof stays here as the visual payoff
4. Pillar 1 · Visibility       ┐
5. Pillar 2 · Shop-front       │
6. Pillar 3 · Operations       │  the software tour —
7. Pillar 4 · Coaching (tabs)  │  straight into product, no TOC delay
8. Feature testimonial         │
9. Pillar 5 · REPs AI (hero)   │
10. Pillar 6 · Growth          ┘
11. Triad testimonials  (replaced-stack visual removed)
12. Who's it for / Use cases
13. FAQ
14. Final CTA
```

Net: **14 sections → 10**, and the user hits real product screenshots within one scroll of the hero instead of three.

## Light copy tweak on "Why coaches switch"

Since it now sits alone as the only "why" band before the pillars, tighten the subtext one notch so it earns its place:

> Trainerize, MyPTHub and PT Distinction give you software. REPs gives you software **and** the clients to fill it — because the public already lands here when they're searching for a trusted pro.

(Adds "the clients to fill it" — makes the software-first promise explicit.)

## Technical notes

- Single file edit: `src/routes/for-professionals.tsx`.
- Delete line ranges: 202–248 (six-pillar grid), 418–432 (comparison), the replaced-stack half of 433–450 (keep the triad testimonials JSX), 469–486 (week with REPs).
- Remove any now-unused imports (`Eye, Globe, Settings2, ClipboardCheck, Brain, TrendingUp` if only used by the grid; the comparison/week components if only used by those sections).
- No route changes, no new components, no data changes. Hero, pillar deep-dives, AI hero moment, and FAQ stay exactly as locked.

## What I'm NOT doing (and why)

- Not touching the locked hero, the AI Pillar 5 hero moment, or any of the six pillar 50/50 layouts — those are the strongest software-forward modules already.
- Not adding new sections. The complaint is "too much"; the answer is subtraction, not another module.
- Not redesigning "Why coaches switch" — one copy-line tweak only. A redesign there would just reintroduce the text-heavy feel.
