# Fix balanced-connection tier mismatch

## What's wrong

`balanced-connection` has a valid live Stripe subscription:

- `stripe_subscription_id`: `sub_1TtVjnAP31Yc4cJj14TedHya`
- `stripe_customer_id`: `cus_TXRG9DBbqbSkAR`
- `stripe_price_id`: `training_provider_annual` (correct lookup key)
- `status`: `trialing` (live)
- `account_type` on `professionals`: `training_provider` ✅
- `admin_seeded_public`: `true` ✅

But its `subscriptions.tier` is `free`. The public visibility RPC requires
`tier IN ('verified','pro','studio','training_provider')`, so this row is the
only one of the 24 filtered out.

The row's metadata shows `reps_activated_by: bulk_admin_fix_2026_07_15` — an
earlier admin bulk script wrote `tier='free'` despite the Stripe price being
`training_provider_annual`. The tier mapping in `src/lib/billing.ts`
(`checkoutOfferForPriceId`) correctly returns `training_provider` for that
lookup key, so any resync-from-Stripe would fix this, but no resync has run
for this user since.

## Plan

### 1. Data fix (migration)

Update the one broken row to match Stripe:

```sql
UPDATE public.subscriptions
SET tier = 'training_provider',
    billing_period = 'annual',
    updated_at = now()
WHERE stripe_subscription_id = 'sub_1TtVjnAP31Yc4cJj14TedHya'
  AND tier = 'free';
```

### 2. QA sweep of the other 23 TPs

Same migration: catch any other training provider whose subscription row
still says `tier='free'` despite having a `training_provider_annual` price:

```sql
UPDATE public.subscriptions s
SET tier = 'training_provider',
    billing_period = COALESCE(s.billing_period, 'annual'),
    updated_at = now()
FROM public.professionals p
WHERE s.user_id = p.id
  AND p.account_type = 'training_provider'
  AND s.stripe_price_id = 'training_provider_annual'
  AND s.status IN ('active','trialing','past_due','unpaid')
  AND s.tier = 'free';
```

(From the current data all 23 others are already `training_provider` — this is
a belt-and-braces sweep, expected to touch only the 1 row.)

### 3. Verification

After the migration:

- `SELECT COUNT(*) FROM list_publicly_visible_pro_ids() v JOIN professionals p ON p.id=v.id WHERE p.account_type='training_provider'` should return **24**.
- Confirm `/find-a-training-provider` shows balanced-connection.

## Not doing (out of scope)

- No changes to the tier-mapping code — it's already correct.
- No changes to the visibility RPC or `admin_seeded_public` behaviour.
- Not investigating why `bulk_admin_fix_2026_07_15` mis-tiered this one row;
  the script isn't going to run again.
