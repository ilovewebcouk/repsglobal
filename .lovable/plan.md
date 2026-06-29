## What I'm fixing

From `docs/admin-v2/admin-full-qa-2026-06-29.md`. Brutal scope honesty up-front: this is ~5 distinct refactors. I'll do them all in one pass but I want you to see the shape before I burn the credits.

### P0 — Data integrity (must-do)

1. **Stop the lying "Cancel at period end" button.**
   - Today every radio option in Member 360 → Delete account calls `cancelAndDeleteMember` (immediate Stripe cancel + auth user delete).
   - New canonical server fn: `closeMembership({ user_id, mode, reason, notes })` with **three honest modes**:
     - `schedule_end_period` → `cancel_at_period_end=true` on Stripe. **No delete.** Profile stays live until period end. Member can resume.
     - `end_now_delete` → cancel Stripe immediately, archive email, delete auth user.
     - `delete_only` → no Stripe sub on file; archive + delete.
   - Member 360 dialog rewritten so each radio executes what it says.
   - Support ticket `MemberCancelCard` picks the right mode based on whether a live sub exists.

2. **Make the Stripe-portal self-cancel path do the same cleanup as the admin path.**
   - Webhook `customer.subscription.deleted` currently: updates DB, enters churn grace, sends `cancellation-confirmation`. Leaves auth user + public profile **live forever**.
   - Patch the webhook to also: archive email to `mailing_list_contacts`, set `professionals.is_published=false`, write an admin audit log entry (`actor='stripe_webhook'`).
   - **Do not auto-delete the auth user from the webhook** — that's a one-way action and a wrong webhook can nuke a paying member. Instead surface "Pending close — self-cancelled" in `/admin/billing → Subscriptions` so you can confirm and run `end_now_delete` from Member 360.

3. **Retain cancellation history (90 days).**
   - The admin path's auth-user delete cascades the `subscriptions` row, so you have 0 cancellations on record. Bad for analytics.
   - Drop the FK cascade from `subscriptions.user_id` → keep the row with `user_id=NULL` and `status='canceled'` after delete. Add `cancelled_email`, `cancelled_full_name`, `cancellation_reason`, `cancelled_at` columns so the row stands alone. Backfill a row for every cancel going forward.

### P1 — Surface drift

4. **Collapse the two confirmation email templates.** `cancellation-confirmation` + `member-cancelled` → one template (`member-cancelled`) with a `reasonLabel` slot. Webhook + admin path both send via Mailgun direct.

5. **Delete the 5 orphan admin routes** and **fix every inbound link** found in the audit (sidebar already clean, but `UserAccountMenu`, `RevenueAndMembership`, `MemberReconciliationStrip`, `RenewalEngineCard` all still link to them — those get repointed to `/admin/billing` and `/admin/members`).
   - Delete: `admin_.memberships.tsx`, `admin_.payments.tsx`, `admin_.reconciliation.tsx`, `admin_.churn.tsx`, `admin_.cleanup.tsx`.

6. **Subscriptions tab honesty.** `/admin/billing → Subscriptions` currently reads the DB mirror. Add a "Synced from Stripe Xs ago · Refresh" pill so the UI no longer claims "live".

### P2 — Visibility

7. **Ship `/admin/emails`** — 3 tabs (Recent / DLQ / Suppressions) reading `email_send_log` + `suppressed_emails`. Replace the dropped DLQ banner with a small tile on `/admin` Overview that links here.

8. **Hard-delete the 4 orphan professionals** (no slug, unpublished, no sub, not `james-wilson`). One server fn behind an admin button, idempotent.

9. **Dispute → cancellation policy.** When a dispute hits `lost` or `charge_refunded`, call `closeMembership({ mode: 'end_now_delete', reason: 'chargeback_lost' })`. Audit logged.

### What I'm NOT doing in this pass

- **P3** items (Timeline tab on M360, `erase_user_pii` call, RPC for `findMemberByEmail` pagination) — too much surface, low value right now. Will leave them in the doc.
- **Trainer self-serve cancel button** — audit said missing; it's actually already wired (`ManageBillingButton` on `/dashboard/payments` and `/dashboard/settings`). Audit item closed, no code change.

## Risk / blast radius

- Schema migration on `subscriptions` (drop cascade + add 4 nullable columns). Reversible. No data loss.
- Webhook change is additive — existing path still runs.
- 5 route deletes + ~6 link repoints. All routes verified orphan from sidebar; inbound links found by grep are all fixable.

## Deliverable order

I'll ship in this order so each step is independently verifiable:

```text
1. Migration: subscriptions retention columns + drop user_id cascade
2. closeMembership server fn (new) + tests via invoke-server-function
3. Member 360 BillingActions rewrite (honest modes)
4. MemberCancelCard rewrite
5. Webhook subscription.deleted patch
6. Template consolidation
7. Orphan route purge + link repoints
8. /admin/emails console
9. Dispute → cancel wiring
10. Live-stripe pill on /admin/billing Subscriptions tab
11. Orphan professional cleanup button
```

Final post-flight: re-query the DB, confirm 0 stale-published-but-cancelled profiles, take screenshots of Member 360 dialog showing the three honest modes, and update the audit doc with a `Resolved` section.

Approve and I'll start at step 1.