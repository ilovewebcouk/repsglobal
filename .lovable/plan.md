# Regenerate `/about` hero in a new register that sits alongside Independence + Professionals

## The problem

The current `about-hero.jpg` was generated as a near-clone of `about-independence.jpg` (solo trainer, dawn pavement, golden rim). On the same page it now competes with — rather than complements — Independence and Professionals. The hero should be the **widest, most cinematic frame on the page** and introduce a register the other three then specialise from.

## What the other three already cover

| Section | Image | Register |
| --- | --- | --- |
| Heritage | `about-heritage.jpg` | Intimate two-person consultation, interior |
| "More than a directory" / Professionals | `about-professionals.jpg` | Online coach, home studio, screen-lit |
| Independence | `about-independence.jpg` | Solo trainer, dawn pavement, golden rim, single subject |

So the hero must NOT be: another solo dawn-pavement portrait, another interior consult, another laptop scene.

## Proposed hero register — "Coach + client, mid-rep, warehouse window-light"

A **two-person training moment** captured wide and cinematic — the one register missing from the page and the one that actually says "About REPs" (a coach doing the work with a real client, not a portrait).

**Scene**
- Coach (left, REPS tee) spotting / cueing a client (right) mid-lift on a barbell or kettlebell carry, inside a converted warehouse gym
- Coach has a hand on the bar / on the client's back — active, not posed
- Tall industrial windows back-right throw a wide shaft of low golden light across the chalk dust in the air
- Polished concrete floor, raw brick, exposed steel trusses, racked plates softly out of focus

**Light & finish (matches Independence + Professionals lookbook)**
- Golden-hour rim, low sun raking from window
- Muted film palette, deep blacks, amber highlights on rim + floor only
- Shallow DoF, creamy bokeh on background racks
- Soft 35mm grain, anamorphic, A24-meets-Lululemon
- Photo-realistic, no overlays, no extra text

**Composition**
- 16:9, subject group anchored **right two-thirds**
- Deep architectural negative space on the **left third** for the H1 + CTAs
- Wider lens than the other three (35mm-ish) so it reads as the "establishing shot" for the page

**Wardrobe + logo (per `mem://design/trainer-imagery`)**
- Both wearing charcoal heather REPS performance tees
- Composite the actual `src/assets/brand/logo.svg` onto the coach's left chest as white embroidery (small, follows fold, picks up rim light)
- No logo description in prose — rasterise the SVG and pass as a reference image

## Why this works on the page

- **New register vs the other three** — group / action, not solo / portrait / desk
- **Same photographer lookbook** — golden rim, muted film, shallow DoF, REPS embroidery
- **Earns its position as hero** — widest frame, most context, most negative space for type, clearly sets up the "we register and back the people who do this work" narrative the rest of the page expands on

## Execution

1. Rasterise `src/assets/brand/logo.svg` → `/tmp/reps-logo.png` (white on transparent, 1600px wide)
2. `imagegen--edit_image` with refs: `src/assets/about/about-independence.jpg` (tone benchmark) + `/tmp/reps-logo.png` (logo source), 16:9, target `/tmp/about-hero-base.jpg`, prompt = scene above with a **clean blank left chest area** on the coach
3. Second `edit_image` pass to composite logo as white embroidery on the coach's left chest (small, fabric-accurate, picks up rim)
4. `lovable-assets create` → overwrite `src/assets/about/about-hero.jpg.asset.json`
5. QA on `/about` against Independence + Professionals side-by-side; re-run pass 2 if logo drifts from `logo.svg`

No layout, copy, alt-text, or other image changes. No route or component edits.

## Alternative I considered and rejected

A group / team shot (3–4 coaches outside the warehouse). Rejected because it would compete with `about-professionals.jpg` and shift the hero from "the work" to "the brand", which is a weaker opener.
