## Goal

Rewrite `/for-professionals` to be a true category-defining page. Two-act narrative — **Act 1: the Register** (trust + clients), **Act 2: the Operating System** (run the practice). Cinematic full-bleed hero, no placeholder mockups in the hero, and a real side-by-side comparison naming Trainerize, MyPTHub and PT Distinction.

## Final page order (top to bottom)

1. **Cinematic hero** — full-bleed trainer photo + dark gradient. No product tile. Headline reframed to lead with the register/operating-system promise. Two CTAs + trust pill row.
2. **Press strip** — unchanged.
3. **Two-act intro** — split-screen "Act 1 · Get clients" / "Act 2 · Run your practice". One sentence each. Sets the spine for the rest of the page.
4. **ACT 1 — The Register** *(new section, this is the moat)*
   - Big editorial headline: "The industry register since 2009. The only platform clients actively search."
   - 3-column proof: 25,000+ verified pros / Verified credentials, insurance & CPD / Public directory that delivers enquiries.
   - Single hero image: the public directory search results screen (placeholder block sized like a real screenshot, neutral — no fake browser chrome). Caption: "This is where the public lands."
5. **Verified credential strip** — gold-accented row: Qualifications verified · Insurance on file · CPD tracked · Reviews on the record. Explains the trust layer no SaaS competitor has.
6. **ACT 2 — The Operating System** *(replaces current "See the platform" + "Feature pillars")*
   - Editorial headline: "When clients arrive, REPs runs the rest."
   - Three deep-dive blocks (alternating left/right), each a real product story not a feature card:
     a. **Bookings & payments** — kill no-shows, Stripe payouts, deposits, recurring memberships.
     b. **Clients, programmes & check-ins** — one record per client, programme builder with video library, weekly check-ins and progress photos. (This is the Trainerize-killer block.)
     c. **Client portal & messaging** — branded portal for clients, focused inbox separate from personal phone.
   - Each block: large product image area (placeholder for now, sized like a real screenshot), 1-line eyebrow, 1-sentence headline, 1 paragraph, 3 bullets, link to the feature deep-dive page.
7. **Growth layer** — single block for Insights & AI ("the next move to grow this month"). One quote, big number ("+24% revenue YoY").
8. **Comparison table** *(new — direct competitor section)*
   - Headline: "REPs vs the coaching apps."
   - 4-column table: REPs · Trainerize · MyPTHub · PT Distinction.
   - ~8 rows: Public directory that brings clients · Industry-recognised credential · Verified register since 2009 · Bookings + Stripe payments · Programme builder + video library · Client portal · CPD tracking · Insurance on file.
   - REPs column has check marks across the board; competitors have a mix of dashes and partial checks, with short truthful captions ("brings own clients only", "no public directory", etc.).
   - Disclaimer line: "Comparisons reflect publicly available info at time of writing."
9. **Earnings calculator** — keep, lightly trimmed copy to fit the new narrative.
10. **"Get started in 3 steps"** — keep, copy unchanged.
11. **Testimonials** — keep, copy unchanged.
12. **Pricing** (`FoundingBanner` + `PricingPlans`) — keep.
13. **Why priced this way** — keep, retitle to "A ladder, not a paywall."
14. **Compare plans** (`PricingCompare`) — keep.
15. **FAQ** — keep.
16. **Final CTA + demo form** — keep.
17. **Sticky CTA** — keep.

The current "Pitch 3-up", "See the platform" showcase, and "Feature pillars" sections are **deleted** — their content is absorbed into the new Act 1 / Act 2 / Comparison structure.

## Components & files

### New components
- `src/components/marketing/CompetitorCompare.tsx` — the 4-column comparison table. Self-contained, data-driven from a `ROWS` array. Mobile: collapses to stacked per-row cards.
- `src/components/marketing/ActIntro.tsx` — small reusable split heading used by both Act 1 and Act 2.
- `src/components/marketing/ProductBlock.tsx` — the alternating image/text deep-dive block used 3× in Act 2.
- `src/components/marketing/RegisterProof.tsx` — Act 1's 3-column proof + verified credential strip.

### Updated components
- `src/components/mockups/MockupPlaceholder.tsx` — simplify to a clean neutral block sized for product screenshots (no faux browser chrome, no fake sidebar). It's clearly a "screenshot coming" frame, not a fake UI. Keeps the door open to drop real screenshots in later by swapping the inner element. Single export, same prop shape (`label`, `aspect`, `className`) so we don't break feature-page imports.

### Files edited
- `src/routes/for-professionals.tsx` — rebuild around the new section order, swap hero to full-bleed (no right-side mockup), import the four new components, delete the dead `SHOWCASE`, `GROUP_VISUAL`, and `PITCH` arrays.

### Files untouched
- `src/routes/features.$slug.tsx`, `src/routes/features.index.tsx`, `src/components/features/*`, `src/components/mockups/PlatformMockups.tsx`, `BrowserFrame.tsx` — all stay.
- Pricing, footer, header, nav — untouched.

## Copy direction (what the page actually says)

**Hero**
- Eyebrow: "For professionals"
- H1: "The register the industry trusts. The platform that runs your practice."
- Sub: "REPs has been the UK's fitness professional register since 2009. Now it's also the operating system you run your business on — bookings, clients, programmes, payments and insights. One platform. One credential."
- CTAs: "Create free profile" + "See plans"

**Act 1 — The Register**
- Eyebrow: "Act 1 · Get clients"
- H2: "The industry register since 2009. The only platform clients actively search."
- Body: "Trainerize, MyPTHub and PT Distinction give you software. REPs gives you software *and* clients — because the public already lands here when they're looking for a trusted pro."

**Verified credential strip**
- 4 inline items with check icons: Qualifications verified · Insurance on file · CPD tracked · Reviews on the record.

**Act 2 — The Operating System**
- Eyebrow: "Act 2 · Run your practice"
- H2: "When clients arrive, REPs runs the rest."
- Sub: "Bookings, payments, clients, programmes, check-ins, messaging and growth — in one place built for fitness, not generic SaaS."

**Comparison table**
- H2: "REPs vs the coaching apps."
- Sub: "Most coaching apps assume you already have clients. REPs is the only one that brings them too."

## Technical detail

- All colours via existing `reps-*` tokens; no hardcoded hex.
- Radius: cards 16/18, panels 22, hero corners stay square (full-bleed).
- Hero photo: existing `@/assets/hero-trainer.jpg`, opacity raised slightly (~0.35) so the figure reads, plus stronger bottom gradient to keep text readable.
- Comparison table uses `<table>` semantics with `scope="col"` headers for accessibility; competitor columns get muted text colour, REPs column gets a subtle orange tint background.
- No new dependencies. No animation libraries — keep existing `animate-fade-in` / `animate-rise-in` utilities.
- No router/route changes. No data, no auth, no backend touched.
- Verify after build: page renders without console errors, hero has no placeholder tile, all internal `/features/$slug` links resolve, sticky CTA still works.

## Out of scope

- No real screenshots yet (placeholder frames stay, just cleaner).
- No animation overhaul.
- No changes to `/features` hub, feature deep-dive pages, pricing data, nav, or footer.
- No copy changes to the testimonial, FAQ, or earnings calculator beyond the small trim noted.
- No competitor logo usage — names only in the comparison table.
