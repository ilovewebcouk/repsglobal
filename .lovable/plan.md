## Problem
The live Stripe webhook endpoint has a 100% failure rate because `STRIPE_WEBHOOK_SECRET_LIVE` does not match the signing secret on the active Stripe destination. This prevents subscription events from writing to the database, so Heather Long (and any other live checkout) shows as `Free` despite having a Stripe trial.

## Steps
1. **Update the live webhook secret**
   - Use the secure secrets form to update `STRIPE_WEBHOOK_SECRET_LIVE` to the current signing secret from the active Stripe webhook destination.

2. **Verify webhook delivery resumes**
   - Trigger a test event or wait for the next live event.
   - Confirm Stripe Workbench shows successful delivery (not 400/"Webhook Error").
   - Check `payment_events` for a new row with `processing_error IS NULL`.

3. **Backfill Heather Long's subscription**
   - Run a one-off server function (or resend her historical events from Stripe Workbench) to create her `subscriptions` row from Stripe.
   - Verify `/admin/professionals` shows her plan as **Pro (trialing)**.

## Out of scope
- No changes to the professionals table, admin UI, billing logic, or Stripe integration code.
- No new migrations.
- No changes to BD migration or checkout flow.

## Success criteria
- Live webhook failure rate drops to 0%.
- Heather Long appears as Pro (trialing) in the admin professionals table.
- New live checkouts automatically reflect the correct plan/tier.