# Tier restructure: Verified / Pro / Studio

Collapse the ladder from **Free / Verified / Pro / Business / Studio** down to **Verified / Pro / Studio**, where the new **Pro** is the current **Business** (price, features, Founding lock — same Stripe price IDs).

## Final ladder

| Tier | Price | Stripe price IDs |
|---|---|---|
| Verified | £12/mo · £99/yr | unchanged |
| **Pro (new)** | £59/mo · £590/yr · Founding locked-for-life | current `business` IDs reused |
| Studio | £149/mo · £1,490/yr | unchanged |

Free tier and the old £29/mo Pro tier are removed entirely (no live subscribers in Phase 1).

## Changes

### 1. Billing source of truth
`src/lib/billing/prices.ts`
- Drop the `pro` block (the £29 one).
- Rename current `business` → `pro` (keep the same `priceId`s and amounts: £59/mo, £590/yr, founding `true`, display "£59/mo (Founding)" / "£590/yr (Founding)").
- Update `BillingTier` to `"verified" | "pro" | "studio"`.
- Update header comment.

### 2. Pricing data
`src/components/pricing/pricing-data.ts`
- `PlanTierKey` → `"verified" | "pro" | "studio"`. Remove the `free` and old `pro` entries from `PLANS`.
- New `pro` entry = current Business content (desc, features, CTAs) with prices £59/mo · £49/mo annual (£590/yr) and `was`/founding flags preserved.
- Add a `studio` entry in `PLANS` (so the 3-up grid renders consistently) using existing `STUDIO_PRICING`. Decide if `STUDIO_PRICING` stays as a separate export or folds into `PLANS` — fold it in for simplicity.
- `TierKey` → `"verified" | "pro" | "studio"`. Rebuild every `PricingCompare` row: drop the `business` column; the new `pro` column takes whatever `business` had (since features roll up); drop the legacy `pro` (£29) column entirely.
- `TIER_META`: `verified £99/yr`, `pro £59/mo`, `studio £149/mo`.
- FAQ rewrites:
  - Drop "Is REPs really free to join?" (no Free tier).
  - Rewrite Verified-vs-Pro question to reference the new Pro feature set.
  - Update the booking-fee answer's tier list to `(Verified / Pro / Studio)`.

### 3. Pricing page UI
`src/components/pricing/PricingPlans.tsx`
- Render 3 cards (Verified / Pro / Studio). Remove the separate Studio side-card pattern if `STUDIO_PRICING` is folded into `PLANS`. Highlight Pro as "Most popular".
- `src/components/pricing/PricingCompare.tsx`: `activeTier` default `"pro"`; remove Business column; column headers from updated `TIER_META`.
- `src/components/pricing/FoundingBanner.tsx`: one founding line — "Lock in **£59/mo Pro** before public launch."
- `src/components/pricing/PricingFAQ.tsx`: audit copy for "Free" / "Business" references.
- `src/routes/pricing.tsx`: hero subhead + the "Every feature, every REPs tier" caption — remove "Free" and "Business" from the list; update meta description ("Verified £99/yr, Founding Pro from £49/mo, Studio £149/mo — locked for life before public launch.").

### 4. Compare hub + REPs-vs-* pages
`src/data/competitor-data.ts`
- `REPS_TIER_REFERENCE` / `REPS_GLOBAL.tiers`: 3 entries (Verified / Pro / Studio) with new prices.
- `REPS_GLOBAL` summary line, FAQ answers, scenario "best for" lines, `REPS_SIDE` "REPs Pro £29/mo" → "REPs Pro £59/mo", and the `freeTrial` line ("Founding pricing locked for early Pro members").

`src/data/competitor-editorial.ts`
- Sweep for "Free / Verified £99/yr / Pro £29/mo / Business £59/mo" intros and rewrite to "Verified £99/yr / Pro £59/mo / Studio £149/mo". Update any "REPs cost" cells in day-in-the-life tables.

`src/components/marketing/PlansLimitsStrip.tsx`
- `RepsCard`: headline "3-tier ladder" + line "Verified £99/yr · Pro £59/mo · Studio £149/mo".

`src/components/marketing/CostCalculator.tsx`
- `pickRepsTier(clients)`: drop the Free branch; ≤5 → Verified, ≤50 → Pro (£59/mo), >50 → Studio (£149/mo). Update card copy from "the Pro tier" wording where it implies £29.

`src/components/marketing/HeadToHead.tsx`, `HiddenAddOns.tsx`, `CompetitorCompare.tsx`
- Audit hero bullets, intro copy, and any "your REPs tier" references that name specific tier prices.

`src/data/feature-matrix.ts`
- Re-check "From Pro tier" notes — they still read correctly under the new Pro since the new Pro is a superset.

### 5. Memory + docs
- Update `mem://index.md` Core rule: change "4-tier ladder (Free / Verified £99/yr / Pro £29/mo / Business £59/mo)" → "3-tier ladder (Verified £99/yr / Pro £59/mo / Studio £149/mo)".
- Update `mem://content/comparison-rules.md` likewise.
- `docs/01_reps_master_product_scope.md` and any other doc that lists the tier ladder — sweep and update.

### 6. Sanity sweep
After edits, grep the project for: `£29`, `Business £`, `business"` (in tier contexts), `tierKey: "free"`, `BillingTier`, `"business"` (as a tier key) to make sure no stale references remain. Typecheck must pass since `PlanTierKey` / `TierKey` / `BillingTier` all narrow.

## Out of scope

- No changes to Stripe in the dashboard (price IDs are reused as-is).
- No migration logic for old £29 Pro subscribers (none exist).
- No changes to the comparison methodology page, scorecards, or scenario cards beyond price/tier-name swaps.
- No new components.
