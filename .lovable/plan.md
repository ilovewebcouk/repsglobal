## Goal

Get the legacy → Stripe linker matching **~363 of 390** seed emails on Live (vs the 124 it got in Sandbox), then leave the renewal cron unchanged.

## Root cause (confirmed by QA)

- The sandbox-only result (124 / 390) is correct for that environment — Sandbox Stripe is a separate customer database. The real run must happen on **Live**.
- On Live, `customers.list({ email })` is exact-match and would still miss ~20 customers whose Stripe email is stored mixed-case (e.g. `Aprilcoll93@hotmail.com` vs seed `aprilcoll93@hotmail.com`).
- 27 seed emails have no Stripe customer at all (legitimately un-linkable).

## Changes

### 1. Switch lookup to `customers.search` (case-insensitive + metadata fallback)

In `src/lib/admin/stripe-linking.functions.ts`, replace:

```ts
const list = await stripe.customers.list({ email: row.email, limit: 1 });
const customer = list.data[0];
```

with a helper that uses Stripe Search:

```ts
async function findCustomer(stripe, email) {
  // Search is case-insensitive on email field
  const q = `email:"${email}" OR metadata['email']:"${email}"`;
  const res = await stripe.customers.search({ query: q, limit: 2 });
  if (res.data.length) {
    // Prefer non-deleted, most recent
    return res.data.sort((a,b) => (b.created||0) - (a.created||0))[0];
  }
  // Fallback to list (handles accounts without search indexed yet)
  const list = await stripe.customers.list({ email, limit: 1 });
  return list.data[0] ?? null;
}
```

### 2. Add a "Reset linking" admin action

Add `resetLegacyLinking` server fn (admin-gated) that `TRUNCATE`s `legacy_stripe_link`. Surface as a destructive button in the admin panel with a confirm dialog. Required so we can re-run cleanly after switching Sandbox → Live without leaving stale `no_customer` rows.

### 3. Add CSV-import fallback path

New server fn `linkLegacyFromStripeCsv` that accepts a parsed array of `{email, customer_id}` from a Stripe Customers CSV export and writes link rows directly — bypassing the API entirely. Useful belt-and-braces and avoids any API rate-limit risk on a 390-row Live run.

Admin UI: a small "Upload Stripe CSV" file input next to the existing Link/Renew buttons. Parses client-side (papaparse), posts the minimal `{email, customer_id, created}` array to the server fn. The server fn still calls Stripe to fetch the active subscription per linked customer (so `legacy_kind`, `current_period_end`, `current_price_id` stay accurate).

### 4. Run sequence (operator playbook in the panel)

The panel will display these steps in order:

1. Toggle environment to **Live**.
2. Click **Reset linking** (wipes the sandbox results).
3. Click **Run link pass** (uses new Search-based lookup).
4. Verify stats: target ≈ 363 linked, ≈ 27 no_customer, 0 errors.
5. Spot-check 5 rows manually in the new `legacy_stripe_link` listing.
6. *Renewal pass is unchanged* — runs daily at 03:00 UTC via existing cron.

### 5. No changes to

- `runLegacyRenewalBatch` (renewal logic is fine).
- The pg_cron schedule.
- The Stripe webhook handler.
- The `legacy_stripe_link` schema.

## Files touched

```
src/lib/admin/stripe-linking.functions.ts    edit  (Search + reset + CSV fns)
src/routes/admin_.migration.tsx               edit  (Reset button, CSV upload, ordered steps)
```

No DB migration. No new dependencies (papaparse is already in the project; if not, add it).

## Acceptance

- Live run, current code: only 124 linked (sandbox baseline).
- Live run, with fix: **~363 linked, ~27 no_customer, 0 errors.**
- Reset button empties the table; re-running is idempotent.
- CSV-import path produces the same row count as the API path when given the Live CSV.
