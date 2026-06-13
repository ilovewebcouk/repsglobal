## Goal

Get this project onto **Stripe test mode** so you can run as many checkout / Identity / webhook tests as you want without burning real money. When you're ready to publish to `repsuk.org`, swap back to live keys — a 2-minute job.

## Steps

### 1. You disconnect the current (live) Stripe key
- Open the payments dashboard
- Click the **⋯ menu (top right)** → **Disconnect Stripe**
- This only deletes the key stored in this project. Your Stripe account, products, customers, and any live data are untouched.

### 2. You reconnect with a test key
- In Stripe dashboard → toggle **Test mode** (top right) → **Developers → API keys**
- Copy the **Secret key** that starts with `sk_test_…`
- Back in Lovable, re-enable Stripe and paste the test key

### 3. I update the price IDs in `src/lib/billing.ts`
The current file has live (`price_1Th5cV…`) IDs. In test mode those don't exist. I'll need three **test-mode** price IDs from you:
- Verified — £99/year
- Pro Founding — £59/month
- Pro Founding annual — £590/year

Two ways to get them:
- **Easiest:** I create them for you in test mode via the Stripe tool once the test key is connected, and write the new IDs straight into `billing.ts`.
- **Or:** you create them yourself in Stripe (Test mode → Products) and paste the 3 `price_…` IDs to me.

### 4. I update the test-mode webhook secret
The `STRIPE_WEBHOOK_SECRET` saved earlier is already the test-mode one — good. If the webhook endpoint isn't pointing at this project yet, I'll give you the URL to paste into Stripe (Test mode → Developers → Webhooks).

### 5. We test end-to-end
- Verified £99/yr checkout → confirm webhook flips the row to `active`
- Pro £59/mo checkout → confirm subscription is written
- Identity verification session → upload test docs → confirm row flips to `approved`

Stripe provides test cards (e.g. `4242 4242 4242 4242`) and test Identity documents — zero real money, zero real KYC.

### When you're ready to go live (separate task, later)
- Disconnect test key → reconnect `sk_live_…`
- I swap the 3 price IDs back to the live ones (already in git history)
- Update webhook secret to the live one
- Publish to `repsuk.org`

That's it. No second project, no staging environment, no parallel infrastructure.

## What I need from you to start

1. Confirm you're happy to disconnect the current live key (zero impact on your Stripe account or any data)
2. Once disconnected + reconnected with the `sk_test_…` key, tell me whether you want me to create the 3 test products/prices for you, or you'll create them yourself
