# Bulk out `/resources` with world-class articles + bespoke imagery

Goal: take `/resources` from 3 articles to **18 total** (15 new), each with its **own bespoke cover image** generated for it. World-class editorial bar, magazine-quality look.

## Editorial bar (applied to every new article)

- One clear job per article — answers a single question a real reader has typed into Google.
- Specific, not generic — names, numbers, frameworks, scripts the reader can use today.
- First-person REPs authority — written from a register/standards body.
- Structure: hook (50–80 words) → 2–4 H2 sections → actionable bulleted list → pull quote.
- Length: 6–9 min read (~900–1,400 words).
- Reuses existing `ResourceArticle` shape — no schema changes.

## Article slate (15 new)

**Find a Professional (3 new)**
1. Online vs in-person coaching: which actually gets you results?
2. Red flags when hiring a personal trainer (and how to spot them in 60 seconds)
3. How much should a personal trainer cost in the UK in 2026?

**Verification & Standards (2 new)**
4. What "REPs Verified" actually means — and what it doesn't
5. How to make a complaint about a fitness professional

**Fitness Business (3 new)**
6. How to price a 12-week coaching programme
7. Turning a free consultation into a paying client: a 20-minute script
8. Cancellation policies that protect your time without losing clients

**Coaching & Client Management (3 new)**
9. The first 30 days with a new client: a week-by-week playbook
10. How to handle a client who isn't getting results
11. Writing programmes that clients actually follow

**CPD & Education (2 new)**
12. Choosing a Level 4 specialism: a decision framework
13. Free vs paid CPD in 2026: where the real value is

**Platform Updates (2 new)**
14. What's new on REPs — Q2 2026
15. The REPs roadmap: what we're building next

## Bespoke imagery (this is the change you asked for)

- **One unique cover per new article** — 15 new images, generated, not reused.
- Generated via `imagegen` at **standard** quality (good fidelity for editorial covers, not premium — premium is reserved for typography-heavy work which these are not).
- **Format**: 16:9 landscape, saved as `.jpg` to `src/assets/resources/{slug}.jpg`.
- **Visual system (cohesive, REPs-branded, magazine-quality):**
  - Editorial photography style — natural light, real moments, documentary feel. No stock-photo cheese, no AI clichés (no "person looking thoughtfully into the distance with a coffee").
  - **Accent palette pulls in REPs brand orange** as a small environmental detail (a kit bag, a wall sign, a barbell collar) rather than a colour wash — keeps covers feeling on-brand without screaming it.
  - **Real UK gym/clinic/outdoor environments** appropriate to the article's subject (e.g. complaint article = quiet office desk with paperwork; pricing article = clean planner + laptop on a wooden desk; verification article = clipboard and certification documents; CPD article = textbook, notes, fitness equipment in soft focus).
  - **No on-image text, no logos, no faces of identifiable people** (avoid likeness/IP risk; favour hands, equipment, environments, over-the-shoulder shots).
  - Consistent lens feel across the set: ~35–50mm equivalent, shallow depth of field, warm neutral grade.
- **Per-article prompts** are derived from the article's specific subject (the platform updates article gets a clean desk + notebook with abstract REPs colour cue; the pricing article gets a planner + pen + laptop, etc.) — I'll generate them inline rather than enumerate all 15 prompts here.
- **Cost note**: 15 standard-tier images is meaningful generation cost. If you want to cap that, say so and I'll trim (e.g. 8 new articles with new images + 7 articles that share carefully curated reused covers).

## Authors / voices

- **Sophie Marshall** — consumer guides (1, 2, 3)
- **The REPs Standards Team** — standards/complaints (4, 5, 14, 15)
- **James Carter** — business growth (6, 7, 8)
- **New: Dr. Priya Shah, Head of Coaching Practice** — coaching craft (9, 10, 11)
- **New: Mark Ellis, Head of CPD & Education** — CPD (12, 13)

## Implementation order

1. Generate 15 cover images in parallel batches (5 at a time) into `src/assets/resources/`.
2. Add all 15 articles to `RESOURCE_ARTICLES` in `src/lib/resources.ts`, each importing its bespoke cover.
3. Dates spaced Mar 2026 → Jun 2026 so the index feels actively maintained.
4. No route or component changes — existing `/resources` index and `/resources/$slug` template render them.

## Confirm before I start

1. **15 new articles + 15 new covers** — proceed as-is, or reduce volume?
2. **New authors** — OK to add Dr. Priya Shah and Mark Ellis as REPs editorial personas?
3. **Platform Updates (#14, #15)** — OK to write these against Phase 1 mock-up surfaces only (not real shipped features)?

Reply with confirmations or tweaks and I'll run image generation, then write all 15 articles in one pass.
