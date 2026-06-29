# Admin Dashboard + Cancellation Lifecycle — Full QA Audit

A deep, evidence-based audit across every admin surface and the entire member-cancellation flow. No code changes in this pass — the deliverable is a written audit with PASS/FAIL per area, defects, and a prioritised fix list. Once you approve the findings, I'll execute the fixes in a follow-up build pass.

## Scope

### Part A — Admin surface audit (every route)
For each route: purpose, what it reads, what it writes, data source (Stripe live vs mirror vs DB), known issues, PASS/FAIL.

Routes covered:
- `/admin` (Overview)
- `/admin/billing` (Payments · Subscriptions · Disputes · Refunds)
- `/admin/members/$userId` (Member 360 — 7 tabs)
- `/admin/professionals`
- `/admin/memberships`
- `/admin/payments`
- `/admin/reconciliation`
- `/admin/churn`
- `/admin/reviews`
- `/admin/support`
- `/admin/verification` (identity / quals / insurance)
- `/admin/campaigns`
- `/admin/cpd`, `/admin/gyms`, `/admin/directory`
- `/admin/team`, `/admin/settings`, `/admin/cleanup`

For each I'll record: still needed? duplicated elsewhere? linked from nav? legacy jargon? broken queries? KPI drift vs Stripe?

### Part B — Cancellation & deletion lifecycle (end-to-end)
The critical flow you flagged. I'll trace every entry point and confirm they all funnel through one canonical path with no drift.

Entry points to verify:
1. **Member self-cancel** (dashboard → Stripe portal → webhook)
2. **Support ticket "Close this member's account"** (`MemberCancelCard`)
3. **Member 360 → Billing tab → Cancel actions** (`BillingActions`)
4. **Member 360 → destructive deletion dialog** (`cancelAndDeleteMember`)
5. **Stripe-side cancel** (manual in Stripe dashboard → webhook only)
6. **Chargeback / dispute → forced cancel** (disputes lifecycle)

For each path I'll confirm:
- Stripe subscription cancelled (immediate vs period-end — which do we use, and why)
- `subscriptions` row updated (status, cancel_at_period_end, ended_at)
- Auth user deleted vs retained
- Profile / professional row: deleted, archived, or anonymised?
- PII erasure (`erase_user_pii` RPC) — is it called?
- Email archived to `mailing_list_contacts` for future contact
- Confirmation email sent (which template, from which domain)
- Audit log entry written
- Timeline event created
- KPI counts (Active Paying, Revenue Received, Forecast) update correctly
- Public profile (`/pro/$slug`) returns 404 immediately
- Search/directory excludes them immediately
- No "ghost" subscription or orphaned Stripe customer left behind

### Part C — `/admin/billing` console deep dive
Verify the 4 tabs against Stripe truth, with live fetches:
- **Payments** — charges in period reconcile to Stripe Payments report
- **Subscriptions** — every row matches Stripe (status, tier, price, current_period_end)
- **Disputes** — every Stripe dispute appears; `payment_standing` correct
- **Refunds** — every Stripe refund appears and nets revenue correctly

Plus: filters work, CSV export respects filters, every row links to Stripe + Member 360 + Timeline.

### Part D — KPI reconciliation
Pick 5 spot-check numbers from `/admin` Overview and prove each one matches Stripe + DB:
- Revenue received (period)
- Total revenue (gross)
- Projected cash due (next 30d)
- Active paying members
- New paid subs this month

If any KPI drifts >0, document the cause (timezone, cancel-at-period-end exclusion, refund netting, dispute handling, etc.).

### Part E — Method
I will:
1. Read every admin route file and its server functions.
2. Query the DB directly for subscription/profile/auth state on 3 canonical test members (one active, one cancelled, one disputed).
3. Use the Stripe mirror server functions to cross-check live Stripe state.
4. Drive Playwright against the live preview to screenshot every admin page and each cancellation entry point in the UI.
5. Trace one real cancellation end-to-end (e.g. a recent one in the DB) and verify each downstream effect.

## Deliverable

A single audit doc at `docs/admin-v2/admin-full-qa-2026-06-29.md` containing:

- **Architecture map** — every admin route, its data sources, dependencies, and current status
- **Cancellation flow diagram** — all 6 entry points and where they converge (or don't)
- **Defect register** — every bug found, severity (P0/P1/P2), affected surface, repro steps, evidence (screenshot/query/log)
- **KPI reconciliation table** — number shown vs Stripe truth vs DB truth, delta, root cause
- **Legacy purge list** — routes/components/server fns safe to delete
- **Prioritised fix plan** — P0 (data integrity / cancel drift) → P1 (KPI drift) → P2 (UX) → P3 (cleanup)
- **Recommendation: canonical cancellation contract** — the single function every entry point must call, with a spec for what it guarantees

No code changes in this pass. Once you've reviewed the audit, I'll execute the fix plan as a separate build.

## Estimated effort

~30–40 file reads, ~10–15 DB queries, ~6 Playwright screenshot runs, 1 audit doc. Roughly the same depth as the Post-BD Migration audit I did on 2026-06-28.

Approve and I'll start the audit.
