# 10 — Billing Phase 0: locked decisions

> **Snapshot date:** 11 June 2026
> **Scope:** Pre-build decisions for the Stripe Subscriptions + BD migration plan. These choices govern Phase 1 (new-signup billing, shipped in Phase 2.0) and Phase 2.1+ (BD member migration, Stripe Connect for trainer payments).
> Source: chat exchange of 1 June 2026.

These are decisions only — no code changes flow directly from this doc. They are recorded here so the migration script and Connect onboarding can be built against a fixed contract.

## 1. Legal entity

REPs is the **same legal entity** that operated the previous Brilliant Directories (BD) site. The existing card mandate carries over; no re-consent email is required when we begin charging cards through the new REPs Subscriptions surface.

## 2. Statement descriptor

Stripe statement descriptor: **`REPS MEMBERSHIP`** on every recurring charge.

## 3. Pricing on migration day

Migrated BD members keep their **BD price until their next renewal**, then move to REPs standard pricing (Verified £99/yr or Pro Founding £59/mo, depending on what they're entitled to). No mid-cycle price bump.

## 4. Stripe Connect for trainer-taken payments

Each Pro / Studio professional onboards a **Stripe Connect** account so they can take payments from their own clients through the REPs shop-front. This is separate from the REPs membership subscription and is deferred to Phase 2.1+. The decision is locked: Connect, not platform-aggregated payouts.

## 5. New Verified signups: 30-day pending window

A brand-new Verified subscriber pays £99 today but does **not** show the Verified badge or appear on the public register until either (a) admin approves their credentials, or (b) 30 days pass without approval, at which point they remain on the paid tier but are visible as "pending verification".

## 6. Migrated BD members: 12-month grace

Members imported from BD start with **12 months of grace** at the Verified tier. If they have not supplied a current qualification certificate + insurance by month 12, they remain on the paid tier (we do not downgrade), but they lose the Verified badge and the trust-up styling until they re-submit.

## 7. Tier vs verification are independent

**Subscription tier** (what they pay for) and **verification status** (badge + trust signal) are independent fields on the professional record. Losing verification **never** downgrades the paid plan — the user keeps all tier features and keeps being charged. Cancelling the subscription is the only path that moves them to the `free` tier.

## Where these live in the codebase

| Decision | Code touch-point |
|---|---|
| Statement descriptor | Set on the Stripe product in dashboard; no code constant. |
| Pricing catalog | `src/lib/billing.ts` (REPs standard prices). BD price IDs will be added when the migration script is built. |
| Stripe Connect | Phase 2.1+ — module path TBD. |
| 30-day pending window | `professionals.verification_grace_until` column already exists. |
| 12-month BD grace | `professionals.verification_grace_until` column, set during migration. |
| Tier ≠ verification | `professionals.verification_status` enum + `subscriptions.tier` enum kept separate; webhook never touches `verification_status`. |

## Out of scope here

The migration script itself, the Connect onboarding flow, the auto-downgrade job, and any UI surfacing of grace-period countdowns. Those are Phase 2.1+ deliverables.

## 8. Launch-day cron behaviour (26 June 2026)

Locked 19 Jun 2026. The `legacy-renewal` cron is a no-op until launch; at
`2026-06-26T00:00 BST` (`LAUNCH_AT_UTC`) it runs daily and applies these
rules per `legacy_stripe_link` row (`migration_status = 'ready'`, with a
`stripe_customer_id`, `access_expires_at <= now()`):

| Member state | Charged today | Subscription created |
|---|---|---|
| `eligible_for_legacy_price = true` AND `access_expires_at >= 2026-06-14T17:24:51Z` (CSV import) | £34 | Subscription Schedule: £34/yr for year 1, auto-step to £99/yr from year 2 |
| Long-overdue: `access_expires_at < 2026-06-14T17:24:51Z` (last paid before CSV import) | £99 | Plain £99/yr Verified subscription |
| No payment method on file | £0 charge | Same schedule/sub created with `send_invoice`, 30 days to pay |
| Lifetime members (not in `legacy_stripe_link`) | £0 | None — kept Verified, never billed |

The CSV import cutoff is stored as `LEGACY_HONOUR_CUTOFF` in
`src/lib/launch.ts` and derived from the actual `bd_member_seed.created_at`
timestamp. Brand-new sign-ups after launch are unaffected: they use the
standard `/pricing` → Stripe Checkout flow (Verified £99/yr or Pro £59/mo
Founding) defined in `src/lib/billing.ts`.
