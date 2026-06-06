## QA verdict: not yet a 10/10 — two real issues, both small

I walked the page top-to-bottom at 1440×900. The structure, copy ladder, hero, pillar sequence, AI moment, pricing strip, testimonials, FAQ and final CTA are all working. Two concrete issues to fix.

---

### Issue 1 — Banned phrase: "no booking commission"

`src/routes/for-professionals.tsx:273` — Pillar 3 (Operations) bullet:

> "Card payments and subscriptions — **no booking commission**"

Project memory bans "booking commission" as a REPs claim. The body copy two lines above already says "REPs takes no cut of what your clients pay you", which is the approved framing.

**Fix:** replace the bullet with:

> "Card payments and subscriptions — every payment goes to you, no REPs cut"

(Keeps the same column shape; drops the banned phrase; aligns with the body sentence and with the "no booking commission" constraint.)

---

### Issue 2 — Dead vertical band between Hero → Press marquee → "Why coaches switch" → Pillar 1

Stacked paddings are compounding into ~1 full viewport of empty ink:

- Hero section: `lg:pb-32` (~128px)
- `PressMarquee`: `lg:py-20` (~80px top + 80px bottom)
- "Why coaches switch" section: `lg:py-28` (~112px top + 112px bottom)
- Pillar 1 section: `lg:py-28` (~112px top)

Between Hero CTA buttons and the marquee, and between the marquee and "Why coaches switch", and between the proof strip and Pillar 1, you can see large empty bands in the screenshots — the page reads slower than it should.

**Fix (targeted, no structural changes):**

1. `src/routes/for-professionals.tsx:112` — Hero inner container: `pb-24 ... lg:pb-32` → `pb-20 ... lg:pb-20`.
2. `src/routes/for-professionals.tsx:202` — "Why coaches switch" container: `py-12 lg:px-10 lg:py-28` → `pt-10 pb-16 lg:px-10 lg:pt-16 lg:pb-20`.
3. `src/routes/for-professionals.tsx:222` — Pillar 1 container: `py-24 lg:px-10 lg:py-28` → `pt-16 pb-24 lg:px-10 lg:pt-20 lg:pb-28`.

Net effect: ~120–140px removed from the dead band above Pillar 1 and ~80px above "Why coaches switch", without touching the inner rhythm of the rest of the pillar sequence (Pillars 2–6 keep their current `lg:py-28` cadence so the page still breathes at full width).

---

### What's already good (no change)

- Hero copy ladder, animation timings, trust chips ("Verified credentials / 10-minute setup / Every feature included — no add-ons") all on spec.
- Pillar order, eyebrows, and `ProductBlock` reversal pattern.
- Pricing strip uses the locked 3-tier ladder (£99 / £59 Founding / £149), no banned "flat plan" language.
- Testimonial feature now correctly names Trainerize.
- Final CTA has the two correct buttons (Compare platforms + See pricing).
- FAQ titles read straight, no UK qualifiers.

---

### Out of scope (not changing in this pass)

- Hero device cluster sizing, image crop, gradient stops.
- Pillar mockup screenshots (they render correctly via live iframes).
- `RegisterProof` and `VenueStrip` copy (already cleaned in previous turns).
- Pricing strip card visual treatment.
