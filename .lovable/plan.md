## Stripe setup to make this sane

### Correct environment model
- **Staging** (`staging.repsuk.org`) uses **Stripe sandbox/test** only.
- **Live site** (`repsuk.org`, when added later) uses **Stripe live** only.
- **No restricted key is required.** The app uses one normal Stripe secret key per environment plus one webhook signing secret per environment.

### What already exists in the app
- The webhook route is already correct: `/api/public/stripe/webhook`
- It already handles both:
  - **Identity events**
  - **Subscription / checkout / invoice events**
- The current billing price IDs live in `src/lib/billing.ts`
- The current Stripe secret key is **integration-managed**, which is why the generic secret editor failed on it.

### What we need to do next
1. Link the project to the **Stripe (sandbox)** connection for staging, or rotate the Stripe integration so the project uses the sandbox/test Stripe account instead of live.
2. Keep `STRIPE_WEBHOOK_SECRET` set to the **test-mode** webhook signing secret for staging.
3. Update `src/lib/billing.ts` so the staging build points at the **test** price IDs for:
   - Verified £99/yr
   - Pro £59/mo Founding
   - and, if still used in checkout, Pro annual Founding too
4. Re-test on staging:
   - verification session creation
   - document upload
   - identity webhook delivery
   - checkout session creation
   - subscription webhook delivery

### Exact Stripe webhook events staging should listen to
**Identity**
- `identity.verification_session.created`
- `identity.verification_session.processing`
- `identity.verification_session.verified`
- `identity.verification_session.requires_input`
- `identity.verification_session.canceled`

**Billing / subscriptions**
- `checkout.session.completed`
- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `invoice.payment_succeeded`
- `invoice.payment_failed`

These are the events the current webhook code actually handles.

### Technical note
The current project has both a **Stripe (live)** and **Stripe (sandbox)** connector available. The next implementation step should be to switch this project to the **sandbox** Stripe connection for staging, then wire the test `price_...` IDs into `src/lib/billing.ts`.

### What I need from you
- Confirm you want me to switch the project over to the **Stripe (sandbox)** connection for staging.
- Paste the **test** `price_...` IDs you want used in staging for:
  - Verified annual
  - Pro monthly
  - Pro annual (if you still want that offer available in staging)
