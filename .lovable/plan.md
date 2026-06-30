# Fix Core pricing card + QA Stripe

## Problem
On the pricing page, toggling **Monthly** shows Core as **£8.25 / per month · Billed monthly · cancel anytime**. Core is annual-only (£99/yr). The card should show the **same £99 billed yearly** view regardless of which billing toggle is active. Pro/Studio continue to flip monthly ↔ annual as today.

Separately, Stripe prices were edited recently and need to be reverted/verified so `verified_annual` is back to £99/yr (one-off annual, no monthly Core SKU).

## Frontend fix (src/components/pricing/pricing-data.ts)
Update the `verified` plan so both `monthly` and `annual` views render the canonical annual offer:

```ts
pricing: {
  monthly: { price: "£99", period: "per year", meta: "Billed yearly · cancel anytime" },
  annual:  { price: "£99", period: "per year", meta: "Billed yearly · cancel anytime" },
}
```

No change needed in `PricingPlans.tsx` — it already forces `view = p.pricing.annual` for `tierKey === "verified"`, so once both views match, the card is locked to £99/yr on either toggle. Remove the now-redundant `was`/discount meta if present.

Compare table row "Live offer" in `COMPARE_GROUPS` already reads `£99/year` — leave as-is.

## Stripe QA (read-only first, then revert if drift found)
1. List active prices on the `verified` product via Stripe API (server-side script or admin tool) and confirm:
   - lookup_key `verified_annual` → £99.00 GBP, interval `year`, active
   - lookup_key `verified_legacy_annual` → £34.00 GBP, interval `year`, active (migration honour price — must stay)
   - No new monthly Core price exists; if one was created in the recent edit, deactivate it.
2. If `verified_annual` was edited to a different unit_amount, create a fresh £99/yr price, attach lookup_key `verified_annual` (move from the wrong one), and deactivate the bad price. Stripe prices are immutable on amount, so this is the standard swap.
3. Confirm `src/lib/billing.ts` `CHECKOUT_OFFERS.verified.annual.display` still reads `£99/yr` (it does) and that `getCheckoutOffer("verified","monthly")` correctly returns `null` so the UI can never request a Core monthly checkout.
4. Sanity-check a Stripe Checkout session creation for `verified_annual` returns £99.00 GBP, one-off annual, no trial.

## Technical notes
- `PricingPlans.tsx` line ~73: `const view = p.pricing[p.tierKey === "verified" ? "annual" : billing];` — already protects Core. Fix is purely in `pricing-data.ts` so the annual view text reads cleanly ("Billed yearly · cancel anytime" instead of the misleading "£99 billed yearly · 2 months free" which implies a monthly equivalent).
- Stripe price swap procedure: `prices.create` new → `prices.update(old, { lookup_key: null })` → `prices.update(new, { lookup_key: 'verified_annual', transfer_lookup_key: true })` → `prices.update(old, { active: false })`. Existing subscriptions on the old price ID are unaffected.

## Out of scope
- Pro/Studio pricing, toggle behaviour, founding badges.
- Legacy `verified_legacy_annual` £34/yr honour price (must remain for in-flight BD migrations).