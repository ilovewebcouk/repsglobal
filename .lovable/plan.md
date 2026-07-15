## What I'll do

You've uploaded `training_providers.numbers` with **24 providers**. All 4 columns line up with the existing importer at `/admin/training-provider-import`: `companyname → provider_name`, `email`, `stripe_customer_id`, `website`.

I'll add two things on top of the existing importer before we launch anything to them:

1. **Rendered email preview** — you see the exact email each provider will receive, per row, before commit.
2. **Renewal-price guarantee** — I'll audit each Stripe customer's current subscription and enforce your rule: *keep their existing price if ≤ £479; cap it at £479 if higher.* Cap applies **at next renewal only** — no immediate charges, no proration.

Nothing sends and no Stripe changes happen until you press **Commit** in the admin UI.

---

## Step 1 — Convert & load the 24 rows

I'll convert the `.numbers` file to CSV in-repo (kept internal, not committed) and pre-fill the textarea on `/admin/training-provider-import`. All 24 rows parsed cleanly on my read; every row has a valid `cus_...` id.

## Step 2 — Extend the importer with a proper preview

Currently "Dry run" only says *would_create* / *would_link_existing*. I'll extend it so dry-run also returns, per row:

- **Auth status** — new signup vs. existing REPs account.
- **Stripe subscription audit**:
  - active subscription found? (yes/no + sub id)
  - current unit amount + currency + interval
  - action: `keep_current_price` (≤ £479) / `cap_to_479_at_renewal` (> £479) / `no_active_sub_flag`
- **Rendered email HTML** — the exact `provider-portal-is-live` email, rendered with that provider's data, with a "Preview" button that opens it in a modal.

Table gets two extra columns: **Renewal price** and **Email preview**.

## Step 3 — Renewal-price enforcement (commit only)

For each row where the current price > £479/year (47900p GBP), on commit I'll:

- Create a new Stripe Price at 47900 GBP / year (reused across rows via lookup key `training_provider_annual_479_gbp`).
- Update the subscription with `{ items: [{ id, price: <new> }], proration_behavior: 'none', billing_cycle_anchor: 'unchanged' }` — this changes the price that applies at the **next renewal**, no immediate charge, no credit.
- Log before/after in `admin_audit_log` (`provider.renewal_price_capped`).

For rows already ≤ £479: no Stripe write at all — they keep exactly what they paid.

For rows with no active sub: flagged in the results table, **skipped** on commit (no email sent) so you can investigate.

## Step 4 — You review, then commit

You'll see, before pressing Commit:

- Row-by-row action (create / link) + current price + planned renewal price.
- The exact email each will get (rendered).
- Any anomalies (no active sub, cancelled sub, non-GBP, unusual interval).

Only after you press Commit do emails send and Stripe subscriptions update.

---

## Technical notes

- **Files touched**
  - `src/lib/admin/import-training-providers.functions.ts` — add Stripe audit + price-cap logic, extend `ImportRowResult` with `stripe_audit` and `renewal_action`.
  - `src/lib/admin/preview-provider-email.functions.ts` *(new)* — `renderTrainingProviderEmail({ email, provider_name })` returns `{ subject, html }` using the same template as commit.
  - `src/routes/admin_.training-provider-import.tsx` — add "Preview email" button per row + "Renewal price" column.
- **Stripe** — uses existing server-side Stripe client. Reads `stripe.subscriptions.list({ customer, status: 'all', limit: 3 })` and picks the most recent `active`/`trialing`/`past_due` sub. New Price uses lookup key so re-runs are idempotent.
- **No schema changes.** No new tables. No new secrets.
- **Idempotency** — `idempotencyKey` on the email send already prevents duplicate sends per user. Stripe price update is a no-op if the sub is already on the £479 price.
- **CSV format stays 4-column** (`email, stripe_customer_id, provider_name, website`) — matches your uploaded file. Website is optional; I'll pass it through to seed `professionals.website_url` when the pro row doesn't already have one.

## After you approve the plan

1. I switch to build mode, extend the importer + add email preview + Stripe audit.
2. I paste your 24 rows into the admin page and run **Dry run**.
3. You review the 24 rendered emails + 24 price actions.
4. You press **Commit**. Emails go out; subs > £479 are scheduled to cap at renewal.