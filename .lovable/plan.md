# BD Migration v7 — Launch Execution Plan

Executes the locked dry-run v7 (`docs/10_phase2_migration_dry_run_v7_approved.md`, artifact `/mnt/documents/bd_migration_dry_run_v7.csv`) against **live Stripe**.

## Pre-flight gates (must all be green before any Stripe write)

1. **Date/time**: ≥ 2026-06-26 00:00 BST. Refuse otherwise.
2. **Environment**: live Stripe keys present (`STRIPE_SECRET_KEY` starts `sk_live_`), not test.
3. **Final go**: Scott confirms in-chat ("go" / "proceed live").
4. **Dry-run parity check**: re-run the v7 selector against `bd_member_seed` and assert totals match exactly — 6 honour_window, 1 anomaly_launch_charge, 383 future_due, 0 manual_review, 0 blocked, £303 total. Abort on any drift.
5. **Idempotency guard**: each row carries a deterministic `migration_idempotency_key` (e.g. `bd-v7-<bd_id_or_email_hash>`); Stripe calls use it so a re-run cannot double-charge.

## Execution order

```text
Step 1 — Snapshot
  └─ write bd_member_seed → bd_member_seed_pre_v7_snapshot (full table copy)

Step 2 — Honour-window cohort (6 × £34 = £204)
  ├─ ensure Stripe customer (find-or-create by canonical email)
  ├─ create one-off £34 invoice + charge (idempotency key)
  └─ create Stripe subscription schedule:
       phase 1: £34 one-off already paid (anchor today)
       phase 2: switch to REPs Verified £99/yr on next bd_next_due anniversary
  → on success: bd_member_seed.migration_status = 'honoured', store stripe_customer_id / schedule_id

Step 3 — Anomaly launch charge (1 × £99 = £99) — Raheela Khalid
  ├─ ensure Stripe customer
  ├─ create REPs Verified £99/yr subscription, billed immediately
  └─ on success: migration_status = 'launched_verified'

Step 4 — Future-due cohort (383 × £0)
  └─ DB-only: stamp migration_status = 'future_due_scheduled', set bd_next_due anchor;
     NO Stripe writes. Stripe subscription is created at their renewal date by the
     existing legacy-renewal hook.

Step 5 — Reconciliation
  ├─ assert Stripe charges total = £303 (204 + 99)
  ├─ assert every row in v7 CSV has a terminal migration_status
  └─ write run report to /mnt/documents/bd_migration_v7_run_<timestamp>.csv
```

## Failure handling

- Per-row try/catch. A row failure marks `migration_status = 'failed'` with the Stripe error code, continues the batch, and surfaces in the run report.
- Stripe idempotency keys mean a retry of a failed row is safe.
- No row is ever charged twice for the same cohort key.

## Comms

- Honour-window (6): transactional email "Your £34 has been honoured — next renewal £99 on <date>" via existing `sendTransactionalEmailServer`.
- Anomaly (1): "Welcome to REPs Verified — £99 charged today."
- Future-due (383): no email at launch; existing renewal-reminder cadence handles them.

## What does NOT change

- No Pro tier created. No lifetime cohort. No long-overdue cohort. No £34 renewable subs. Locked rules from v7 doc are binding.

## Technical notes

- Runner: a one-shot admin-only server function `runBdMigrationV7` (guarded by `has_role(auth.uid(),'admin')` AND a `LAUNCH_TOKEN` env var Scott pastes in to arm it). Not a public route.
- Stripe price IDs read from `src/lib/billing.ts` (Verified £99/yr).
- All writes wrapped in a per-row transaction; Stripe call first, DB stamp second.

## Open questions before I switch to build

1. **Arming token**: do you want me to add a one-time `LAUNCH_TOKEN` env var you paste at run time, or gate purely on your admin user id + an in-app "Arm launch" button?
2. **Run trigger**: kick off via an admin button in `/admin/migration`, or via a `curl` to the guarded server fn?
3. **Email copy**: use the existing transactional template, or do you want to review/edit the two new templates (honour + welcome) before send?
