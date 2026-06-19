## Goal
Remove the 10 fake `subscriptions` rows that have no Stripe IDs, so `/admin/memberships` only counts real Stripe-backed customers as "live". Demo professionals stay on the public directory — only their fake subscription rows are removed.

## Rows being deleted (10 total)

All have `stripe_subscription_id IS NULL` AND `stripe_customer_id IS NULL`.

**Verified · active (1)**
- Katie Gibbs — `cruz.pt+kate@icloud.com` — sub id `eaaea836-ea14-47ee-ab68-225ac7a60aab`

**Pro · active (9)**
- Orphan stub — user `9e73a22f-898c-4d88-a114-3173a8c22dd7` (no auth email, no profile) — sub id `ffb575eb-1c01-4740-915a-5e8895125444`
- 8 demo seeds from `admin_seed_demo_pros()`:
  - Priya Sharma, Daniel Hughes, Emily Carter, Marcus Lee, Hannah Thompson, James Wilson, Sophie Taylor, Liam Roberts (all `*@demo.repsuk.org`)

## Rows kept (the only real Stripe subs)

3 Pro · trialing rows with live `stripe_subscription_id`:
- `sub_1ThB2XAP31Yc4cJjcCqZ55l3` (user `e19670ef…`)
- `sub_1Ti0uWAP31Yc4cJjpLaVsazn` (user `24bd1c60…`)
- `sub_1TjwoJAP31Yc4cJjxum3ZI38` — Heather Long (`kate_pt+pro@icloud.com`)

## Steps

1. **DB delete** (via `supabase--insert`, single statement):
   ```sql
   DELETE FROM public.subscriptions
   WHERE status IN ('active','trialing')
     AND stripe_subscription_id IS NULL
     AND stripe_customer_id IS NULL;
   ```
   Expected: 10 rows deleted, 3 rows remain.

2. **Patch `admin_seed_demo_pros()`** so re-running it doesn't re-insert the fake Pro subscriptions. Remove the `INSERT INTO public.subscriptions … 'pro' … 'active'` block from `_seed_one_demo_pro` (migration, function replacement only — no schema change). Demo pros still get profile + location + identity-approved + published, just no fake sub.

3. **Re-run dashboard QA** and confirm in chat:
   - Live subs count = 3 (all Pro trialing)
   - Forecast ARR "live" portion = 3 × £708 = **£2,124** (was £2,931)
   - Forecast ARR "awaiting Stripe setup" portion unchanged at £38,610 (V7 cohort untouched)
   - **New Forecast ARR total = £40,734** (was £41,541)
   - Verified tier card "live" = 0; "scheduled" = 390 (unchanged)
   - Pro tier card "live" = 3 trialing; "scheduled" unchanged
   - Studio tier card unchanged (waitlist only)
   - Upcoming payments: 3 trialing renewals on 11/13/19 Jul 2026 at £59 each (plus any V7 launch-day rows already in scope)
   - Recurring income forecast: Jul 2026 bucket gains 3 × £59 = £177; no other change
   - Diagnostics: `lifetimeMembers = 0`; total active subs = 3

4. **No Stripe writes.** No public-page changes. No code changes to `getMembershipMetrics` / `getRevenueForecast` (the existing filters already produce the right answer once the stubs are gone). No changes to V7 cohort, `bd_member_seed`, or `legacy_stripe_link`.

## Out of scope
- Caption copy on the dashboard tiles (separate decision, deferred).
- Re-seeding demo professionals' subscriptions in any form.
- Touching the 3 real Stripe trialing rows.
