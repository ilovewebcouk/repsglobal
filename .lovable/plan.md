# Wire "Apply to become a provider" → Stripe checkout (£479/yr LMS)

Today the three CTAs on `/training-providers` all point to `/signup?type=training_provider`, which drops users into the standard member signup with no plan preselected and no checkout kicked. We'll turn them into real "start checkout" buttons for the REPs LMS annual membership.

The price is already configured in `src/lib/billing.ts` (`ORG_TIERS.training_provider`: lookup key `training_provider_annual`, £479/yr) — no billing config changes needed.

## What changes

### 1. New server function: `createOrgCheckoutSession`
File: `src/lib/billing/org-checkout.functions.ts`

- Auth-required (`requireSupabaseAuth`), same pattern as `createCheckoutSession`.
- Input: `{ environment: 'sandbox' | 'live', gaClientId? }` (tier is implicit — only one org tier today).
- Resolves the Stripe price via `ORG_TIERS.training_provider.stripePriceLookupKey`.
- Reuses `getOrCreateCustomer` + `createStripeClient` from the member checkout.
- Creates a Stripe subscription checkout session with:
  - `success_url: /checkout/return?session_id=...&kind=org`
  - `cancel_url: /training-providers?checkout=canceled`
  - Metadata: `reps_user_id`, `tier: 'training_provider'`, `billing_period: 'annual'`, `environment`, `ga_client_id`.
- Returns `{ url } | { error }`.

### 2. Small client helper: `useStartOrgCheckout`
File: `src/lib/billing/use-start-org-checkout.ts`

- Wraps `useServerFn(createOrgCheckoutSession)`.
- Reads GA `_ga` client id (same helper the member flow uses).
- If unauthenticated → `navigate('/signup?type=training_provider&next=checkout')`.
- If authenticated → call server fn and `window.location.assign(url)`.

### 3. Signup: honour `type=training_provider&next=checkout`
File: `src/routes/signup.tsx`

- Extend the `SignupSearch` type with `type?: 'training_provider'`.
- If `type === 'training_provider' && next === 'checkout'`, after successful signup / session hydration, call the new `createOrgCheckoutSession` and redirect to Stripe (mirrors the existing member `continueAfterAuth` path, but for the org tier).
- If already signed in and lands on `/signup?type=training_provider&next=checkout`, kick checkout immediately (same as current member behaviour).
- Auth page (`/auth`) already forwards `next` params; no change needed there.

### 4. Update the three CTAs on `/training-providers`
File: `src/routes/training-providers.tsx` (lines 357, 669, 756)

- Replace the three `<a href="/signup?type=training_provider">Apply to become a provider</a>` with a shared `<ApplyProviderButton />` component that:
  - Uses `useStartOrgCheckout`.
  - Shows a small inline spinner while the checkout URL is being created.
  - Keeps identical styling (`h-12 rounded-[10px] bg-reps-orange ...`) so the hero and section visuals don't change.
- No visual redesign — CTAs look the same, only the target changes.

### 5. Webhook: activate training-provider on paid checkout
File: `src/routes/api/public/payments/webhook.ts`

- In `checkout.session.completed` / `customer.subscription.created|updated`, detect `metadata.tier === 'training_provider'` and:
  - Set `professionals.account_type = 'training_provider'` for the `reps_user_id`.
  - Upsert a `subscriptions` row (`tier: 'training_provider'`, `status: 'active'`, `billing_period: 'annual'`, `stripe_subscription_id`, `current_period_end`).
  - Same downgrade/cancel handling as the member tiers (mark `canceled` / `past_due` on the same events).
- Mirrors what `setTrainingProviderPlan` does today, but driven by Stripe instead of admin QA.

### 6. Return page copy
File: `src/routes/checkout.return.tsx` (only if a training-provider branch is missing)

- If the session's `tier` metadata is `training_provider`, show a short "Your REPs LMS membership is active — next step: submit your first course for review" panel and CTA into the provider dashboard. Otherwise leave the existing member copy untouched.

## Out of scope
- No changes to `ORG_TIERS` pricing or Stripe products (price already exists at £479 lookup key `training_provider_annual`).
- No new marketing/design work on `/training-providers` — visuals are locked, only anchor targets change.
- No changes to the existing member `createCheckoutSession` path.
- No new admin surfaces — `setTrainingProviderPlan` (admin QA) stays as-is for manual flips.

## Technical notes
- Stripe price MUST have the lookup key `training_provider_annual` set in both sandbox and live for `resolvePriceByLookupKey` to find it. If it's not set in Stripe yet, the first checkout call will surface a clear error — we should confirm this is configured before shipping.
- Signed-out users go through `/signup?type=training_provider&next=checkout` so the "professional" record exists before Stripe fires the webhook. This matches the existing member flow.
- Locked visuals on `/training-providers` are preserved — the three button DOM nodes keep the same classes and inner `ArrowRight` icon; only the element type changes from `<a>` to `<button>`.
