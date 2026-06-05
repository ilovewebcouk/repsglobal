## Goal

Lock the trainer shop-front mock-up at `/c/james-wilson` as the canonical source of truth for "what you get on REPs", then propagate that across the marketing surface so the £59 Pro value story includes it explicitly.

## 1. Lock the mock-up

- Promote `mem://design/coach-shopfront` from "Phase 1 layout" to LOCKED, frozen 2026-06-05. Add a Core line in `mem://index.md`: shop-front at `/c/$slug` is the locked SoT for the personalised trainer page; do not redesign without an explicit, section-named request.
- Add the locked section order, accent-token rules, dark-theme rule, hero structure (outcome headline + name eyebrow), tiered services (3, with hybrid highlighted), Foundation Method block, proof-card transformations, sticky `SectionNav`, social-icon row, and "all CTAs deep-link to `/pro/$slug/enquire`" to the memory body.

## 2. Add Shop-front as a 6th pillar (cross-listed in Visibility)

Edit `src/components/features/feature-config.ts`:

- Extend `FeatureGroupKey` with `"shopfront"`.
- Add `FEATURE_GROUPS` entry:
  - key: `shopfront`, label: "Shop-front", icon: `Globe` (or `LayoutTemplate`)
  - desc: "Your own page. Your brand. One link."
  - hero eyebrow: "Personalised shop-front", title: "A page that sells you while you sleep.", sub: "More than a directory profile — a full single-page site at `/c/your-name`. Your photo, your method, your tiers, your proof, your accent colour. Every CTA goes straight into your REPs enquiry inbox."
- Add a `shop-front` entry to `FEATURES`:
  - tag: "Shop-front", oneLiner: "Your own page at `/c/your-name`, deep-linked into REPs enquiries.", group: `shopfront`, `includedIn: ["pro", "studio"]`.
- Add a second `FEATURES` entry **cross-listed under Visibility** so it surfaces on the Visibility pillar page too (either a duplicate `group: "visibility"` row with a "See in Shop-front" link, or a small `crossList` array on the feature — implementation detail decided at build time, preferring the simpler duplicate-row approach to avoid schema churn).
- Update `FEATURES` typing for `slug` union to include `"shop-front"`.

Affected downstream pages auto-pick up the change: `/features` hub, `/for-professionals` overview, header "For Professionals" dropdown, pillar deep-dives.

## 3. New deep-dive page `/features/shop-front`

- New route `src/routes/features.shop-front.tsx` using `FeaturePageLayout`.
- Hero references the locked mock-up (link to `/c/james-wilson` as a live example).
- Sections: "What's on the page" (hero/about/services/method/transformations/reviews/FAQ/contact), "Your brand, lightly" (accent token, hero photo, tier ordering), "Wired into REPs" (every enquire button deep-links into the locked enquiry flow; replies tracked in the Pro inbox; reviews shown are the same verified reviews), "How it compares" (Trainerize/MyPTHub/PT Distinction don't publish a public single-page site under your name).
- Add SEO `head()` and link from the new pillar hub page.

## 4. Pricing data — add shop-front to Pro and Studio

Edit `src/components/pricing/pricing-data.ts`:

- `PLANS.pro.features`: insert `"Personalised shop-front page (/c/your-name)"` near the top of the list (above "Bookings, calendar & payments").
- `PLANS.studio.features`: insert `"Personalised shop-front (team accent options)"`.
- Leave Verified unchanged (no shop-front access). Optionally tighten Verified copy to "Enhanced directory profile" (already present) to make the contrast explicit.

Add a new `COMPARE_GROUPS` section **"Your public presence"** with rows:

| Row | Verified | Pro | Studio |
|---|---|---|---|
| Verified directory profile (`/pro/your-name`) | ✓ | ✓ | ✓ |
| Personalised shop-front (`/c/your-name`) | — | ✓ | ✓ |
| Custom accent colour + hero photo | — | ✓ | ✓ |
| Tiered services with "Most popular" highlight | — | ✓ | ✓ |
| Foundation Method / methodology section | — | ✓ | ✓ |
| Transformations & proof cards | — | ✓ | ✓ |
| Team / studio accent options | — | — | ✓ |

Place this group directly after the existing "Visibility & trust" group so the upgrade story reads cleanly.

Update `pricing.tsx` hero subhead lightly only if needed — no structural change.

## 5. `/for-professionals` overview

- Add a new pillar tile for "Shop-front" to whichever component renders the 5-pillar grid (`PillarTabs` and/or the pillar grid on `for-professionals.tsx`). It becomes a 6-tile grid (3×2 on desktop).
- Add a short hero callout: "Now includes your own page at `/c/your-name`." with a "See an example" link to `/c/james-wilson` (opens in new tab, with `noindex` already on that route).
- Update the "What you get for £59" / value-stack section (if present) to include shop-front as a bullet.

## 6. Competitor compare pages

For each of `/compare/reps-vs-trainerize`, `/compare/reps-vs-mypthub`, `/compare/reps-vs-pt-distinction`:

- Add a row in the feature matrix: "Public single-page site at a personal URL" → REPs ✓, competitor ✗ (or "client portal only" — verified against `src/data/competitor-data.ts` before publishing).
- Add a short editorial paragraph in `src/data/competitor-editorial.ts` under each competitor: REPs gives every Pro a public-facing shop-front; Trainerize/MyPTHub/PT Distinction give you a client portal behind a login, not a public page.
- Keep methodology + "Last checked" footer (per `mem://content/comparison-rules`).

Also extend `src/data/feature-matrix.ts` so the shared compare matrix carries the new row.

## 7. Header dropdown / nav

- Update `src/components/public/nav-config.ts` "For Professionals" dropdown to include the Shop-front pillar entry (icon, label, blurb, `/features/shop-front`).

## 8. Doc-sync pass

Run the `doc-sync-source-of-truth` skill to update `docs/03_reps_page_by_page_specification.md` and any other doc that lists pillars or describes what a Pro plan includes. Add `/c/$slug` to the page-by-page spec as a locked Phase 1 page. Report exits 0.

## Out of scope (Phase 1 lock still holds)

- No new DB tables, no real personalisation backend, no per-coach accent picker UI in the dashboard. Shop-front stays a static mock-up at `/c/james-wilson` with the locked tokens; dashboard wiring is a later phase.
- No price changes. £99/yr Verified, £59/mo Founding Pro, £149/mo Studio remain the ladder.
- No copy that says "claim your page" or treats `/c/$slug` as a sales page for trainers — it's the perfect mock-up, not an upsell surface.

## Technical notes

- New pillar key `shopfront` requires updating the `FeatureGroupKey` union and the `PillarPage`/`FeatureGroupLayout` routing if they switch on the key.
- The cross-listing under Visibility is implemented as a second `FEATURES` row with `group: "visibility"`, `tag: "Shop-front"`, and a link to `/features/shop-front` (cheapest, keeps the existing array-driven rendering intact).
- Pricing comparison table is data-only — `PricingCompare.tsx` already iterates `COMPARE_GROUPS`, no component changes needed.
- Memory updates go through `code--write mem://...`; the index file replace must preserve every existing line.
