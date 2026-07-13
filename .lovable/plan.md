## Goal

For each `email → stripe_customer_id` pair you supply (people whose CSV email doesn't match their Stripe email), get them set up on REPs as a trainer with an active Core subscription paid through their next legacy renewal date, and send them a setup invite.

## Inputs (you provide)

A hardcoded list in the script, e.g.:

```
altfitness@myyahoo.com    cus_UYIRXSbIcepboB
another@example.com       cus_XXXX
...
```

## Per-row logic

For each `(email, stripe_customer_id)`:

1. **Look up legacy payment** in `legacy_stripe_link` / `legacy_stripe_payments` by `stripe_customer_id` (not by email — the whole point is emails differ). Read `last_paid_at` and `legacy_kind` (annual vs monthly).
2. **Compute next due date**:
   - annual → `last_paid_at + 1 year`
   - monthly → `last_paid_at + 1 month`
   - If `last_paid_at` is null → skip that row and log it for manual review.
3. **Create / find auth user** for the CSV email:
   - If `auth.users` already has that email → reuse it.
   - Otherwise create via Auth Admin API and send a setup/invite email so they can set a password and finish their trainer profile.
4. **Create `professionals` row** (or update to `account_type = 'individual'`, verified state left as-is — verification is separate).
5. **Insert `subscriptions` row** (`environment = 'live'`) with:
   - `user_id` = new/found user id
   - `stripe_customer_id` = the one you supplied
   - `tier = 'core'`, `status = 'active'`, `billing_period = 'annual'|'monthly'`
   - `current_period_end` = the computed next due date
   - `migrated_from_bd = true`, `cancel_at_period_end = false`
   - `stripe_subscription_id = null` (no live Stripe sub — this is a manual honour entry until they set one up in Stripe or you attach one later)
6. **Update `legacy_stripe_link`** for that customer: set `link_status = 'linked'`, `migration_status = 'converted_to_subscription'`, store the new `user_id` so it drops off the "no active sub" report.
7. **Log** each action to `admin_audit_log` (`qa.manual_stripe_customer_relink`).

## Deliverable

A single admin server function `manualRelinkStripeCustomers` (admin-only, `has_role admin` check) that takes the hardcoded array and processes it in one call. I'll run it once from an admin page button (or via `invoke-server-function`) and return a summary: `{ created, reused, skipped, errors[] }`.

## Output CSV

After running, re-export `csv_no_active_sub.csv` so you can see who's still outstanding.

## What I need from you before implementing

1. The full list of `email,stripe_customer_id` pairs you've cross-referenced (paste in chat — I'll hardcode into the script).
2. Confirm invite email = the standard REPs auth invite ("finish setting up your account"), not a custom migration-flavoured email (per the no-BD-migration language rule).

## Technical notes

- Uses `supabaseAdmin` inside the handler (Auth Admin API + service-role writes).
- No Stripe API calls needed for step 5 — we're mirroring the legacy period into our `subscriptions` table only. If you later want a real Stripe subscription attached to `cus_...`, that's a separate follow-up.
- Idempotent: re-running with the same pair updates the existing subscription rather than duplicating.
