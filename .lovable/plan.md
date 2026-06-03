## Goal

Reframe `/compare` as the **REPs vs other platforms** page (powered by `CompetitorCompare`), and move the **REPs plan-by-plan** table (`PricingCompare`) to live under `/pricing`. Update the header label accordingly.

## Changes

**1. `/compare` — competitor comparison page**

Edit `src/routes/compare.tsx`:
- Update `head()` meta: title "Compare REPs with other fitness platforms", matching description + og tags.
- Hero: "Compare REPs with other fitness platforms" + intro paragraph explaining REPs combines public discovery, verification, business operations, coaching delivery and AI in one platform.
- Main content: `<CompetitorCompare />`.
- Short "Where REPs is different" section — 3–4 short cards/points (verified public register, AI operating system, all-in-one vs bolt-ons, UK-built).
- Dual CTA row: "See REPs plans" → `/pricing`, "Join REPs" → `/signup`.
- Remove `<PricingCompare />` from this route.

**2. `/pricing` — add plan-by-plan table**

Edit `src/routes/pricing.tsx`:
- Order: `PricingPlans` → transaction fee explainer → `PricingFAQ` → `PricingCompare` (plan-by-plan) → final CTA "Compare REPs with other platforms" → `/compare`.
- Update `head()` meta only if needed to reflect the expanded scope.

**3. Header label**

Edit `src/components/public/PublicHeader.tsx`:
- In the For Professionals dropdown, rename "Compare plans" → "Compare platforms", link stays `/compare`.
- Mirror the change in the mobile drawer accordion.

**4. Cross-links sweep**

Quick grep for any remaining "Compare plans" copy or stale CTA text in `/for-professionals`, `/features/*`, footers — update to "Compare platforms" where it points to `/compare`, leave plan-tier CTAs ("See plans", "View pricing") pointing to `/pricing`.

## Out of scope

- No `/compare/$competitor` deep-dives.
- No edits to `CompetitorCompare.tsx` or `PricingCompare.tsx` internals (only verify spacing inside the new containers).
- No backend, CMS, auth, payments, or live AI.
- No token, radius, or mock-up changes — Phase 1 visual/content only.

## Files touched

- `src/routes/compare.tsx` (rewrite content)
- `src/routes/pricing.tsx` (append `PricingCompare` + final CTA)
- `src/components/public/PublicHeader.tsx` (label rename, desktop + mobile)
- Minor copy edits in any page still referencing "Compare plans" as the link to `/compare`
