
## Goal
Use the uploaded Stripe payments export as the **single source of truth** for every Verified member's payment history. Surface it inside the member's own Settings → Payments tab, and re-derive `next_due_at` from it (no more Stripe API probe roulette, no more wrong dates).

## Why this fixes the earlier mess
- raheel / ptdavid76 / ojwarn etc. landed in the wrong bucket because we relied on guessed signup dates and median-gap maths.
- The CSV has **every successful charge** with `Created date (UTC)`, `Amount`, `Customer Email`, `Customer ID`, `Status`. That's the ground truth. We import it once, then every "next due" calc is `MAX(paid_at) + 365d` straight from our own table.

## Build order

### 1. New table `legacy_stripe_payments` (Cloud migration)
Per-charge history, one row per Stripe charge id.
- `charge_id` (pk, e.g. `ch_3Ti1Gf…`)
- `stripe_customer_id`
- `email` (lowercased)
- `paid_at` (timestamptz, from "Created date (UTC)")
- `amount_pence` (int, `Amount * 100`)
- `currency`, `status` ("Paid" / "Refunded" / "Failed"), `description`, `card_last4`, `card_brand`
- `refunded_amount_pence`, `refunded_at`
- `imported_at`, `import_batch_id`
- `user_id` (nullable uuid, FK to auth.users — joined by email at import time, re-joined later when users sign up)

Index: `(email)`, `(stripe_customer_id)`, `(user_id, paid_at desc)`.
GRANTs: `service_role` ALL; `authenticated` SELECT (RLS scopes rows to `user_id = auth.uid()`).

### 2. Admin-only CSV import server fn
`importLegacyStripePayments` (admin role check, not just signed-in):
- Accepts the unified payments CSV.
- Parses rows where `Status = Paid`. Upserts on `charge_id` (idempotent — re-importable).
- Lower-cases email; joins `user_id` via `auth.users.email` where it matches.
- Returns `{ inserted, updated, unmatched_emails, total }`.
- One-shot admin page button at `/admin/migration` ("Import Stripe payments CSV").

### 3. Recompute `next_due_at` from real history
After import, run once:
```sql
UPDATE legacy_stripe_link l
SET last_paid_at = h.last_paid_at,
    last_paid_amount_pence = h.last_amt,
    next_due_at = h.last_paid_at + interval '365 days'
FROM (
  SELECT email, MAX(paid_at) last_paid_at,
         (array_agg(amount_pence ORDER BY paid_at DESC))[1] last_amt
  FROM legacy_stripe_payments WHERE status='Paid' GROUP BY email
) h
WHERE lower(l.email) = h.email AND l.is_lifetime = false;
```
This **automatically fixes** raheel / ptdavid76 / ojwarn / claudia — their next-due now reflects whatever their real most-recent paid charge says.

### 4. Member-facing Payments History panel
Inside `src/components/dashboard/PaymentsSettingsTab.tsx`, **above** the existing Stripe Connect block, add a new `<SubscriptionHistoryPanel />`:
- Server fn `getMyLegacyPaymentHistory` (auth required, no admin) → returns rows for `user_id = auth.uid()` OR `lower(email) = auth.user.email` (covers users whose CSV row didn't auto-link).
- Table columns: Date · Description (default "REPs Verified membership") · Amount · Status badge · Receipt (link to Stripe hosted receipt if we capture the URL; otherwise just "Paid").
- Empty state: "No previous REPs payments on file."
- Below the table: a single read-only "Next renewal" line — `{next_due_at formatted} · £{amount}` pulled from `legacy_stripe_link`. Lifetime members show "Lifetime member — no further payments".

Visible to **every signed-in professional** (not just Pro/Studio — Verified members need this most). The existing Stripe Connect / payouts section stays gated to Pro/Studio as today.

### 5. Admin visibility
On `/admin/professionals` row drawer, add a "Payment history (Stripe legacy)" collapsible that reuses the same fetch keyed by `professional_id`. Lets you eyeball any member's real history when they query a charge.

## Out of scope (explicitly)
- No changes to the £34/£99 launch billing logic, schedules, or `_runLegacyRenewalBatch` — that work is paused until after this import lands and we re-verify next-due dates from real data.
- No changes to Stripe Connect / payouts UI.
- No editing of CSV-derived rows from the UI (read-only history; corrections via re-import only).
- No visual changes to locked pages.

## Open question before I build
The CSV has 1,498 charge rows including some non-REPs / non-membership charges (e.g. WHMCS invoice descriptions, course payments via metadata). Do you want me to:
- **(a)** Import **everything** the CSV contains and just label by `Description`, or
- **(b)** Filter to only rows matching REPs membership patterns (Description ~ "REPs" / "Verified" / amount in £29/£34/£97/£99)?

I'd default to **(a)** — full fidelity, nothing hidden — but flagging because (b) gives a cleaner member-facing list.
