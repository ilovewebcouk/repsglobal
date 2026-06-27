# QA: /admin Yesterday — why £198 and why 0 registrations

## What's actually in the DB for yesterday (26 Jun 2026)

Two `payment_events` rows from Jordon Gumbley's £99 Verified signup at 11:02 UTC:

| event_type | object | amount |
|---|---|---|
| `charge.succeeded` | `py_3TmXVs…` | 9900 |
| `invoice.payment_succeeded` | `in_1TmXVs…` (subscription invoice for the same £99) | 9900 |

There is **one** £99 payment. Stripe always fires both events for a subscription invoice — they're two views of the same money. The overview function counts both → £198.

Auth row for Jordon: `email_confirmed_at = 2026-06-16` (he signed up 10 days ago and paid yesterday). So under the current "confirmed signups in window" definition, he correctly shows 0 for yesterday — but that's not what you'd expect to see on the dashboard.

## Fix 1 — Revenue double-counting (bug)

In `src/lib/admin/overview.functions.ts`, narrow the revenue rule to **invoice events only, plus uninvoiced standalone charges**:

```ts
// Single source of truth per payment:
// - invoice.payment_succeeded  -> count it (covers all subscription + invoiced one-offs)
// - charge.succeeded           -> count ONLY when the charge has no invoice
//                                 (true one-off payments outside the subscription rail)
if (ev.event_type === "charge.succeeded" && obj.invoice) continue;
```

That removes the £99 duplicate today and makes the rule future-proof for every renewal / one-off.

Yesterday's tile will drop from **£198 → £99** (correct).

## Fix 2 — "New registrations" semantics (definition change)

Current definition: rows in `auth.users` whose `email_confirmed_at` falls in the window. Pure account-creation count. Misses paid signups whose email was confirmed days earlier (Jordon).

Change to **"New paid members"** — the more useful metric for a paid platform:
- Source: `subscriptions` rows where `environment='live'`, `tier IN ('verified','pro','studio')`, status ever-active (`status IN ('active','trialing','past_due','canceled')`), and `created_at` in window. De-duped by `user_id` (first subscription per user only).
- Subtext changes from "Confirmed signups" to "New paying members".
- Sparkline stays.

Under this rule, yesterday = **1 new registration (Jordon)** ✓.

If you'd rather keep the original meaning ("anyone who confirmed their email") and add the paid-signups tile as a 5th KPI, say so — I'll do that instead.

## Files touched

- `src/lib/admin/overview.functions.ts` — two small blocks (revenue loop, signups query swap from RPC to `subscriptions`).
- Optionally drop the `count_confirmed_signups` RPC if Fix 2 is adopted (left in place; no-op).

## Verification after build

- `/admin?period=yesterday`: Revenue received = **£99**, New registrations = **1** (Jordon), chart bar on 26 Jun = £99.
- `/admin?period=last_7d`: Revenue ≈ **£402** (Jordon £99 + 7 launch-day charges totalling £303), New registrations = number of new paid subs in the last 7 days.
