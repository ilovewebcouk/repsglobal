## Comp Katie Gibbs on the Verified tier

Give Katie dashboard access without sending her through Stripe checkout, by inserting a manually-comped row in `public.subscriptions`.

### What the row will contain

- `user_id` = Katie's auth user id (looked up by email `cruz.pt+kate@icloud.com` via `admin_seed_*`-style RPC or `supabase--read_query` on `auth.users`)
- `tier` = `verified`
- `status` = `active`
- `billing_period` = `annual`
- `environment` = `live` (matches what the dashboard guard reads)
- `is_founding` = `false`
- `migrated_from_bd` = `false`
- `metadata` = `{"comp": true, "reason": "manual comp — pre-launch", "granted_by": "cruz.pt@icloud.com"}`
- Stripe columns (`stripe_customer_id`, `stripe_subscription_id`, `stripe_price_id`, `current_period_end`) left **NULL**

### Side-effects (already handled by existing triggers)

- `tg_subscription_grant_credits` will auto-create her `credit_wallets` row and grant the Verified signup grant (150 credits) + monthly refill ceiling. No extra work needed.

### What this unlocks for Katie

1. Sign in at `/auth` with email + password
2. `_authenticated/_professional` guard sees `tier='verified' / status='active'` → routes her to `/dashboard`
3. Full Verified dashboard, profile editing, reviews module, settings, etc.

### Known limitation (call out to user)

Because there is no `stripe_customer_id`, the **"Open billing portal"** button in `/dashboard/settings → Billing` will fail when she clicks it (Stripe portal needs a customer). Two options for the Billing tab UI:

- **(a) Leave as-is** — she has no card to manage anyway; if she ever clicks it she gets a toast error. Cheapest.
- **(b) Hide the portal button when `stripe_customer_id IS NULL`** and show a small "Comped account — no billing required" note instead. ~10 lines in `dashboard_.settings.tsx`.

I'll do **(a)** by default unless you want (b).

### Execution

1. Use `supabase--read_query` to grab Katie's `user_id` from `auth.users`.
2. Use `supabase--insert` to insert the subscription row.
3. Verify with a select that the row is there and the credit wallet was auto-created by the trigger.
4. Tell you she can now sign in.

No code changes, no migration — pure data insert.