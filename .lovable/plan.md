## Switch staging.repsuk.org to Stripe Test mode

### Steps you'll do in Stripe Dashboard
1. Toggle Stripe Dashboard to **Test mode** (top-left).
2. **Developers → API keys** → copy the `sk_test_…` Secret key.
3. **Developers → Webhooks → Add endpoint**:
   - URL: `https://staging.repsuk.org/api/public/stripe/webhook`
   - Events: the full list we agreed (5 Identity + Checkout + Customer.subscription + Invoice + Customer + Payment_method + optional Charge/dispute).
   - Save, then copy the **Signing secret** (`whsec_…`).
4. In Test mode, re-create the Verified £99/yr and Pro Founding £59/mo **Products + Prices**, and copy the new `price_…` IDs.

### Steps I'll do in the project (build mode)
1. Use `update_secret` to rotate:
   - `STRIPE_SECRET_KEY` → your new `sk_test_…`
   - `STRIPE_WEBHOOK_SECRET` → your new test-mode `whsec_…`
2. Update `src/lib/billing.ts` to point the Verified and Pro Founding price IDs at the new **test-mode** `price_…` IDs (keeping the live IDs noted in a comment for the production swap later).
3. Confirm `/api/public/stripe/webhook` is reachable on staging (no code change expected) and re-test the Identity flow end-to-end: start verification → upload docs → webhook flips the row to `approved`.

### Production (later, separate task)
When you publish to `repsglobal.lovable.app`, we'll swap the same two secrets back to the `sk_live_…` / live `whsec_…` pair and restore the live `price_…` IDs in `billing.ts`.

### What I need from you before I switch to build mode
- The new `sk_test_…` and test `whsec_…` (you'll paste into the secure secret modals — don't send them in chat).
- The new test-mode `price_…` IDs for Verified £99/yr and Pro Founding £59/mo.
