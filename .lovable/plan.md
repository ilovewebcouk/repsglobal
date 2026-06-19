## Resolve Joanna + Sophia, lock cohort overrides into the launch-day logic

**Zero Stripe writes.** No customers, subscriptions, invoices, charges, schedules or invoice items will be created. Confirmed below.

---

### Status so far (already applied before plan-mode block kicked in)

1. **Migration applied** on `public.bd_member_seed` — added four nullable columns plus a `CHECK` constraint:
   - `migration_canonical_stripe_customer_id text`
   - `migration_cohort_override text` — `CHECK (migration_cohort_override IS NULL OR migration_cohort_override IN ('honour_window','future_due','anomaly_launch_charge','manual_review','blocked'))`
   - `migration_review_resolved boolean NOT NULL DEFAULT false`
   - `migration_cohort_reason text`
2. **Joanna Forbes (bd_member_id 759)** — `migration_canonical_stripe_customer_id='cus_RCPbzmBwTUKS9z'`, `migration_cohort_override='future_due'`, `migration_review_resolved=true`, reason recorded. Email unchanged. Verified `legacy_stripe_link` row already points at the canonical customer (`cus_RCPbzmBwTUKS9z`, status `ready`).
3. **Sophia Smith (bd_member_id 908)** — email corrected to `sophia@sophiasmithfitness.com`, `migration_cohort_override='future_due'`, `migration_review_resolved=true`, reason recorded. Her `legacy_stripe_link` row remains `no_customer / blocked` (no Stripe customer created).

---

### Remaining work (needs build mode)

#### 4. Edit `src/lib/admin/stripe-linking.functions.ts`

Two surgical changes; locked BD migration rules and tier targets stay intact.

**a) Pass 1 — `linkLegacyStripeCustomers`**

When linking a BD seed row to Stripe, if `migration_canonical_stripe_customer_id` is set on that seed row, retrieve that specific customer ID and use it instead of doing an email search. Falls back to existing email search only when no override is set or the pinned ID is deleted. Effect: future re-links for Joanna keep `cus_RCPbzmBwTUKS9z` and never re-pull the older `cus_QCi7KlNEBF73H8`.

**b) Pass 2 — `_runLegacyRenewalBatch` (the launch-day cron worker)**

At the top of the per-row loop, fetch the BD seed's `migration_cohort_override`. Handling:

| Override value | Pass 2 action |
|---|---|
| `future_due`, `manual_review`, `blocked` | **Skip.** Mark the `legacy_stripe_link` row `migration_status='skipped'` with notes referencing the override + reason. No Stripe call made. |
| `anomaly_launch_charge` | Use the existing "non-eligible → £99/yr" path (Raheela Khalid). |
| `honour_window` | Use the existing "£34 → £99 schedule" path. |
| `null` | Fall through to existing computed logic (no behaviour change). |

Effect on launch day (26 Jun 2026):
- Joanna (override = `future_due`) is skipped — no £99 charge, no subscription created, even though her `legacy_stripe_link` is `ready` with a Stripe customer.
- Raheela charged £99 (anomaly).
- 6 honour-window members charged £34 each and put on the £34 → £99 schedule.

#### 5. Dry-run verification (read-only)

After the edit, run a SQL dry-run that mirrors the new logic:

- Count rows by cohort using `migration_cohort_override` when present, else the computed BD-join-date roll-forward rule (locked v5).
- Confirm no Stripe API calls are made — the dry-run is a pure SQL `SELECT`, no `stripe.*` invocation.
- Return:
  - cohort totals (honour_window / future_due / anomaly_launch_charge / manual_review / blocked)
  - launch-day total charge amount
  - Joanna row (cohort + canonical customer ID confirmation)
  - Sophia row (cohort + corrected email confirmation)
  - any remaining `manual_review` / `blocked` rows by name

**Expected results:**

| Cohort | Count | Launch charge |
|---|---:|---:|
| honour_window | 6 | 6 × £34 = £204 |
| anomaly_launch_charge | 1 (Raheela Khalid) | £99 |
| future_due | rest (incl. Joanna 759 + Sophia 908) | £0 |
| manual_review | 0 | £0 |
| blocked | 0 expected (Sophia unblocked; no other genuinely-invalid rows known) | £0 |

**Launch-day total: £303.00** (£204 honour + £99 anomaly).

---

### Confirmation of no Stripe writes

- Migration: schema only, no Stripe API.
- Row updates on `bd_member_seed`: database only, no Stripe API.
- Code edit on `stripe-linking.functions.ts`: pure source change, doesn't execute.
- Dry-run: SQL `SELECT` only, no `stripe.customers.*`, no `stripe.subscriptions.*`, no `stripe.subscriptionSchedules.*`, no `stripe.invoices.*`, no `stripe.charges.*`.

**Awaiting approval to switch to build mode to apply step 4 and report step 5.**