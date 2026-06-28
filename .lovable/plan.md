# Post-BD Migration QA Audit — Plan

Strictly read-only. No DB writes, no Stripe mutations, no emails, no code changes, no cron toggles. Deliverable is a single report + CSV + screenshots that you approve before any cleanup work begins.

## Inputs I'll use
- Uploaded `subscriptions.csv` (Stripe export, 341 rows) as Stripe-side source of truth.
- Live DB via read-only `psql`: `bd_member_seed`, `bd_migration`, `legacy_stripe_link`, `legacy_stripe_payments`, `subscriptions`, `billing_setup_tokens`, `churn_lifecycle`, `payment_events`, `disputes`, `renewal_tokens`, `email_send_log`, `professionals`, `profiles`, `auth.users`, `user_roles`.
- Codebase search across `src/routes`, `src/components`, `src/lib`, `supabase/migrations` for legacy/BD references.
- Live admin screenshots via headless Playwright using the injected admin session.

## Workstreams (mapped to your 16 sections)

1. **Migration truth table** — single SQL roll-up classifying every `bd_member_seed` row into exactly one of: Converted-active, Converted-scheduled/trialing, Awaiting card setup, Failed/recovery, Lapsed/churned, Manual review, Pre-existing sub, Still on legacy rail, Invisible. Cross-checked against the CSV.
2. **Row-level CSV** → `/mnt/documents/post-bd-audit/bd-member-state-2026-06-28.csv` with all 24 columns you listed, one row per BD member.
3. **Stripe reconciliation** — join CSV ↔ `subscriptions` ↔ `legacy_stripe_link`. Exception tables: missing-local, missing-stripe, duplicates, missing metadata (`migrated_from`/`bd_member_id`/`reps_user_id`/`original_next_due`), wrong tier, wrong anchor date, unexpected immediate charge, still legacy-selectable.
4. **Legacy dependency sweep** — `rg` across the codebase for the 16 tokens you listed; each hit classified Keep-historical / Keep-temporary / Remove / Replace / Archive-only / Dangerous.
5. **Cron & route audit** — read `cron.job` + `cron.job_run_details` + `cron_daily_runs` + `/api/public/*` routes. Per-job table with schedule, last run, can-it-touch-converted-members, recommendation. Nothing disabled.
6. **Admin page audit** — every route in your list: purpose, BD/legacy exposure, duplication, keep/merge/archive/delete, required changes.
7. **Canonical metric audit** — re-check `docs/11_admin_metric_registry.md` against subscription-first sources; flag any metric still unioning legacy/BD/seed.
8. **Revenue & forecast audit** — verify Revenue Received uses `payment_events` success-only, refunds netted, disputes separated; forecast windows (overdue / today / 7 / 14 / 30 / 60 / 90 / RoY) built from Stripe `current_period_end` only.
9. **Churn & recovery audit** — table of states (incomplete, past_due, unpaid, cancel_at_period_end, dispute, setup-required, lapsed) × visible-in-admin / email-sent / timeline-visible / pass-fail.
10. **Setup-required + reactivation cohorts** — counts, members, token status, next reminder, owner page, entitlement impact.
11. **Member Timeline spot checks (15)** — 5 future-due converted, 2 already-renewed, 2 setup-required, 2 lapsed, 2 failed-payment, 1 manual review, plus Adam Davis.
12. **Screenshot audit** — Playwright captures of the 11 admin pages you named + one converted-BD member timeline, saved under `/mnt/documents/post-bd-audit/screenshots/`.
13. **Language/label sweep** — the `rg` query you specified, every hit classified; flag any "Core shown as Verified" or "lapse shown as Unverified" violations.
14. **Removal / archive plan** — per-item file, reason, risk, timing, needs-migration?, needs-user-comms?
15. **Proposed admin rebuild** — target sidebar + per-page scope (cockpit / professionals / memberships / payments / churn / ops / migration-archive).
16. **Final report** → `docs/admin-v2/post-bd-migration-admin-audit-2026-06-28.md` with Executive Summary, Population State, Dashboard Trust, Legacy Leftovers, Ranked Fixes (P0–P3), Removal Plan, Rebuild Plan, Screenshots index, Final Recommendation (1 of 4).

## Deliverables (all under `/mnt/documents/post-bd-audit/`)
- `bd-member-state-2026-06-28.csv` — row-level export
- `stripe-reconciliation-exceptions.csv` — all exception buckets
- `legacy-code-references.csv` — every `rg` hit + classification
- `cron-route-audit.csv`
- `screenshots/*.png`
- `docs/admin-v2/post-bd-migration-admin-audit-2026-06-28.md` — the report

## Guardrails
- Only `SELECT` SQL via `psql`. No `supabase--migration`, no inserts, no Stripe API calls, no email sends, no cron edits, no file edits in `src/`.
- The only files written are under `/mnt/documents/post-bd-audit/` and the one report file under `docs/admin-v2/`.
- Final Recommendation will be one of the 4 options you listed — no implementation work follows without your explicit go-ahead.

## After you approve
I run the audit end-to-end in build mode and return: the report path, the CSVs, screenshot index, and the one-line Final Recommendation. Any P0 fixes wait for a separate approval.
