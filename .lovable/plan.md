# Fix: Training-provider signup uses a different (broken) flow

## What the audit found

The screenshot you sent is `/signup?tier=core&period=annual&next=checkout` — the **good** flow. `/training-providers/apply` uses a completely different, older pattern which is why it doesn't behave the same.

**Good flow (Core, Pro) — `src/routes/signup.tsx` + `deferred-signup.functions.ts`:**
1. Credentials stashed encrypted in `pending_signups` — no `auth.users` row yet.
2. Stripe Checkout Session minted immediately.
3. Account only created after payment succeeds (webhook + `/checkout/return`).
4. No orphan accounts, no premature welcome emails, no email-confirm friction.

**Current training-provider flow — `src/routes/training-providers.apply.tsx` + `startOrgCheckout.ts` + `org-checkout.functions.ts`:**
1. Calls `supabase.auth.signUp()` first → creates a real user with email confirmation.
2. Only *then* calls the authenticated `createOrgCheckoutSession` server fn.
3. If they abandon Stripe → orphan account. If email-confirm is on → they can't even reach checkout without clicking a link.
4. Uses lookup key `training_provider_annual` (£479/yr, product "REPs LMS").

Also: the last turn created `training_provider_annual` in the **sandbox** Stripe account only. On `repsuk.org` / `www.repsuk.org` the app uses **live** Stripe (see `stripe-client.ts` `isLiveHost`), where that lookup key does not exist yet — so real users hit a "no such price" error.

## The fix

Collapse the training-provider path into the same deferred flow so it behaves identically to Core, and provision the live Stripe product.

### 1. Widen the deferred flow to accept `training_provider`

- `src/lib/billing.ts`
  - Add `training_provider` to `CHECKOUT_OFFERS` (annual, `priceId: "training_provider_annual"`, `trialDays: 0`, `founding: false`, `display: "£479/yr"`).
  - Broaden `PurchasableTier` to `"verified" | "pro" | "training_provider"` (or introduce a superset used only by checkout code so the rest of the UI is unaffected).
- `src/lib/billing/deferred-signup.functions.ts`
  - Extend the Zod tier enum to include `"training_provider"`.
  - Skip the pro-waitlist guard for `training_provider`.
  - Use REPs-LMS-specific `custom_text.submit.message` ("You're joining REPs LMS — public listing, verified reviews, endorsed courses.").
  - `cancel_url`: `${origin}/training-providers?checkout=canceled`.
  - `success_url`: unchanged (`/checkout/return?session_id=…`).
- New migration `supabase/migrations/…_pending_signups_allow_training_provider.sql`:
  ```sql
  ALTER TABLE public.pending_signups DROP CONSTRAINT IF EXISTS pending_signups_tier_check;
  ALTER TABLE public.pending_signups ADD CONSTRAINT pending_signups_tier_check
    CHECK (tier IN ('verified','pro','studio','training_provider'));
  ```

### 2. Teach `/signup` about the LMS tier

- `src/routes/signup.tsx`
  - `SignupSearch.tier`: add `"training_provider"` (accept URL slug `training-provider` and normalise).
  - Skip the `if (tier === "pro") redirect("/contact")` branch for `training_provider`.
  - Add `PLAN_SUMMARIES.training_provider.annual`:
    - name: **REPs LMS**, tagline: *"Independent endorsement for the courses you deliver."*
    - price `£479`, unit `/year`, meta `£479 billed yearly`.
    - highlights: independent course review, provider website + endorsement badge, verified learner reviews, `£15` per-learner certificate.
  - Pass `tier: "training_provider"` straight through to `startDeferredCheckout` (no `verified` remap).
  - CTA label: "Continue to payment" for training_provider (same as Core).

### 3. Retire the bespoke apply page

- `src/routes/training-providers.apply.tsx` — replace with a `beforeLoad` that just redirects:
  ```ts
  throw redirect({
    to: "/signup",
    search: { tier: "training-provider", period: "annual", next: "checkout" },
  });
  ```
  Keeps every existing "Apply" CTA link working; no more custom form, no more `supabase.auth.signUp` here.
- Leave `org-checkout.functions.ts` / `startOrgCheckout.ts` alone for now (kept as internal admin/upgrade tooling), but remove all client callers.

### 4. Webhook behaviour — already correct, verify only

`src/routes/api/public/payments/webhook.ts`:
- `checkoutOfferForPriceId` already maps `training_provider_annual` → `{ tier: "training_provider", period: "annual" }` via the `ORG_TIERS` lookup in `billing.ts` (line 132).
- Line 215 already sets `professionals.account_type = 'training_provider'` on `checkout.session.completed`.
- The deferred-signup branch (line ~789) resolves `reps_pending_signup_id` → provisions `auth.users` from `pending_signups`. This runs regardless of tier, so the LMS path is picked up automatically.
- QA step only: confirm end-to-end that a paid LMS pending-signup produces (a) confirmed auth user, (b) `subscriptions.tier='training_provider' status='active'`, (c) `professionals.account_type='training_provider'`.

### 5. Live Stripe product "REPs LMS"

Sandbox price was created in the previous turn. Live is missing. In build mode I will use the live Stripe secret to create:
- Product `REPs LMS` (metadata `tier=training_provider`, `billing_period=annual`).
- Price £479 GBP recurring yearly with `lookup_key=training_provider_annual`.

If a matching product already exists in live under a different name, I'll attach the price to it rather than creating a duplicate. Nothing else changes — the code resolves live vs sandbox automatically via `getStripeEnvironment()` in `stripe-client.ts`.

## QA plan (Playwright + Stripe test card 4242…) after implementation

1. Visit `/training-providers/apply` on preview → 302s to `/signup?tier=training-provider&period=annual&next=checkout`.
2. Confirm the left plan card renders **REPs LMS · £479/year** with the four LMS highlights (not REPS Core / £34).
3. Fill signup form → redirects to Stripe Hosted Checkout showing "REPs LMS" line item at £479.
4. Cancel → lands on `/training-providers?checkout=canceled` (marketing page renders).
5. Complete payment (test card) → `/checkout/return` → dashboard, signed in.
6. Verify DB: `subscriptions.tier='training_provider' status='active'`, `professionals.account_type='training_provider'`, no `pending_signups` row remaining.
7. Repeat the click on live-mirror preview to confirm the live price resolves (no "no such price" error).
8. Existing Core flow (`/signup?tier=core&period=annual&next=checkout`) still works unchanged — regression sweep.

## Files touched

```text
src/lib/billing.ts                                       (extend types + CHECKOUT_OFFERS)
src/lib/billing/deferred-signup.functions.ts             (accept training_provider)
src/routes/signup.tsx                                    (accept training-provider slug + summary)
src/routes/training-providers.apply.tsx                  (collapse to redirect)
supabase/migrations/<ts>_pending_signups_allow_training_provider.sql   (new)
```

Plus one runtime step: create live Stripe product/price via API.

No visual changes to any locked page. `/training-providers` marketing page and every "Apply" CTA remain in place — only where they land changes.
