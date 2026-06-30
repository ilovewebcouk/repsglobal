## Goal
Make Core monthly £9.90/mo so the £99/yr annual offer genuinely saves ~17% (~2 months), restoring the "Save 2 months" badge across all tiers.

## Changes

### 1. Stripe price
- Update the `verified_monthly` lookup_key price in both Stripe sandbox and live from £8.25 → **£9.90 GBP / month** (recurring).
- Keep `verified_annual` unchanged at £99/yr.
- Archive the old £8.25 price object (lookup_key reassigned to the new one) so existing subscribers stay on their grandfathered price but new checkouts resolve to £9.90.

### 2. `src/components/pricing/pricing-data.ts`
- Core `pricing.monthly`: `price: "£9.90"`, meta `"Billed monthly · cancel anytime"`.
- Core `pricing.annual`: `price: "£8.25"` /mo equivalent, meta `"£99 billed yearly · save ~17%"`.
- `COMPARE_GROUPS` Billing row: "Live offer" Core → `"£9.90/month or £99/year (save ~17%)"`; "Charge today" Core → `"£9.90 or £99"`.
- FAQ "Which billing periods are planned?" answer: update to "Core is £9.90/month billed monthly, or £99/year billed annually (save ~17% — about 2 months free)."

### 3. `src/components/pricing/PricingPlans.tsx`
- Remove the Core-specific exclusion on the "Save 2 months" toggle badge so it shows for all tiers again.

### 4. `src/lib/billing.ts`
- `CHECKOUT_OFFERS.verified.monthly.display`: `"£9.90/mo"`.
- Annual offer unchanged.

### 5. Sweep for stale £8.25 monthly copy
- `rg "8\\.25"` across `src/`, `docs/`, help articles, email templates — update any user-facing mention of £8.25/month to £9.90/month (annual "£8.25/mo equivalent" framing stays).

## QA
- `/pricing` toggle: Monthly shows £9.90 on Core; Annual shows £8.25/mo (£99/yr); "Save 2 months" badge visible on toggle.
- `/signup?tier=verified&period=monthly` → Stripe Checkout resolves £9.90 price.
- `/signup?tier=verified&period=annual` → Stripe Checkout resolves £99 price.
- Compare table + FAQ reflect new numbers.
- Existing £8.25 subscribers unaffected (Stripe keeps their original price).

## Out of scope
- No migration/upgrade emails to existing £8.25 monthly subs (none expected — price was only just created). Flag if any exist for a follow-up decision.