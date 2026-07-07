## Goal

Sweep public-facing copy so the tier is called **Core** everywhere. "Verified" stays only where it refers to the verification **status/badge** (identity + insurance + qualifications check), never as a plan name.

## What to change (tier-name usages only)

**`src/routes/terms.tsx`**
- L94: "currently Verified, Pro and Studio tiers" → "currently Core, Pro and Studio tiers".
- L242: "Verified at £34 per year, Pro Founding at £59 per month" → "Core at £34 per year, Pro Founding at £59 per month".

**`src/routes/comparison-methodology.tsx`**
- L107: "3-tier ladder (Verified, Pro, Studio)" → "3-tier ladder (Core, Pro, Studio)".

**`src/routes/features.visibility.tsx`**
- L154 FAQ answer: "No. Verified gives you the full public profile..." → "No. Core gives you the full public profile...".
- L158 FAQ answer: "Verified profiles are public, indexable pages..." → "Core profiles are public, indexable pages..." (tier context — contrasts with Pro).
- L676 heading: "Verified makes you visible. Pro turns visibility into a working business." → "Core makes you visible. Pro turns visibility into a working business."

**`src/routes/features.website.tsx`**
- L759 Pro card blurb: "Everything in Verified, plus a branded Website..." → "Everything in Core, plus a branded Website...".

**`src/routes/features.operations.tsx`**
- L243 FAQ: "Is Operations included in Verified or only Pro?" → "Is Operations included in Core or only Pro?"
- L855 Pro card blurb: "Everything in Verified, plus the full Operations workspace..." → "Everything in Core, plus...".

**`src/routes/features.growth.tsx`**
- L170 FAQ: "Is Growth included in Verified or only Pro?" → "Is Growth included in Core or only Pro?"
- L964 Pro card blurb: "Everything in Verified, plus the full Growth layer..." → "Everything in Core, plus...".

**`src/routes/features.coaching.tsx`**
- L979 Pro card blurb: "Everything in Verified, plus the full Coaching workspace..." → "Everything in Core, plus...".

**`src/routes/features.ai.tsx`**
- L258 FAQ: "Is REPS AI included in Verified or only Pro?" → "Is REPS AI included in Core or only Pro?"
- L828 Pro card blurb: "Everything in Verified, plus the full REPS AI operating layer..." → "Everything in Core, plus...".

## What NOT to change (correct "Verified" usage — status, not tier)

- `VerifiedBadge.tsx`, `VerificationCard.tsx`, `dashboard/hub` status chips — verification status.
- `for-professionals.tsx` "Verified credentials", "Verified badge", "Verified profile live today", hero eyebrow "Verified · Trusted · Booked" — status/badge language.
- `features.visibility.tsx` "Verified badge", "REPS Verified", "Verified credentials", alt text — status/badge language.
- `feature-content.tsx`, `TestimonialFeature.tsx`, `ForProsFaq.tsx` "Verified badge" — status.
- `RegisterProof.tsx` stat "Verified", `sample-pro.ts` qualification status "Verified", `standards.tsx` "Verified by REPS", `specialisms.tsx` "Verified pros" / "single Verified badge the public can actually trust" — status.
- `about.tsx` / `index.tsx` "Verified professionals" stat — describes the register, not a plan.
- `find-a-professional.tsx` testimonial "Verified, insured, and genuinely good" — status.
- All internal enum values `"verified"` in `.functions.ts`, admin routes, mockups, `signup.tsx` slug-mapping, campaigns, search, billing resolvers — internal identifiers, not user-facing copy. Signup already maps `core` ↔ internal `verified`; leave the enum alone.

## Out of scope

- No visual/layout changes.
- No routing changes.
- No pricing/enum/DB changes.
- No changes to admin surfaces or the locked coach website.

## Verification

`bunx tsgo --noEmit`; then re-grep `rg -n "Verified" src/routes src/components | rg -v "admin_|_authenticated|mockups"` and confirm remaining hits are all status/badge usage.
