# Training Providers — full audit & fix

## What I found (evidence)

**APEC Courses Ireland Ltd — the wrong-dashboard bug**
- `professionals.account_type = training_provider` ✓
- `subscriptions.tier = 'free'`, `status = 'trialing'`, `stripe_price_id = 'training_provider_annual'` (lookup key, not a `price_…` id), Stripe customer `cus_QD5LgkMdgkTSsA`, sub `sub_1TtVjPAP31Yc4cJjT39mBUQp`, environment `live`.
- Every other training provider (23 of 24) has `subscriptions.tier = 'training_provider'` and a real `price_1TtVO6AP31Yc4cJj1pk4tyh1` id. APEC is the outlier.

Because APEC's row says `tier = 'free'`:
1. `_authenticated/_professional/route.tsx` gate: `PAID_TIERS.includes('free')` → false → redirects the actual user to `/pricing`.
2. Admin impersonation (`impersonation.functions.ts` lines 138-144): `paidTiers.includes('free')` → false → falls back to `tier = 'verified'` → **admin sees the Core trainer dashboard for APEC**. Exactly the symptom you reported.

**All 24 providers — Member 360 shows "no subscription"**
`src/lib/admin/member-billing-row.server.ts`:
- Line 15: `MemberBillingPlan = "free" | "verified" | "pro" | "studio"` — omits `training_provider`.
- Line 39: `COUNTED_TIERS = {"verified","pro","studio"}` — providers never enter the Active Paying Member collection.
- Line 148-149: with no `activePaidTier` and no failed/renewal-due tier, `plan` collapses to `"free"`.
- `subscription-resolver.server.ts` `planToTierKey` also only knows verified/pro/studio → returns `source: "none"`.

Result: every training provider (correct or not) reads as free in Member 360 → Billing tab shows "No active subscription", Identifiers panel shows blank Stripe customer/subscription. Yesterday I mistakenly rationalised that as "expected — providers don't pay". Wrong — they have live Stripe trialing subs; the resolver simply doesn't recognise their tier.

**My previous UI change was wrong**
The Identifiers "Training provider — no Stripe customer" note and the "no subscription required" Billing empty state I added earlier need to come out. Providers *do* have Stripe rows.

## Fix plan

### 1. Revert the incorrect UI in `src/routes/admin_.members_.$userId.tsx`
- Identifiers panel: restore the original Stripe customer + Stripe subscription rows for all account types.
- BillingPane empty state: restore the original "No active subscription" + `BillingActions` card. No account-type-special-cased branch.

### 2. Data fix — APEC's subscriptions row (migration)
- `UPDATE public.subscriptions SET tier = 'training_provider' WHERE user_id = 'f0ff8ec1-8122-4d79-a030-acd9b5d4ce8a' AND environment = 'live';`
- Idempotent guard: only update where `tier = 'free'` AND `stripe_price_id IN ('training_provider_annual','price_1TtVO6AP31Yc4cJj1pk4tyh1')` so we never re-label a genuinely free row.
- Also normalise `stripe_price_id` from the lookup key `'training_provider_annual'` to the real price id so APEC matches the other 23 rows.

### 3. Make the billing resolver understand `training_provider`
`src/lib/admin/member-billing-row.server.ts`:
- Extend `MemberBillingPlan` to include `"training_provider"`.
- Add `training_provider: 0` to `PLAN_MRR_PENCE` (providers don't contribute MRR — they're on comp/trial) and a rank in `PLAN_RANK`.
- Add `"training_provider"` to `normaliseTier`.
- Leave `COUNTED_TIERS` as-is so providers are not counted as Active Paying Members (they're admin-invited comp seats, not paying subscribers), but the plan resolver now recognises the tier so it stops collapsing to `"free"`.

`src/lib/admin/subscription-resolver.server.ts`:
- Extend `planToTierKey` and the local tier map to include `training_provider` → label "Training provider".
- Add a catalogue entry for training_provider showing the real Stripe price when the mirror provides it (no hard-coded catalogue amount — providers are trial/comp, so let the Stripe mirror populate `unit_amount_pence` from the live sub).
- Result: Member 360's Billing tab and Identifiers will populate for every provider from live Stripe (customer id, subscription id, trialing status, `training_provider_annual` price, renewal date).

`src/lib/billing.ts`:
- Confirm `TIERS.training_provider` exists with a "Training provider" label so `tierLabel(...)` returns a display string. If missing, add a minimal entry (label only — providers don't appear in the checkout catalogue).

### 4. Harden the trainer-tier gate against future data drift
`src/routes/_authenticated/_professional/route.tsx` and `src/lib/admin/impersonation.functions.ts`:
- When `subscriptions.tier` is not a paid tier but `professionals.account_type = 'training_provider'`, treat the effective tier as `training_provider` (with a `status IN ('active','trialing','past_due','unpaid')` sub present) instead of silently falling back to `'verified'`.
- Rationale: `account_type` is the intent set by admin invite; the subscription row is the mechanical mirror. If they disagree, `account_type` should win for routing, and the mismatch should surface (log it) rather than misroute the user into Core.

### 5. Deep audit — background sub-agent
Spawn one capable sub-agent, read-only, to trace every touchpoint of `training_provider`:
- account_type vs subscriptions.tier vs stripe_price_id consistency across all 24 rows (including test/live env split).
- Every code path that reads `trainerTier`, `account_type`, or `PAID_TIERS` — router gates, dashboard shells, sidebar, greeting/name, verification gates, admin surfaces (Members list, Member 360, Campaigns), public directory visibility filter.
- Impersonation, Provider profile route, ProviderGateWall / ProviderVerificationPromptDialog, `getProviderVerificationSummary`.
- Any Stripe webhook / resync path that writes `subscriptions.tier` — identify why APEC alone got tier='free' (likely a stale mapping when the lookup key `training_provider_annual` was used instead of the real price id).
Sub-agent returns a written report saved to `/mnt/documents/training-provider-audit.md` covering: data mismatches, code hotspots, root cause of APEC drift, and any other provider that would misroute under the current gates. Findings are folded into the fix before shipping.

### 6. Verification (post-build)
- Reload `/admin/members/f0ff8ec1-…`: Billing tab shows the trialing Training provider sub, renewal 31 May 2027; Identifiers show `cus_QD5LgkMdgkTSsA` and `sub_1TtVjPAP31Yc4cJjT39mBUQp`.
- Impersonate APEC → Provider dashboard renders (not Core), greeting shows the trading name, verification gate = provider's 3-step flow.
- Spot-check three other providers via admin: Billing + Identifiers populated, dashboard branch = provider.
- SQL check: `SELECT count(*) FROM subscriptions WHERE stripe_price_id ~ 'training_provider' AND tier <> 'training_provider'` returns 0.

## Notes
- No changes to public-directory visibility (already handled by the earlier "must be verified before appearing on Find a Training Provider" migration).
- No pricing/MRR impact: providers stay outside `COUNTED_TIERS`, so revenue metrics are unaffected.
- No schema changes required beyond the one-row data fix.
