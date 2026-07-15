
## Goal

Ship a dedicated marketing + pricing page for the REPS-accredited Training Provider tier at **`/training-providers`** — the page a provider lands on before signing up. Matches the polish of `/pricing` and `/features/*`, uses locked marketing primitives, and beats the reference sites (EMD UK, old REPs, CIMSPA).

## Route + structure

New file: `src/routes/training-providers.tsx` (public marketing route, dark REPs theme, uses `PublicHeader` / `PublicFooter`, full head metadata + JSON-LD Product/Offer).

Sections (top → bottom), all built with locked primitives (`HeroOverlay`, `SectionEyebrow`, `SectionHeading`, `SectionHeader`, `MarketingFaq`, `FinalCta`, `TierCard`-style card):

1. **Hero** — top-anchored copy, generated hero image (training-floor scene, REPS-embroidered coach), eyebrow "For training providers", H1 "Get your courses REPS-accredited. Get seen by 25,000+ pros.", lede, dual CTA (Apply now → `/signup?type=training_provider`, See what's included → `#included`), 3 trust chips (Ofqual-regulated wording, unlimited courses, digital certificates).
2. **Proof strip** — 3 stats (pros on register, certificates issued, avg. reviews per accredited course) + PressMarquee.
3. **"Everything a provider needs" feature grid** (6 cards, generated icons/imagery):
   - Unlimited accredited course listings
   - Public provider website (`/t/{slug}`)
   - Course directory placement + homepage carousel
   - Digital REPS-accredited badge + embed widget
   - Learner review collection (Trustpilot-style widget + badge)
   - Printable / PDF learner certificates (£15 each)
4. **Annotated mock** — screenshot of a live `/t/{slug}` provider page with callouts (badge, courses, reviews, enquire).
5. **Certificate showcase** — 4-up grid using existing `src/assets/certificates/level-1..7.png.asset.json` with "Issue REPS-accredited certificates in minutes" copy + £15/certificate line.
6. **Reviews widget preview** — mock of the embeddable REPS-verified reviews widget + badge (parity with Trustpilot pitch).
7. **How it works** — 4 steps: Apply → Course review → Get accredited → Issue certificates + get listed.
8. **Pricing card** (the money shot):
   - Single tier card, highlighted, `TierCard`-style shell
   - **£479 / year** — "REPS-accredited Training Provider"
   - Included bullets: unlimited accredited courses, provider website, directory + carousel, digital badge + widget, review collection, welcome article slot, priority support
   - Add-on line: **Certificates £15 each** (bulk pricing on request)
   - Primary CTA "Apply to become a REPS provider" → `/signup?type=training_provider`
   - Secondary "Talk to us" → `/contact?topic=training-provider`
9. **Compare** — 3-column table: REPS vs generic listing directories vs awarding-body partner schemes. Tier-ladder framing, no banned org names, no "CIMSPA" reference, includes "Last checked" + link to `/comparison-methodology`.
10. **FAQ** (`MarketingFaq`) — 8 Qs: accreditation criteria, timeline, cancel policy, who owns certificates, VAT, insurance requirement for learners, existing awarding-body courses, refund policy. Emits FAQ JSON-LD.
11. **FinalCta** — "Get your courses in front of 25,000+ REPs pros."

## Data / config changes

- `src/lib/billing.ts` → change `ORG_TIERS.training_provider.priceLabel` from `£499` to **`£479`** and `amountPence` from `49900` to `47900`. Keep `stripePriceLookupKey: "training_provider_annual"` — Stripe price object gets updated separately (out of scope for this turn; note in doc).
- Add `CERTIFICATE_UNIT_PRICE_PENCE = 1500` constant next to `ORG_TIERS` for single source of truth (already exists as £15 elsewhere? — reuse if present, otherwise add).
- No DB migration needed.

## Assets (generated in build turn)

Generate 4 images with `imagegen--generate_image` (premium where text matters), all with REPS-embroidered wordmark rule where humans appear:

1. `src/assets/training-providers/hero.jpg` — wide training-floor scene, lead coach in REPS polo teaching a small group; cinematic, dark ambience matching site.
2. `src/assets/training-providers/classroom.jpg` — accredited-course classroom moment (used in "How it works").
3. `src/assets/training-providers/badge-mock.png` (transparent) — REPS-accredited digital badge mock for the badge section.
4. `src/assets/training-providers/reviews-widget.jpg` — screenshot-style mock of the embeddable reviews widget on a provider site.

Existing certificate level PNGs are reused directly.

## Header/footer nav

- Add "Training Providers" link to `PublicHeader` desktop + mobile nav (points to `/training-providers`). Confirm sitemap + `public/robots.txt` unaffected (route is public by default).

## Type + build safety

- Route file uses `createFileRoute("/training-providers")`; `routeTree.gen.ts` regenerates automatically.
- All components imported from existing marketing primitives — no new primitives.
- Full head(): title <60, meta <160, og:title/desc/type/url, canonical, og:image (absolute URL of hero via asset pointer + published origin), FAQ + Product JSON-LD.
- Radii: hero 24, panels 22, cards 18, buttons 10, inputs 12. No banned radii/hex.
- Uses only semantic tokens (`bg-reps-panel`, `text-reps-orange`, etc.).

## Out of scope (flagged)

- Stripe self-serve checkout for training providers (still admin-attached per `src/lib/billing.ts` comment). CTA goes to `/signup?type=training_provider` which routes into the existing provider signup/application flow; we do not wire a new Checkout Session here.
- Updating the live Stripe price object from £499 → £479 (dashboard action, called out in audit doc).
- Building the actual reviews-widget embed — this page only shows a mock.

## Deliverable checklist

- [ ] `src/routes/training-providers.tsx` created
- [ ] `PublicHeader` nav updated
- [ ] `src/lib/billing.ts` price updated to £479 / 47900
- [ ] 4 generated marketing images under `src/assets/training-providers/`
- [ ] Head metadata + JSON-LD verified
- [ ] Audit script clean (banned hex/radii/shadows), typecheck green
