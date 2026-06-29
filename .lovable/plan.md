
# Delete `/admin/ops` — Full Purge

## Verdict
`/admin/ops` is dead weight post-BD-migration. Delete it. Keep only the **Alerts banner** and **System status strip** by lifting them onto `/admin` (Overview).

## What gets deleted

**Routes (9 files):**
- `src/routes/admin_.ops.tsx` (hub)
- `src/routes/admin_.ops.activity.tsx`
- `src/routes/admin_.ops.customer.tsx`
- `src/routes/admin_.ops.platform.tsx`
- `src/routes/admin_.ops.email.tsx`
- `src/routes/admin_.ops.alerts.tsx`
- `src/routes/admin_.ops.member.$userId.tsx` (replaced by `/admin/members/$userId` M360)

**Component folder:**
- `src/components/ops/` — `OpsSubNav`, `SystemStatusStrip`, `MemberFinder`, `source-pill`, etc.
  - **Lift before delete:** `SystemStatusStrip`, `MemberFinder`, alerts banner → move to `src/components/admin/`

**Server-fn folder:**
- `src/lib/ops/` — `operations.functions`, `activity.functions`, `timeline.functions`, `system-status.functions`
  - **Keep:** `system-status.functions` (move to `src/lib/admin/`) and `operations.functions`'s `getOpenAlerts` / `runAlertEvaluator` (move to `src/lib/admin/alerts.functions.ts`)
  - **Delete:** `activity`, `timeline`, `customer-health` server fns + their DB-touching helpers

**API route:**
- `src/routes/api/public/ops/alert-dispatch.ts` — keep (cron-called); rename folder to `src/routes/api/public/alerts/` for clarity, or leave path stable to avoid breaking pg_cron

## What gets lifted to `/admin` Overview

1. **Alerts banner** at top (the green "All systems normal" / red "N open alerts" strip with Re-evaluate button)
2. **System status strip** (5 tiles: Stripe, Mailgun, Cron, DB, Queues) below the KPI cards
3. **MemberFinder** stays pinned in the top bar (already there)

Member 360 (`/admin/members/$userId`) already replaces the Ops member timeline — no work needed.

## Sidebar update
Remove the "Operations" nav entry from `DashboardShell` admin nav.

## Cron / external dependencies
- `pg_cron` calls `alert-dispatch` API route — keep path stable or update the cron job in the same migration
- Alert evaluator stays running; just the UI moves

## Out of scope
- Renaming/deleting the `ops_alerts` table (keep — the alert system still runs)
- Touching `/admin/billing`, `/admin/members/$userId`, or Overview KPI logic

## Risk
Low. Ops is a UI-only layer over already-running cron jobs and other admin pages. Only risk is the `alert-dispatch` cron URL — handled by keeping the path.

## Confirmation needed before build
1. Confirm: delete all 7 Ops routes + `components/ops/` + `lib/ops/` (lifting only alerts + system-status + MemberFinder)?
2. Confirm: lift alerts banner + system status strip onto `/admin` Overview (top of page)?
3. Keep `alert-dispatch` API path stable (don't break pg_cron) — yes?
