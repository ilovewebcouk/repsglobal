## Goal

Create three working logins against the live database so you can click through every state of the Phase 2.0 flow without going through Stripe Checkout end-to-end.

## Accounts I will create

| Email | Password | What you see after login |
|---|---|---|
| `demo-admin@repsuk.org` | generated | `/admin/verification` queue; also the seeded `pros@repsuk.org` already exists if you prefer that one |
| `demo-fresh@repsuk.org` | generated | `/dashboard` with Step 1 active (no plan, no profile) — perfect for testing the Stripe Checkout journey for real |
| `demo-verified@repsuk.org` | generated | `/dashboard` with all 4 steps done: Verified plan active, profile complete, credentials approved, listing published at `/pro/demo-verified` |

All three passwords will be strong random strings (≈20 chars) and I'll print them in chat once so you can save them in your password manager.

## How

One SQL migration that:

1. Inserts three rows into `auth.users` with `crypt(password, gen_salt('bf'))` and `email_confirmed_at = now()` so they can sign in immediately (no email verification needed). The existing `handle_new_user` trigger then auto-creates `profiles`, `user_roles` (`professional`), and `professionals` rows for each.
2. For `demo-admin`: also insert a `user_roles` row with role `admin`.
3. For `demo-verified`: update the auto-created `professionals` row with slug `demo-verified`, trading name, headline, bio, specialisms, city, hourly rate, `verification_status = 'verified'`, `is_published = true`; and insert a `subscriptions` row with `tier = 'verified'`, `status = 'active'`, `current_period_end = now() + 1 year`, `is_founding = false` (no real Stripe customer attached — the dashboard reads tier from this row, so the gating works).
4. `demo-fresh` is left as-is after the trigger fires — empty professional row, no subscription.

Nothing in the schema changes; this is data-only. The Stripe webhook and `syncMySubscription` still work the same for any user who actually pays.

## What you do

1. Approve the migration.
2. Open `/auth`, paste the email + password I print, and you land on the right page for that account.
3. Delete the demo users any time with a follow-up cleanup (one `DELETE FROM auth.users WHERE email LIKE 'demo-%'`).

## Note

The `demo-verified` account simulates a paid Verified tier without going through Stripe, so its "Manage billing" button in the dashboard billing card will fail (no real Stripe customer). Use `demo-fresh` if you want to test the real Stripe Checkout → portal loop.
