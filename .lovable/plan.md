# Comparison hub + 3 head-to-head pages

## Goal

Turn `/compare` into a credible, SEO-earning hub with three head-to-head pages (`/compare/reps-vs-trainerize`, `/compare/reps-vs-mypthub`, `/compare/reps-vs-pt-distinction`), each targeting "<competitor> alternative" / "<competitor> vs …" intent, with live-sourced pricing, client limits, and add-on costs.

## The add-on angle (cuts through every page)

REPs = one price, everything included. Competitors charge extra for things trainers assume are bundled:
- **MyPTHub**: custom branded app €95 one-time + extra trainers + white-label + Check-Ins AI = paid add-ons
- **PT Distinction**: $6/month per extra client above 3 (a coach with 30 clients pays $19.90 + 27×$6 ≈ $182/mo)
- **Trainerize**: branded app, premium features tiered up

Surfaces:
- New row in the Plans & limits strip: "What's actually included" — REPs = "Everything"; competitors = bullet list of paid add-ons
- "Hidden add-ons" section on each head-to-head page with a worked-number example
- Referenced in TL;DR + FAQ on each page

## Step 1 — Source competitor data (Firecrawl)

Link Firecrawl, then run a dev-only `createServerFn` that scrapes each vendor's pricing + features pages (markdown + structured JSON). Capture per tier:
- Name, monthly + annual price, currency
- Client cap, trainer-seat cap/cost
- Transaction/payment fees
- Free trial length, contract terms
- Custom-branded app cost
- Every paid add-on (name + cost + cadence)
- AI features advertised

Output: `src/data/competitor-data.ts` with a typed `Competitor[]` — single source of truth. Stamp "Last verified: <date>" on every page using it. Re-run manually when pricing shifts.

## Step 2 — `/compare` table updates (option B)

Add a **Plans & limits strip** above the existing feature table — 4 cards (REPs, Trainerize, MyPTHub, PT Distinction), each showing:
- Starting price + currency
- Client cap (entry tier → top tier)
- "What's actually included" vs paid add-ons (the differentiator)
- Custom-branded app cost
- Free trial, transaction fee
- One-line "best for" note

Visual: 22px panel radius, REPs card in orange tint to match its table column below. Mobile = horizontal scroll like the table; desktop = 4-up grid. Keep the existing feature table unchanged underneath.

Update footnote: "Pricing, limits and add-ons verified <date>. Source: each platform's public pricing page."

Also retarget `/compare` `head()` to "personal trainer software uk" (110/mo, very easy — biggest term in scope).

## Step 3 — Three head-to-head pages

Routes:
- `src/routes/compare.reps-vs-trainerize.tsx`
- `src/routes/compare.reps-vs-mypthub.tsx`
- `src/routes/compare.reps-vs-pt-distinction.tsx`

All three render `<HeadToHeadPage competitor={...} />` from one component; content swaps via `competitor-data.ts`.

Page structure:
1. **Hero** — "REPs vs <Competitor>: which is right for UK personal trainers in 2026?" + 1-paragraph honest summary + dual-logo hero image
2. **TL;DR card** — when REPs wins, when <competitor> wins, who each is built for
3. **Pricing side-by-side** — REPs vs that one competitor
4. **Hidden add-ons** — worked-number example showing real monthly cost at 10/20/30 clients
5. **Feature parity** — `CompetitorCompare` data filtered to REPs + that competitor (2 cols)
6. **"When <Competitor> is the right choice"** — credibility move so the page isn't a hit piece
7. **"Why UK trainers move to REPs"** — public register, REPs credential, AI layer, replaces-6-apps
8. **FAQ** — 4-6 Q's targeting people-also-ask phrasing
9. **CTA**

SEO per page (each `head()`):
- `/compare/reps-vs-trainerize` — "Trainerize Alternative for UK Trainers — REPs vs Trainerize (2026)"
- `/compare/reps-vs-mypthub` — "MyPTHub Alternative — REPs vs MyPTHub for UK PTs (2026)"
- `/compare/reps-vs-pt-distinction` — "PT Distinction Alternative — REPs vs PT Distinction (2026)"
- Unique `og:title`/`description`/`og:image` (the per-page hero), canonical, JSON-LD `Article` schema.

## Step 4 — Hero images (one per page)

`imagegen--generate_image` premium tier, 1600×900, brand-orange gradient with REPs tokens, dual-logo lockup (REPs · vs · competitor logo) + "Honest comparison for UK personal trainers". Same template across all 3 — visual consistency reinforces the series. Used as `og:image` and `twitter:image`.

## Step 5 — Internal linking

- `/compare` hub adds a "See head-to-head comparisons" section with 3 cards
- Each head-to-head page cross-links to the other two + back to `/compare`
- Add 3 new routes to `sitemap.xml`

## Out of scope

- No nav, footer, pricing, or homepage changes
- No blog/CMS infra — these are evergreen comparison routes
- No auth/DB/payments (Phase 1 lock)
- No automated re-scrape; manual dev re-run when prices move

## Technical notes

- Firecrawl: server-side via `createServerFn` reading `process.env.FIRECRAWL_API_KEY`. Result baked into `src/data/competitor-data.ts` as static TS — no runtime Firecrawl calls in production.
- New components: `src/components/marketing/PlansLimitsStrip.tsx`, `src/components/marketing/HeadToHead.tsx`, `src/components/marketing/HiddenAddOns.tsx`. Reuses existing `CompetitorCompare` with a `competitors` prop.
- All radii per locked system; all colors via `src/styles.css` tokens.

## What I need from you to start

Authorise the Firecrawl connection when the picker appears.
