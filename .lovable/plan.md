## Where we actually stand

Phase 0 (June 1 mini-plan) is **decisions-only**: same legal entity, `REPS MEMBERSHIP` statement descriptor, migrate BD members to REPs pricing at next renewal, Stripe Connect for trainer payments, 30-day pending window for new Verified, 12-month grace for migrated members, subscription tier ≠ verification status. These exist only in chat history — nothing to *build*, but nothing locked in a doc either.

Phase 1 (billing migration) was meant to ship the new Stripe Subscriptions surface for Verified (£99/yr) and Pro Founding (£59/mo). That work is **~80% wired** — verified in code:

- `src/lib/billing.ts` — price catalog
- `src/lib/billing/billing.functions.ts` — `createCheckoutSession`, `createPortalSession`, `getMySubscription`, `syncMySubscription`
- `src/routes/api/public/stripe/webhook.ts` — signature-verified webhook with `payment_events` logging
- Checkout is called from `/pricing`, `/signup`, `/dashboard/start`; one live `verified/active` row already in the DB

**The real gaps blocking Phase 2:**

1. **`createPortalSession` is implemented but never called.** Dashboard "Manage billing" still routes to `/dashboard/start` (line 126 of `dashboard.tsx`), so paid members have no way to update card / cancel / view invoices.
2. **Undocumented Pro annual price.** `price_1Th8U8AP31Yc4cJj…Yhvf` (Pro Founding Annual, £590) is referenced in `billing.ts` and confirmed live in Stripe, but is **not** in the `docs/09` price table — silent catalog drift.
3. **Webhook idempotency has a race window.** We `select` `payment_events` first, then process, then `insert` at the end. Stripe can fan duplicate events out in parallel; both pass the select and both process. The table already has a `UNIQUE(stripe_event_id)` constraint — we just need to insert-first.
4. **Resubscribe-after-cancel can accumulate rows.** `subscriptions` is keyed for upsert on `stripe_subscription_id`, but a re-checkout creates a new sub id, so old `canceled` rows linger and `getMySubscription` relies on `updated_at desc` to mask it. Needs an explicit "mark prior rows superseded" step.
5. **Stale "card required" copy** in `pricing-data.ts` FAQ + the COMPARE_GROUPS "30-day free trial" row + `dashboard_.start.tsx` line 132 — already cleaned in `PricingPlans` / `FoundingBanner`, missed here.
6. **Phase 0 decisions are not written down.** No `docs/10_*` lock file — easy to lose.

Everything else flagged in the prior turn (Studio purchasable, monthly toggle for Verified, mock dashboard data) is actually fine on inspection — Studio CTA goes to `/contact`, Verified ignores the toggle and always sends `annual` to checkout, dashboard demo blocks are gated behind `<LockOverlay>`.

## What to ship

### 1. Wire the Customer Portal
- `src/lib/billing/billing.functions.ts` — already exports `createPortalSession`. No change.
- `src/routes/_authenticated/_professional/dashboard.tsx` — when `hasPaidTier`, change the "Manage billing" step CTA to a button that calls `createPortalSession` via `useServerFn` and redirects to the returned URL (replace the `Link to="/dashboard/start"`). Keep the "Choose plan" Link for the no-tier case.
- `src/routes/_authenticated/_professional/_pro/dashboard_.payments.tsx` — add a top-right "Manage subscription" button on the same handler.

### 2. Lock the Pro annual price
- `docs/09_phase2_verified.md` — add `price_1Th8U8AP31Yc4cJjLhq9Yhvf` / £590 / year row under the Pro tier so the price catalog matches code.
- No code change in `billing.ts`.

### 3. Harden webhook idempotency
- `src/routes/api/public/stripe/webhook.ts` — after signature verification, immediately `insert` a `payment_events` row with `stripe_event_id` and a `null` `processed_at`. If the insert fails with the unique-constraint violation, return `{ received: true, duplicate: true }` 200 and stop. Then process the event, then `update` the same row to set `processed_at` (or `processing_error` + 500 for retry).
- Remove the current select-first block at lines 158-170 and the trailing `logEvent` call.

### 4. Clean resubscribe state
- `src/routes/api/public/stripe/webhook.ts` `upsertSubscriptionFromStripe` — when handling a new `customer.subscription.created` for a user whose existing live row has a different `stripe_subscription_id`, mark the prior row's status as `canceled` / null its `current_period_end` before inserting the new one. Keeps `subscriptions` clean and removes the implicit `updated_at desc` dependency.

### 5. Stale-copy sweep
- `src/components/pricing/pricing-data.ts` — drop "Card required" from the COMPARE_GROUPS "30-day free trial" row (change `pro: "Card required"` → `pro: true`); rewrite the "Is there a free trial?" and "Which billing periods are available?" FAQ answers so they don't say "card required at signup". Keep all other wording.
- `src/routes/_authenticated/_professional/dashboard_.start.tsx` line 132 — replace `"30-day free trial · card required · £0 today, then £59/month unless cancelled."` with `"30-day free trial · cancel anytime before day 30."` to match the rest of the site.

### 6. Lock Phase 0 decisions in a doc
Create `docs/10_billing_phase0_decisions.md` capturing the seven decisions from the June 1 chat exchange:
- Same legal entity (REPs); existing BD card mandate carries over.
- Statement descriptor: `REPS MEMBERSHIP`.
- Migration pricing: BD members keep BD price until next renewal, then move to REPs standard pricing.
- Stripe Connect for trainers-take-payments (deferred to a later phase but locked).
- New Verified signups: 30-day pending window before badge appears.
- Migrated BD members: 12 months grace at Verified, then unverified if no cert + insurance.
- Subscription tier is independent of verification status — losing verification never downgrades the paid plan.

Add a short reference line to `mem://index.md` Memories pointing at the new doc.

### 7. Smoke test before declaring Phase 1 done
Run two real test-mode checkouts against the live preview webhook URL (`project--<id>.lovable.app/api/public/stripe/webhook`):
- Verified annual → confirm `subscriptions` row appears `verified/active`, `payment_events` has a `processed_at`, dashboard "Manage billing" opens the portal.
- Pro monthly with the 30-day trial → confirm `trialing` status, `current_period_end` ~30 days out, portal opens, then trigger `customer.subscription.deleted` and confirm the row drops back to `free`.

## Technical notes (for the dev pass)

- `payment_events` already has `UNIQUE(stripe_event_id)`, so the insert-first idempotency lock needs no migration.
- `createPortalSession` already uses `getOrCreateCustomer`, so it just works for the existing live `verified/active` user without any data prep.
- The Stripe API client is loaded inside handlers (per the server-runtime rule); keep it that way in the webhook refactor.

## Out of scope (next phase)

- BD member migration script (loops customers, creates subscriptions against the BD price, sets `migrated_from=bd` metadata + `is_founding=true`). Phase 2.1+.
- Stripe Connect onboarding for trainer-taken payments. Phase 2.1+.
- Auto-downgrade tier when verification grace expires. Handled by a scheduled job, also Phase 2.1+.
- Any visual change to locked screens.
