# Implement Premium Public Profile Page (code, not reinterpretation)

Do not reinterpret the design. Implement the component supplied in the brief and wire it to existing route/data exactly.

## Scope

- `/pro/:slug` (DB-backed profiles) rendered through a new `PremiumPublicProfilePage` component.
- Untouched: `/c/:slug`, enquiry route, review submission, public visibility gating, billing/subscription visibility, `james-carter` fixture behavior.

## Files

### 1. `src/lib/profile/public-profile.functions.ts`
Widen the returned `services` shape to expose fields already SELECTed (`price_unit`, `bullets`, `cta_label`, `image_url`, `is_featured`). No new SELECT fields, no fake fields.

### 2. `src/routes/pro.$slug.index.tsx`
- Update `Pro["services"]` type to add `mode`, `priceUnit`, `bullets`, `ctaLabel`, `isFeatured`.
- Add helpers: `servicePriceLabel`, `serviceUnitLabel`, `yearsFromApprovedQualifications`.
- In `proFromDb`:
  - Replace the `memberSince → years` derivation with `yearsFromApprovedQualifications(row.qualifications)`.
  - Replace DB service mapping with the richer mapping from the brief.
  - Remove `template.services` fallback for DB-backed pros (fixture leak).
- Replace the big JSX return in `ProProfilePage` with `<PremiumPublicProfilePage ... />`, passing `pro`, `slug`, `professionalId`, `reviewSummary`, `reviews`, `formatReviewWhen`, `onTrackCta`. Do not pass `onSaveProfile` (no real implementation).
- Delete the `STATS` constant and any render of the static marketplace stat strip. Delete unused imports (`Globe`, `Calendar`, `Star` if unused after).
- Leave the fixture branch (`james-carter`) rendering the existing legacy JSX untouched, OR route the fixture through `PremiumPublicProfilePage` too — pick a single behavior for consistency. **Recommendation:** route fixture through the new component as well (matches brief acceptance #1 pattern) but keep `noindex` head on fixtures.

### 3. `src/components/profile/public/PremiumPublicProfilePage.tsx` (new)
Create exactly per the brief. Sections: hero (portrait + identity + right enquiry card), trust strip, best-for module (derived from real data via `buildBestFor`), about, services (real rows only, empty state if none, `Featured` badge only from `is_featured`), quick details, location & coverage (`LocationMap` marker only — no radius circle), qualifications, trust assurance (dates from `trust`), reviews (empty state when 0), FAQ (hidden if none), bottom CTA, mobile sticky CTA.

Uses `PublicHeader`, `PublicFooter`, `Breadcrumb`, `LocationMap`, `Monogram`, `professions` helpers — all already present.

## Data honesty (enforced)

- No James Carter fixture data on DB profiles.
- No static marketplace stats.
- `member_since` never displayed as years qualified — years derive from earliest approved qualification issue year.
- No hard-coded 15km coverage or coverage circle on the map.
- No fake "Most popular"; `Featured` only from `is_featured`.
- No fake response rate, phone number, client count.
- Missing services / reviews / FAQ → clean empty state or hidden section.

## Analytics

Preserve existing `track.profileView` call in the route; wire `track.profileCtaClick` via `onTrackCta` prop for hero/sidebar/service/bottom/mobile CTAs.

## Acceptance

1. `/pro/jordon-gumbley` renders through `PremiumPublicProfilePage`.
2. `/c/jordon-gumbley` untouched.
3. No James Carter fixture services/reviews/stats on DB profiles.
4. No static marketplace stats.
5. `member_since` not shown as years qualified.
6. Services use real `services` rows.
7. `Featured` badge only from `is_featured`.
8. Location card invents no 15km radius; map shows marker only.
9. Empty states for missing services / reviews; FAQ hidden if none.
10. Enquiry links → `/pro/$slug/enquire`; profile view + CTA tracking still fire.
11. Typecheck passes.
12. Desktop + mobile screenshots captured for verification.

## Verification

After edits: `bunx tsgo --noEmit` (targeted), then Playwright screenshot `/pro/jordon-gumbley` at 1280 and 390 widths saved to `/tmp/browser/premium-profile/`.
