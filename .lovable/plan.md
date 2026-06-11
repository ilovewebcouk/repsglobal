Close the billing-migration Phase 1 gaps so Phase 2 work can start safely.

## Shipped this pass

### 1. Customer Portal wired
- New `src/components/billing/ManageBillingButton.tsx` — shared button that calls `createPortalSession` and redirects to the Stripe-hosted portal.
- `src/routes/_authenticated/_professional/dashboard.tsx` — Finish-setup dialog now renders `ManageBillingButton` instead of the `/dashboard/start` link when the user is on a paid tier.
- `src/routes/_authenticated/_professional/_pro/dashboard_.payments.tsx` — added a "Manage subscription" action button to the page header (Pro-only route).

### 2. Pro annual price documented
- `docs/09_phase2_verified.md` — added the live `price_1Th8U8AP31Yc4cJjLhq9Yhvf` (£590/yr, Pro Founding annual) to the price table so it matches `src/lib/billing.ts`.

### 3. Webhook hardened
- `src/routes/api/public/stripe/webhook.ts` — replaced select-then-insert idempotency with insert-first. After signature verification we INSERT a `payment_events` row immediately; the existing `UNIQUE(stripe_event_id)` constraint becomes the atomic dedupe lock (PG error 23505 → return `{ duplicate: true }` 200). Row is updated with `processed_at` / `processing_error` after handling.
- Same file: replaced the bespoke "find then update or insert" subscription write with `.upsert(..., { onConflict: "user_id" })`. The `subscriptions.user_id` UNIQUE constraint means there's exactly one row per user, so a resubscribe after cancel now overwrites the prior row cleanly instead of failing on the unique-on-user-id insert.
- `src/lib/billing/billing.functions.ts` `syncMySubscription` — same upsert-by-user-id fix applied for parity.

### 4. Stale "card required" copy
- `src/components/pricing/pricing-data.ts` — Billing compare-row changed `pro: "Card required"` → `pro: true`. "Is there a free trial?" + "Which billing periods are available?" FAQ answers rewritten to drop "card required at signup" language.
- `src/routes/_authenticated/_professional/dashboard_.start.tsx` — Pro card subtitle replaced with `30-day free trial · cancel anytime before day 30.`

### 5. Phase 0 decisions locked in a doc
- New `docs/10_billing_phase0_decisions.md` — captures the seven June 1 decisions (legal entity, `REPS MEMBERSHIP` descriptor, migration pricing rule, Stripe Connect, 30-day pending window, 12-month BD grace, tier ≠ verification).
- Memory index already references Phase 2.0 scope; the new doc is linked from there for next session's context.

## Not done in this pass (out of scope)

- Live test-mode smoke run of the two checkouts — the user needs to do that interactively against the preview webhook URL.
- BD migration script, Stripe Connect onboarding, auto-downgrade job — explicit Phase 2.1+.
- Any visual change to locked screens.

## Risk notes

- `subscriptions.user_id` has a UNIQUE constraint, which is what makes the upsert-by-user-id safe. If that constraint is ever dropped, both the webhook and `syncMySubscription` need to be re-keyed.
- `payment_events.stripe_event_id` UNIQUE constraint is what makes the new idempotency lock atomic. Same warning.
- `subscription_status` enum is `{trialing, active, past_due, canceled, unpaid, incomplete, incomplete_expired, paused}`. The webhook never writes any other value — confirmed by removing the earlier draft's "superseded" status which would have failed at runtime.
