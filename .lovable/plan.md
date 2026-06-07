# /specialisms — world-class rebuild

Goal: turn `/specialisms` from a 5-tile grid into a flagship landing page on par with the locked homepage, `/for-professionals`, `/professions/$profession`, `/in/$location`, `/c/$slug` and `/pro/$slug/enquire`. Same visual language, same radius/colour discipline, same hero pattern, same SEO depth.

Scope: visuals + copy only. No auth, DB, search, or real filters. Phase 1 static screen.

## Final section order

1. **Hero** — top-anchored copy (`marketing-hero-template`): eyebrow chip, headline with one orange accent word, sub, 3 universal trust chips, dual CTA (Find a pro / Browse all professionals), staggered fade-up. Same gym hero image, gradient as homepage hero. No Ken Burns.
2. **PressMarquee** — reuse existing component (consistency with other locked marketing pages).
3. **Specialism index (sticky sub-nav)** — a thin, sticky `SectionNav` bar with 6 anchors (Personal trainers · Strength coaches · Online coaches · Nutritionists · Yoga teachers · Pilates instructors). Style mirrors the coach shop-front sticky nav (locked pattern).
4. **Six deep specialism sections**, one per anchor. Each is a 2-column layout (lg) / stacked (mobile):
   - **Left column (60%):** Eyebrow ("Specialism 01" etc.), H2 ("Personal Trainers"), 1-paragraph plain-English description, "What they actually do" 3-bullet list, "What REPs verifies" bullet list (ID, qualification, insurance, DBS where relevant), CTA pair: `Browse {plural}` → `/professions/$profession`, `Find one near you` → `/find-a-professional?profession=…`.
   - **Right column (40%):** A `QualCard` panel — dark `bg-reps-panel`, 18px radius — listing the recognised qualifications/registers for that specialism with one-line plain-English meaning each. This is where AFN/ANutr/RNutr, REPS Level 3/4, Yoga Alliance Professionals 200hr/500hr, UKSCA ASCC, etc. live.
   - Each section also includes a small "Typical rate" + "Verified pros on REPs" stat row (static numbers, consistent with `professions.$profession.tsx`).
5. **Qualifications explainer block** — full-width dark panel that demystifies the alphabet soup once across the whole industry: REPS / CIMSPA / AfN / SENr / Yoga Alliance Professionals / BWY / UKSCA / BASES. A clean 4-col card grid (`rounded-[18px]`, `border-reps-border`), each card: register name, who they cover, what "registered" actually means, link out (external where appropriate).
6. **"How we verify every specialism"** — 3-step row (Identity → Qualifications → Insurance), mirroring the homepage trust strip, ending in a `Verified ✓` badge sample.
7. **FAQ accordion** (shadcn Accordion) — 6–8 Qs covering the most-asked specialism questions: "What's the difference between a nutritionist and a dietitian?", "Is a Level 3 PT enough?", "Do online coaches need different qualifications?", "What does Yoga Alliance Professionals mean?", "Who polices REPs registrations?", "Can one person hold multiple specialisms?".
8. **Cross-link strip** — "Looking for something else?" with chips to `/in/london`, `/find-a-professional`, `/cpd`, `/about`, `/for-professionals`.
9. **PublicFooter**.

## Six specialisms covered (exact set, in this order)

1. Personal Trainers — slug `personal-trainer`
2. Strength Coaches — slug `strength-coach`
3. Online Coaches — slug `online-coach`
4. Nutritionists — slug `nutritionist` (with AfN ANutr / RNutr / SENr language front-and-centre)
5. Yoga Teachers — slug `yoga-teacher` *(new — see Technical notes)*
6. Pilates Instructors — slug `pilates-instructor`

(Drops the unused 6-screen icon vibe; gives every specialism a real section, not a tile.)

## Visual & compliance rules

- Tokens: `bg-reps-ink`, `bg-reps-panel`, `text-reps-orange`, `border-reps-border`, `border-reps-orange-border`, `bg-reps-orange-soft`. No raw hex. No `rounded-xl/2xl/3xl`. Hero `rounded-[24px]` where applicable; large panels `22px`; cards `18px`; buttons `10px`; inputs `12px`; chips/pills full.
- Buttons flat — `shadow-none`.
- Global wording rules: no "UK/United Kingdom/UK PTs" qualifiers; brand "REPs" never "REPs UK"; no "booking fee/commission/15%/flat plan" claims.
- Trainer imagery: not required on this page (no full-bleed coach portraits), but if any are added later the REPS wordmark rule applies.
- Hero anchoring per `marketing-hero-template` — `justify-start items-start` + `lg:pt-24`.
- shadcn primitives only: Accordion (FAQ), Badge (chips), Separator, Card pieces where useful, Tooltip on register acronyms (AfN, RNutr, ANutr, SENr, UKSCA, BASES, YAP, BWY) so a hover/tap reveals the full name + one-line meaning. No native `title=`.

## SEO

- `head()` upgrade: title "Specialisms — verified personal trainers, coaches & nutritionists | REPs", description rewritten to mention all six specialisms + registers (AfN, Yoga Alliance Professionals, UKSCA) within 160 chars where possible, og:title/og:description/og:url, canonical. JSON-LD `ItemList` of the 6 specialisms with `url` to each `/professions/$slug`.
- Single H1; each specialism section uses H2; qualification cards H3.

## Technical notes

- File: `src/routes/specialisms.tsx` — full rewrite. No new route files except for the missing profession entry.
- Add **`yoga-teacher`** entry to `PROFESSIONS` in `src/routes/professions.$profession.tsx` so the link from this page (and the existing related-link in `pilates-instructor`) resolves to a real page instead of a not-found. Mirror the existing schema (qualifications: 200hr / 500hr Yoga Alliance Professionals, British Wheel of Yoga L4, First Aid; specialisms: Vinyasa, Hatha, Yin, Pregnancy, Beginners; sensible `avgRate` and static `count`; related: pilates / personal-trainer / online-coach).
- New small components, colocated under `src/components/marketing/specialisms/`:
  - `SpecialismSection.tsx` — the 2-col block (props: index, slug, title, plural, intro, doesBullets, verifiesBullets, rate, count, qualCard).
  - `QualCard.tsx` — the right-side dark panel with register list + tooltips.
  - `RegisterCard.tsx` — used by the explainer grid.
  - `SectionNav.tsx` — reuse the existing one if `src/components/marketing/` already has it (will check during build); otherwise extract from `c.$slug.tsx`.
- No new images required; reuses `hero-gym-bg.jpg`.
- Hero LCP: add `<link rel="preload" as="image" href={heroGym.url} fetchpriority="high">` and eager `<img>` per `perf` rules.

## Out of scope

- No new profession pages beyond the `yoga-teacher` data entry.
- No editorial long-form (lives in `src/lib/resources.ts` already).
- No live data, no search, no auth, no DB.

## Acceptance checklist

- Audit script passes (no banned hex, no banned radii, no button shadows).
- All six specialisms link to a real `/professions/$slug` page (including new `yoga-teacher`).
- Hero matches `marketing-hero-template` (top-anchored, staggered fade-up, 3 universal trust chips, PressMarquee below).
- Sticky sub-nav scrolls to each section; active state highlights current section.
- shadcn Tooltip used for every register acronym; no native `title`.
- Mobile (390×844): no overflow, sticky nav collapses to a horizontal scroll strip, 2-col sections stack cleanly.
- SEO: unique title/desc/og + canonical + ItemList JSON-LD; single H1.
- No banned phrases ("UK", "booking fee", "flat plan", etc.).
