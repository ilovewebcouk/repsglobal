## Why

`/compare/reps-vs-*` pages currently treat Verified (£99/yr) as a comparable software tier against Trainerize / MyPTHub / PT Distinction. Verified is a public register listing, not coaching software. The fair like-for-like is **REPs Pro £59/mo** (founding) only.

`/pricing` and `src/components/pricing/pricing-data.ts` are already correct against your spec — verified line by line:

- Verified: £12/mo, £8.25/mo annual (£99/yr, 2 months free) ✓
- Pro: £59/mo (was £79) founding, £49/mo annual (was £66, £590/yr) ✓
- Studio: £149/mo, £124/mo annual (£1,490/yr) ✓
- No "Free profile" card in `PLANS` ✓

So this is a **competitor-pages copy + Free-profile CTA cleanup** task. No `pricing-data.ts` changes needed.

## Changes

### 1. `src/components/marketing/PlansLimitsStrip.tsx` (REPs card on every /compare/* page)
- Headline becomes **`£59/mo` · REPs Pro** with a sub-line "Unlimited clients · Founding pricing (was £79/mo)".
- Body block stays the same wording about no paid add-ons / per-client charges, but anchored to Pro: *"Every feature listed here is included in Pro — directory profile, verification, CRM, bookings, payments, programmes, check-ins, nutrition, client portal and REPs AI. No paid add-on stack."*
- Add one quiet aside line at the bottom of the REPs card: *"Verified (£99/yr) is a separate public register listing, not coaching software, and is not included in this comparison. See [/pricing](/pricing) for the full ladder."*

### 2. `src/components/marketing/CostCalculator.tsx`
- `pickRepsTier()` collapses to a single branch: always returns `{ label: "Pro", price: "£59", unit: "mo" }`.
- Remove the `≤5 → Verified` and `>50 → Studio` branches. `RepsTier.unit` type kept (`"mo" | "yr"`) so we don't touch consumers, but only `"mo"` is ever returned.

### 3. `src/data/competitor-editorial.ts`
- `REPS_TIER_LADDER_LINE` is replaced by `REPS_PRO_LINE`:
  *"REPs Pro is £59/mo (founding, was £79/mo) and includes the full software platform — directory profile, verification, CRM, bookings, payments, programmes, check-ins, nutrition, client portal and REPs AI. No paid add-on stack or per-client charges."*
- For **each** competitor (`trainerize`, `mypthub`, `pt-distinction`):
  - **scenarios[]** — every `repsCost` becomes `REPs Pro £59/mo`. Scenario summaries rewritten so they read honestly at each client count (small roster: acknowledge competitor entry tier may be cheaper but lacks discoverability + AI; sweet-spot: REPs wins; large/multi-trainer: drop Studio framing, compare Pro at the same scale — Trainerize Studio Plus scenario keeps competitor win, but framed as "if you're an ABC multi-location facility, stay; otherwise Pro covers the same individual coach needs").
  - **intro / costStory** — remove "3-tier ladder · Verified £99/yr / Pro £59/mo / Studio £149/mo" recitations. Replace with one tight Pro-focused paragraph using the new `REPS_PRO_LINE`. Add the same one-line Verified aside (matching the strip wording).
  - **FAQs** — rewrite "Does X have a free plan / trial?" and similar to reference Pro only. Keep the founding-Pro note. Keep negations like "REPs does not charge a booking commission" (those negations are explicitly allowed by the memory rules).
- The framing-rule comment block at the top of the file is updated to: *"Comparison pages compare REPs Pro (£59/mo, founding) only. Verified and Studio are mentioned at most as a one-line aside."*

### 4. `src/data/competitor-data.ts`
- `REPS_TIER_REFERENCE.summary` rewritten to the Pro-only line above. (The `tiers` array stays — `/pricing` doesn't consume this file, but the array is still useful internally; we just stop using it on /compare pages.)
- `REPS_SIDE.whatsIncluded` already reads from `REPS_TIER_REFERENCE.summary`, so it updates automatically.
- Confirm `REPS_SIDE.tiers` is already `[{ name: "REPs Pro", price: "£59/mo", clientCap: "Unlimited" }]` — it is. No change.

### 5. "Free profile" CTA cleanup (you said it's not an active plan)
Replace the user-facing "free profile" copy on the three places it leaks into pricing/CTA framing — these are marketing CTAs, not the public pricing cards (which already don't have it):
- `src/components/features/FeaturePageLayout.tsx` line 254 — "Free profile in minutes…" → "Start with Verified or Pro — Founding pricing locked for life on Pro before public launch."
- `src/components/features/FeatureGroupLayout.tsx` line 133 — same swap.
- `src/routes/features.index.tsx` line 110 — same swap.
- `src/routes/for-professionals.tsx` line 169 — CTA button "Create free profile" → "Get verified".

### 6. Banned-phrase sweep (confirmation)
Already audited. The only matches are:
- Negations / disclaimers ("REPs does **not** charge a booking commission") — allowed by memory.
- Comment-only references in `competitor-editorial.ts` and `competitor-data.ts` framing notes — being rewritten in this same change.
- Unrelated numerics ("+15%" adherence chart in dashboard, "15% rehab" client-mix label) — not pricing claims, left alone.

### 7. Memory update
- `mem://content/comparison-rules.md` adds: *"On `/compare/reps-vs-*` pages, compare REPs Pro (£59/mo founding) head-to-head only. Verified appears as a one-line aside ('separate public register listing, not coaching software'). Studio only appears on pages that explicitly discuss teams/studios. The Free profile is not an active pricing plan and must not appear in CTAs as if it were."*

## Out of scope (untouched)

- `pricing-data.ts`, `/pricing`, `PricingPlans.tsx`, `PricingCompare.tsx`, `FoundingBanner.tsx` — already correct.
- `src/lib/billing/prices.ts`, Stripe webhook, `billing.functions.ts` — backend untouched.
- Auth, DB, Supabase, AI functionality.
- Visual tokens (`styles.css`), nav (`PublicHeader`, `nav-config`), footer (`PublicFooter`), homepage (`index.tsx`).
- `/comparison-methodology` and `/faq` — already aligned.
- Free/unclaimed profiles in the directory data model — those stay; only the **CTA framing** that treats Free as a sign-up plan is removed.
