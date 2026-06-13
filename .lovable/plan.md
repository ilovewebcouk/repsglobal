## Goal
Get test-mode Stripe live in this project so checkout works end-to-end for Verified (£99/yr) and Pro Founding (£59/mo). Studio remains waitlist (no product).

## Steps

1. **Enable Stripe (test mode)** via Lovable's built-in payments integration. This provisions a sandbox automatically — no key paste, no live keys touched. When you're ready to go live later, you'll claim/connect the live account from the same dashboard; staging keeps test, production swaps to live at publish time.

2. **Create test products + prices** in Stripe:
   - Verified — £99 / year
   - Pro Founding — £59 / month
   - Pro Founding — £590 / year (annual option, optional but matches existing `billing.ts`)

3. **Wire the new test price IDs into `src/lib/billing.ts`**, replacing the current placeholders. No UI changes — pricing pages, `/auth`, and checkout server functions already consume from `billing.ts`.

4. **Smoke test** checkout from `/pricing` → Stripe test checkout → webhook updates the `subscriptions` table → user lands back on dashboard with correct tier. Use Stripe test card `4242 4242 4242 4242`.

## Out of scope
- Live Stripe keys (deferred until you're ready to publish to `repsuk.org`).
- Studio tier (waitlist only).
- Any visual changes to locked Phase 1 screens.

## Notes
- All work happens in test mode; no risk to real customers.
- `src/lib/billing.ts` is the single source of truth for price IDs — no other file needs editing.
