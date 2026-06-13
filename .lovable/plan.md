## Plan: wire your Stripe test keys

I checked the codebase and the publishable key is **not actually used anywhere** — there's no Stripe.js / Elements on the client. Checkout and Identity both run server-side via `STRIPE_SECRET_KEY`, and the webhook uses `STRIPE_WEBHOOK_SECRET`. So we only need to set two runtime secrets.

### Steps

1. Open the secure update form for `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET` (single modal, both fields).
   - `STRIPE_SECRET_KEY` → your `sk_test_…` standard secret key
   - `STRIPE_WEBHOOK_SECRET` → the `whsec_…` from the single webhook endpoint covering Checkout, Billing, and Identity events
2. No file edits, no `.env` changes, no publishable key needed.
3. After saving, the Verified £99/yr and Pro Founding £59/mo Checkout flows + the Stripe Identity verification flow will be live in test mode end-to-end.

If later we add Stripe.js on the client (e.g. embedded Elements instead of redirect Checkout), we'll add `VITE_STRIPE_PUBLISHABLE_KEY` to `.env` then — not now.

Approve to switch to build mode and I'll open the secrets modal.