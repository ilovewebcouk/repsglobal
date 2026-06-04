
# For Professionals — v2 rebuild

Build a brand-new route at `/for-professionals-v2` so the current page stays
intact as a fallback. Nothing in v1 changes. Mockup placeholders stay (we
upgrade visuals in a later pass).

## Goals

1. Break the monotony of 9 identical alternating blocks.
2. Add social proof and a comparison anchor inside the page body.
3. Make the AI section the page's hero moment, not a footnote.
4. Fix the hero CTA so it doesn't bounce through `/signup` → `/pricing`.
5. Use shadcn primitives where they raise quality (Tabs, Accordion, HoverCard, Carousel, Badge, Card, Separator).

## Page structure (top → bottom)

1. **Hero v2** — tighter. H1 + sub + 2 CTAs only. Trust points become a thin strip *below* the hero, not stuffed in. Background photo dimmer, more orange glow. Primary CTA → `/pricing`, secondary → "Find a Pro" anchor for clients.
2. **Press strip** — unchanged from v1.
3. **Proof row** — 3-up: "25,000+ verified pros", "Since 2009", "1M+ searches/yr". Plus the existing `RegisterProof` "Verified register" panel underneath.
4. **Act 1 — Get clients (Visibility)** — keep the strong Act 1 framing, condense to ONE wide showcase block (the profile mockup) + 3 supporting bullets in a row. Not 1 of 9 in a column.
5. **"Five pillars" intro** — eyebrow + headline + the existing `ReplacesStrip` (replaces 6 tools graphic).
6. **Pillar 1 — Leads & CRM** — `ProductBlock` (left image, right copy).
7. **Pillar 2 — Coaching** — *tabbed* block: 3 shadcn Tabs (Programmes / Check-ins / Client record) sharing one mockup frame. Replaces 3 separate ProductBlocks. Big rhythm change.
8. **Testimonial card** — full-width quote card, named PT, studio, city, headshot placeholder. Breaks the rhythm.
9. **Pillar 3 — Bookings & Payments** — `ProductBlock` reversed.
10. **Pillar 4 — Client Portal** — `ProductBlock` with a mobile-frame placeholder instead of desktop, plus a "what your clients see" caption.
11. **Comparison strip** — compact 4-column table: REPs / Trainerize / MyPTHub / PT Distinction with 5 rows (Public register, AI Operating System, No booking commission, UK verified since 2009, All features in tier). Links to `/compare` and `/comparison-methodology`.
12. **Second testimonial** — different shape (3-up mini-quotes card grid).
13. **Pillar 5 — REPs AI (hero moment)** — full-bleed dark section. Big "14 AI capabilities" headline, but the visual is a *fake AI Command Centre card stack* (Next Move card + Risk Alert card + Programme Writer card) using real REPs tokens, not just 6 generic feature cards. Keep the 6 capability cards below as a secondary grid.
14. **"A week with REPs"** — 5-day timeline (Mon Next Move → Fri check-ins) as a horizontal scroll/Carousel. New rhythm device.
15. **FAQ** — shadcn Accordion, 6 questions targeting PT objections (lock-in, data export, switching from Trainerize, what happens to my Stripe, do you take a cut, do my clients need an app).
16. **Final CTA panel** — same look as v1 but tighter: "Founding pricing, locked for life" with countdown-style urgency line and two CTAs (`/pricing`, `/compare`).
17. **PublicFooter** — unchanged.

## Sticky elements

- Sticky bottom-right CTA pill ("See pricing →") appears after scrolling past hero. v1 already has the hook (`useScrolledPast`); v2 actually renders it.

## Files to create

- `src/routes/for-professionals-v2.tsx` — the new page.
- `src/components/marketing/PillarTabs.tsx` — the tabbed Coaching block (shadcn Tabs).
- `src/components/marketing/TestimonialFeature.tsx` — full-width testimonial.
- `src/components/marketing/TestimonialTriad.tsx` — 3-up mini quotes.
- `src/components/marketing/ComparisonStrip.tsx` — compact 4-col comparison.
- `src/components/marketing/AiCommandCentreMock.tsx` — placeholder card-stack mock for the AI hero moment.
- `src/components/marketing/WeekWithReps.tsx` — Mon–Fri carousel (shadcn Carousel).
- `src/components/marketing/StickyCtaPill.tsx` — sticky bottom-right CTA.
- `src/components/marketing/ForProsFaq.tsx` — shadcn Accordion FAQ.

## Files NOT touched

- `src/routes/for-professionals.tsx` (v1 stays as fallback)
- `src/components/public/PublicHeader.tsx`, nav-config, footer
- `src/styles.css` tokens
- Any backend / signup / pricing logic

## Linking in

- Header nav stays pointing at `/for-professionals` (v1) for now.
- We add a small "Preview the v2 page" link from v1 to v2 (top-right of v1 hero, dev-only feel) so you can A/B without changing public IA. If you'd rather not, say so and I'll skip it.

## Compliance

- All radii from the locked 9-step scale (10 buttons, 12 inputs, 16/18 cards, 22 panels, 24 hero, full pills).
- All orange via `bg-reps-orange*` / `text-reps-orange*` tokens — no hex in components.
- No `rounded-xl/2xl/3xl`. No shadows on buttons.
- No banned phrases ("booking fee", "15%", "flat plan", etc.).
- No new routes outside `/for-professionals-v2`. No backend, auth, DB or payments work.
- Comparison strip references `/comparison-methodology` and a "Last checked" date.
- Hero CTA goes to `/pricing` (not `/signup`) to match the gated signup flow.

## Out of scope (for this pass)

- Replacing the 9 grey product mockup boxes with real visuals — explicit user choice, deferred.
- Promoting v2 to `/for-professionals` and retiring v1 — separate decision once you've reviewed v2.
- Real testimonials with real names — placeholders only, marked as such in code comments.
