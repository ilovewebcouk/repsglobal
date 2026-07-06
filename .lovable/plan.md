# QA sweep: Cloud jobs + Storage buckets

## Why "shop-front" still appears in Storage

The `website-*` buckets were created on **2026-07-04** after the S-word ban, but nothing migrated the older `shop-front-*` buckets or deleted them. They are the leftovers of the pre-rename design. On top of that, two page routes still use the banned word in their URLs (`/features/shop-front` and `/dashboard/shop-front`) plus a `public.shop_fronts` table and trigger, so the word will keep reappearing in Storage/DB tooling until that layer is renamed too.

This plan cleans up **jobs + Storage only**. Code-level rename is called out at the bottom as a separate follow-up.

---

## Part 1 — Storage sweep

Current state (16 buckets):

| Bucket | Public | Objects | Verdict |
|---|---|---|---|
| `shop-front-hero` | public | **1 file, 212 KB** | **Migrate → `website-hero`, then delete** |
| `shop-front-results` | public | 0 | **Delete** |
| `shop-front-services` | public | 0 | **Delete** |
| `website-hero` / `-results` / `-services` | public | 0 | **Keep** (correct forward-looking targets) |
| `avatars`, `pro-photos`, `campaign-media`, `organisation-assets` | public | — | Keep (in-use) |
| `identity-docs`, `insurance-docs`, `verification-docs`, `course-accreditations`, `provider-review-evidence`, `support-attachments` | private | — | Keep (compliance) |

**Actions:**
1. Copy the 1 file from `shop-front-hero` → `website-hero` at the same path via `storage.objects` migration; update any DB row that references the old bucket in its URL.
2. Grep the codebase for `shop-front-hero|shop-front-results|shop-front-services` string usage in `.ts/.tsx/.sql` before deletion. Any hit gets rewritten to the `website-*` equivalent in the same migration.
3. Drop the three `shop-front-*` buckets (and their RLS policies on `storage.objects`).

---

## Part 2 — Cron jobs sweep

Read `cron.job` (17 active jobs). Cross-referenced every HTTP-calling job against `src/routes/api/public/` and got a `307` redirect (not a real handler) from three endpoints — meaning **the cron has been firing daily into a dead URL**:

| Job | Cadence | Endpoint | Status | Recommendation |
|---|---|---|---|---|
| `churn-lifecycle-daily` | daily 23:30 London | `/api/public/hooks/lifecycle-cron` | **404 (307 fallback)** | **Unschedule** (no handler, and the job's apikey also has a typo `role:"ddon"`) |
| `legacy-stripe-renewal-daily` | daily 00:15 London | `/api/public/hooks/legacy-renewal` | **404 (307 fallback)** | **Unschedule** (no handler; also uses banned "legacy"/BD-migration language) |
| `support-auto-close-daily` | daily 03:15 | `/api/public/hooks/support-auto-close` | **404 (307 fallback)** | **Unschedule** (no handler) |
| `onboarding-nudges-daily` | daily 08:00 | `/api/public/hooks/onboarding-nudge-cron` | live handler | Keep |
| `send-scheduled-campaigns` | every minute | `/api/public/hooks/send-scheduled-campaigns` | live handler | Keep (flag: every-minute cadence — confirm still needed) |
| `seo-index-scan-daily` | daily 06:15 | `/api/public/cron/seo-index-scan` | live handler | Keep |
| `ops-alerts-dispatch` | every 5 min | `/api/public/ops/alert-dispatch` | live handler | Keep |
| `ops-alerts-evaluate` | every 5 min | SQL `ops_alerts_evaluate()` | SQL | Keep |
| `insurance-check-renewals-daily` | daily 07:00 | SQL `insurance_check_renewals()` | SQL | Keep |
| `monthly-credit-refills` | monthly | SQL `run_monthly_credit_refills()` | SQL | Keep |
| `recompute-verification-daily` | daily 01:00 | SQL `recompute_verification_daily_sweep()` | SQL | Keep |
| `support-maintenance-nightly` | daily 03:17 | SQL `support_run_maintenance()` | SQL | Keep |
| `purge-*` (5 jobs) + `prune-visitor-ip-observations` | nightly | SQL DELETE / purge fns | SQL | Keep |

**Actions:**
1. `SELECT cron.unschedule('churn-lifecycle-daily');`
2. `SELECT cron.unschedule('legacy-stripe-renewal-daily');`
3. `SELECT cron.unschedule('support-auto-close-daily');`

Nothing else in the schedule is stale.

Security debt worth flagging (not fixed in this sweep — the working handlers still authenticate, this is just posture):
- `send-scheduled-campaigns`, `seo-index-scan-daily`, `onboarding-nudges-daily` include a hardcoded static `Bearer 418d073c…` token in the cron command instead of an `apikey`. Fine for `/api/public/*` (auth is bypassed at the edge) but the token in plain text is credential in a schema-visible surface.

---

## Part 3 — Out of scope, flagging for a follow-up

The reason the S-word keeps resurfacing:

- `src/routes/features.shop-front.tsx` and `src/routes/_authenticated/_professional/dashboard_.shop-front.tsx` (public URLs `/features/shop-front` and `/dashboard/shop-front`).
- `public.shop_fronts` table + `tg_seed_shop_front_on_identity_approved` trigger.
- Feature flag row `shopfront.lite_seed`.

Renaming these means URL redirects, a table rename migration, feature-flag key change, and touching every consumer. That's its own PR — **do you want me to write a follow-up plan for the full code-level rename after this sweep lands, or leave those as-is for now?**

---

## Verify after execution

- `SELECT jobname FROM cron.job ORDER BY jobname;` → the 3 unscheduled names are gone; remaining 14 all present.
- `SELECT id FROM storage.buckets WHERE id LIKE 'shop-front-%';` → 0 rows.
- `SELECT bucket_id, count(*) FROM storage.objects WHERE bucket_id = 'website-hero' GROUP BY 1;` → includes the migrated file.
- Site check: any page that used the migrated hero image still renders (visual smoke test on the professional dashboard whose row we rewrote).
