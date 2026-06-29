# REPS Admin — Full QA Audit + Cancellation Lifecycle

**Date:** 2026-06-29
**Auditor:** Lovable (agent)
**Scope:** Every admin route + every entry point that ends a member's relationship with REPS.
**Method:** Source read of every admin route, server fn, and webhook; live DB queries against `subscriptions`, `professionals`, `disputes`, `email_send_log`; cross-check of UI promises vs server-fn behaviour.
**No code changes in this pass.** Fix plan at the end — to be executed in a follow-up build pass after you approve.

---

## TL;DR (founder summary, no jargon)

1. **The biggest bug on the platform right now.** In Member 360 → "Delete account", the radio button **"Cancel at period end"** says "lets the current paid period run out, then closes the account." It doesn't. Every option in that dialog runs the **same** server function, which cancels Stripe **immediately** and deletes the account **immediately**. There is no period-end grace path. If you pick the middle option thinking you're being kind, you still nuke them instantly. **P0.**

2. **Two cancellation rails that don't agree.** Admin-initiated cancellations (Member 360, support ticket) delete the auth user, archive the email, and send the `member-cancelled` template via Mailgun. Stripe-initiated cancellations (member self-cancel via portal, or you cancelling from the Stripe dashboard) hit the webhook, enter the churn `grace` stage, send a **different** template (`cancellation-confirmation`) via the queue, and **do nothing else**. The public profile stays up. The auth user stays. The email is never archived to the mailing list. **P0.**

3. **No member-facing "cancel" button.** `ManageBillingButton` opens the Stripe Customer Portal, but it isn't placed anywhere on the trainer dashboard. Members who ask to cancel today have to email support. That's why every cancellation today goes through the admin path.

4. **You have no cancellation history in the DB.** Because the admin path deletes the auth user (which cascades the `subscriptions` row), there are **zero** rows with `status='canceled'`. The only proof a cancellation ever happened is the email log + admin audit log. You can't answer "how many cancellations last month?" from the database.

5. **Admin nav has 5 dead routes.** `/admin/memberships`, `/admin/payments`, `/admin/reconciliation`, `/admin/churn`, `/admin/cleanup` exist as full route files but aren't in the sidebar. Either delete them or surface them. Right now they're orphans.

6. **`/admin/billing` claims to be Stripe-truth. It isn't.** `listSubscriptions` reads from the DB mirror (`public.subscriptions`), not live Stripe. That's fine for performance, but the previous brief said "live Stripe fetch on mount" — that promise is broken for the Subscriptions tab.

7. **487 emails in DLQ, no UI to see them.** Banner was removed, replacement console (`/admin/emails`) was never built. Number is real; visibility is zero.

8. **5 orphan professionals** exist with no subscription (one is the `james-wilson` demo we keep on purpose; the other 4 are stale signup attempts with no slug, unpublished). Should be cleaned up.

9. **Currently in the DB:** 327 trialing + 8 active = **335 paying-or-trialing subs**, **1 open dispute** (`funds_withdrawn`), **0 cancellations on record**.

---

## Part A — Admin route audit

Status legend: **PASS** = works as advertised · **DRIFT** = works but not how the docs/UI say · **FAIL** = broken or misleading · **ORPHAN** = file exists, not linked from nav.

| Route | Status | Source of truth | Notes |
|---|---|---|---|
| `/admin` (Overview) | DRIFT | DB mirror + `overview.functions.ts` | KPIs read from `subscriptions` table, not Stripe live. Fine for performance, but mirror drift is unaudited. |
| `/admin/billing` | DRIFT | DB mirror (Subscriptions tab) + Stripe live (Payments / Disputes / Refunds) | Mixed rails. UI doesn't tell you which tab is live and which is mirror. |
| `/admin/members/$userId` (Member 360) | **FAIL** | Mixed | "Cancel at period end" strategy is a lie (see Part B). All 3 strategies do the same thing. |
| `/admin/professionals` | PASS | DB via `count_confirmed_professionals` RPC | Recently rebuilt; trimmed tabs; sparklines wired. |
| `/admin/verification` | PASS | DB | Active surface, daily use. |
| `/admin/reviews` | PASS | DB + `review_notifications` | Active. |
| `/admin/support` | PASS | DB + `MemberCancelCard` | `MemberCancelCard` funnels into the same broken `cancelAndDeleteMember`. |
| `/admin/campaigns` | PASS | DB | Active. |
| `/admin/team` | PASS | `user_roles` | Admin invites use REPS-branded email. |
| `/admin/settings` | PASS | DB | Operational. |
| `/admin/directory` | PASS | DB | Listings curation. |
| `/admin/gyms` | PASS | DB | Listings curation. |
| `/admin/cpd` | PASS | DB | Listings curation. |
| `/admin/memberships` | **ORPHAN** | DB mirror | Not in sidebar. Overlaps `/admin/billing → Subscriptions`. Recommend delete. |
| `/admin/payments` | **ORPHAN** | DB mirror | Not in sidebar. Overlaps `/admin/billing → Payments`. Recommend delete. |
| `/admin/reconciliation` | **ORPHAN** | DB mirror | Not in sidebar. Earlier turn removed all "Reconcile →" links from KPIs. Recommend delete. |
| `/admin/churn` | **ORPHAN** | `churn_lifecycle` | Not in sidebar. Either re-add to nav under Support & Comms, or fold into Member 360 Billing tab. |
| `/admin/cleanup` | **ORPHAN** | Batch fn | One-shot tool, run already. Recommend delete. |

**Dead-route purge recommendation: delete all 5 orphan routes.** Net reduction: ~5 route files, ~2.5k lines, zero user impact (none are linked).

---

## Part B — Cancellation & deletion lifecycle (the critical flow)

### Entry points found

| # | Entry point | Code path | What it actually does |
|---|---|---|---|
| 1 | Member self-cancel via Stripe portal | Stripe → webhook `customer.subscription.deleted` | Updates `subscriptions.status='canceled'`, enters churn `grace` stage, sends `cancellation-confirmation` email. **Does not delete auth user. Does not unpublish profile. Does not archive email.** |
| 2 | Support ticket → "Close this member's account" card | `MemberCancelCard` → `cancelAndDeleteMember` | Cancels Stripe immediately, deletes auth user, archives email, sends `member-cancelled` email. |
| 3 | Member 360 → "Delete account" → "End trial now" | BillingActions → `cancelAndDeleteMember(reason: admin_end_trial)` | Same as #2. Email subject differs by reason. |
| 4 | Member 360 → "Delete account" → **"Cancel at period end"** | BillingActions → `cancelAndDeleteMember(reason: admin_cancel_period_end)` | **Same as #2. Cancels immediately. UI lies.** |
| 5 | Member 360 → "Delete account" → "Cancel immediately" | BillingActions → `cancelAndDeleteMember(reason: admin_cancel_immediate)` | Same as #2. |
| 6 | Cancel inside Stripe dashboard (you, manually) | Webhook → same as #1 | Same as #1. |
| 7 | Chargeback / dispute lost | `disputes.server.ts` | Updates `payment_standing`, does NOT auto-cancel. Manual follow-up required. |

### Behaviour matrix — what each path actually does

| Effect | Admin path (#2–5) | Webhook path (#1, #6) | Dispute (#7) |
|---|---|---|---|
| Stripe sub cancelled | ✅ immediate | ✅ already cancelled | ❌ no |
| `subscriptions.status` set to `canceled` | ❌ (row cascaded away) | ✅ | n/a |
| `subscriptions.canceled_at` recorded | ❌ (row cascaded) | ✅ | n/a |
| Auth user deleted | ✅ | ❌ | ❌ |
| Profile / professional cascaded | ✅ (via FK on `auth.users`) | ❌ | ❌ |
| Public `/pro/$slug` returns 404 | ✅ immediately | ❌ stays live | ❌ |
| Excluded from `/in/$city` and search | ✅ (no professional row) | ⚠️ stays visible until `is_publicly_visible` filter (sub not active) | ⚠️ visible if past_due |
| Email archived to `mailing_list_contacts` | ✅ | ❌ | ❌ |
| `erase_user_pii` RPC called | ❌ (auth delete cascades, but PII in `enquiries`, `reviews`, `support_messages` is anonymised by the cascade triggers, not by the RPC) | ❌ | ❌ |
| Confirmation email | ✅ `member-cancelled` (Mailgun, immediate) | ✅ `cancellation-confirmation` (queue, eventually) | ❌ |
| Admin audit log | ✅ | ❌ | ❌ |
| Member 360 Timeline event | ⚠️ via audit log only | ❌ | ❌ |
| Cancellation visible in `/admin/billing → Subscriptions` history | ❌ (row gone) | ✅ until next cleanup | n/a |

### The core architectural problem

You have **two cancellation contracts** that don't agree on what "cancel" means:

- **Admin contract:** cancel = **delete the human**. Best for spam / refund-abuse / member-requested account closure.
- **Stripe-portal contract:** cancel = **end billing, keep the human around**. Best for "I'll be back next year" lapses.

Both are valid. Neither is wrong on its own. The bug is that **the admin UI exposes a "Cancel at period end" option that promises the Stripe-portal contract but executes the admin contract.** And the webhook path has no eventual cleanup, so members who self-cancel via Stripe quietly accumulate as `status='canceled'` rows with live public profiles forever.

### Recommended canonical contract (for the fix pass)

One function — `closeMembership(userId, mode, reason, notes)` — with **three honest modes**:

| Mode | Stripe | Auth user | Profile | When to use |
|---|---|---|---|---|
| `end_now_delete` | `subscriptions.cancel()` | delete now | delete now | spam, abuse, "delete me" requests |
| `end_period_delete` | `subscriptions.update({cancel_at_period_end: true})` | schedule delete on `customer.subscription.deleted` webhook | unpublish now, delete on webhook | paying member who wants to leave at term |
| `end_now_archive` | `subscriptions.cancel()` | **keep**, mark `archived_at` | unpublish, keep row | member who wants to come back next year |

Every entry point (admin Member 360, support card, Stripe portal webhook, dispute lost) routes through this one function with the right mode. No drift possible.

---

## Part C — `/admin/billing` console deep dive

| Tab | Source | Filters work | CSV export | Stripe link | Member 360 link | Verdict |
|---|---|---|---|---|---|---|
| Payments | Stripe live via mirror | yes | yes | yes | yes | DRIFT — labelled "live" but reads from `payment_events` mirror |
| Subscriptions | DB mirror only | yes | yes | yes | yes | **DRIFT vs spec** — previous turn said "live Stripe fetch on load/mount". Code reads from `public.subscriptions`. |
| Disputes | DB `disputes` table | yes | n/a | yes | yes | PASS — table is webhook-fed, matches Stripe |
| Refunds | Stripe live | yes | yes | yes | yes | PASS |

Recommendation: either (a) actually fetch Subs live and accept the latency, or (b) drop the "live" wording from the page. Picking (b).

---

## Part D — KPI reconciliation (spot check)

Numbers as of audit run:

| KPI | Shown on `/admin` | DB truth | Stripe truth (to be confirmed) | Delta | Cause |
|---|---|---|---|---|---|
| Active paying members | (live read) | 335 (327 trialing + 8 active) | TBD next pass | TBD | Most members still in BD-migration trial window. |
| Revenue received (period) | (live read) | computed from `payment_events` | TBD | TBD | Period defaults to last 30d. |
| Projected cash due | (live read) | computed from `subscriptions.current_period_end` | TBD | TBD | Excludes `cancel_at_period_end` — but since admin path never sets that flag, the exclusion never fires from admin actions. |
| New paid subs MTD | (live read) | DB count | TBD | TBD | Includes trialing as paying. |
| **Cancellations MTD** | not shown | **0** (no `canceled` rows exist) | will not match Stripe | **unknowable** | Admin cancels delete the row. |

Biggest reconciliation risk: anything that depends on `subscriptions.status='canceled'` rows existing is wrong, because admin cancels delete them.

---

## Part E — Defect register (prioritised)

| # | Sev | Where | Bug | Repro / evidence |
|---|---|---|---|---|
| 1 | **P0** | Member 360 → BillingActions | "Cancel at period end" runs `stripe.subscriptions.cancel()` (immediate). `reason` is a label only, not a behaviour switch. | `src/lib/admin/billing-actions.functions.ts:243-252` — single `cancel()` call inside the `subs.forEach` loop for every reason value. |
| 2 | **P0** | Stripe webhook | `customer.subscription.deleted` does not delete auth user or unpublish profile. Self-cancellers stay live forever. | `src/routes/api/public/payments/webhook.ts:605-636` — only enters churn stage + sends email. |
| 3 | **P0** | No member-facing cancel UI | `ManageBillingButton` exists but isn't wired into the trainer dashboard. Members can't self-cancel without a support ticket. | `rg "ManageBillingButton" src/routes/_authenticated/` returns zero hits. |
| 4 | **P1** | Cancellation history | Admin path deletes the `subscriptions` row, so `/admin/billing → Subscriptions` and any "Cancellations MTD" KPI can't see history. | `psql -c "SELECT count(*) FROM subscriptions WHERE status='canceled'"` returns 0. |
| 5 | **P1** | Two cancellation email templates | `member-cancelled` (Mailgun direct, admin path) and `cancellation-confirmation` (queue, webhook path) coexist. Inconsistent tone and timing. | Both files present in `src/lib/email-templates/`. |
| 6 | **P1** | `/admin/billing → Subscriptions` is DB mirror | Spec said "live Stripe fetch on load/mount"; code reads `subscriptions` table. | `src/lib/admin/billing-console/list.functions.ts:317-329`. |
| 7 | **P1** | 5 orphan admin routes | `/admin/memberships`, `/admin/payments`, `/admin/reconciliation`, `/admin/churn`, `/admin/cleanup` — file exists, not in nav. | `src/components/dashboard/nav-data.ts:133-170`. |
| 8 | **P2** | 487 emails in DLQ, no UI | Visibility removed when ops banner was dropped. No `/admin/emails` console. | `psql -c "SELECT count(DISTINCT message_id) FROM email_send_log WHERE status='dlq'"` = 487. |
| 9 | **P2** | 5 orphan professionals with no subscription | 4 unpublished, unverified, no slug; 1 is intentional `james-wilson` demo. | See query at top of audit. |
| 10 | **P2** | Disputes don't auto-cancel | A `chargeback_lost` does not call any cancel path. Manual cleanup. | `src/lib/billing/disputes.server.ts`. |
| 11 | **P3** | `findMemberByEmail` paginates 20 × 200 auth users | Will scale-degrade past ~4k accounts. Fine for now (~400 members), needs index/RPC later. | `src/lib/admin/billing-actions.functions.ts:364-373`. |
| 12 | **P3** | No Timeline event surface | Member 360 → audit log entries written but no Timeline tab on M360 surfaces them. | Member 360 has Billing/Verification/etc tabs, no "Timeline" tab. |
| 13 | **P3** | `erase_user_pii` RPC never called | RPC exists for GDPR, but the cancel/delete flow relies on FK cascade only. Cleaner anonymisation possible. | RPC in db-functions list; not called from any admin server fn. |

---

## Part F — Prioritised fix plan

### P0 (do first — data integrity / promised behaviour)

1. **Rewrite the cancellation contract into one canonical function** (`closeMembership` with 3 honest modes — see Part B). Update Member 360 BillingActions, support `MemberCancelCard`, and the webhook handler to route through it. Wire `mode='end_period_delete'` to use `cancel_at_period_end=true` and let the eventual `customer.subscription.deleted` webhook do the final delete.
2. **Make the webhook path do the right thing.** On `customer.subscription.deleted`, look up `closeMembership(userId, mode='end_now_delete', reason='member_self_cancel')` so a self-cancel is handled the same as an admin cancel.
3. **Add `ManageBillingButton` to the trainer dashboard billing tile** so paying members can self-serve.

### P1 (do this week — surface drift)

4. **Collapse `cancellation-confirmation` + `member-cancelled` into one template** with a `reasonLabel` slot. Send via Mailgun directly (existing pattern) in all cases.
5. **Decide and label `/admin/billing → Subscriptions`:** either fetch live (slow + accurate) or drop the "live" claim (fast + mirror).
6. **Delete the 5 orphan admin routes** (`memberships`, `payments`, `reconciliation`, `churn`, `cleanup`) and any components only they import.
7. **Keep cancellation history.** Switch the admin path from `auth.admin.deleteUser` to (a) `cancel_at_period_end=true` for paying / (b) immediate cancel + auth-delete-on-next-cron, but keep the `subscriptions` row with `status='canceled'` for at least 90 days.

### P2 (do next sprint — visibility)

8. **Ship `/admin/emails`** (3 tabs: DLQ / Recent / Suppressions). Wire dedupe by `message_id`. Link from `/admin` Overview.
9. **Hard-delete the 4 anonymous orphan professionals** (keep `james-wilson` demo).
10. **Wire dispute → cancellation policy** (chargeback_lost auto-closes membership via `closeMembership` mode `end_now_delete`).

### P3 (cleanup)

11. Add a `Timeline` tab to Member 360 that reads `admin_audit_log` filtered by `target_id = userId`.
12. Call `erase_user_pii` from `closeMembership` for cleaner GDPR posture.
13. Replace `auth.admin.listUsers` pagination in `findMemberByEmail` with an indexed RPC.

---

## Approve to execute

Reply with which severities you want me to fix in the next build pass:

- **"Fix all P0"** → I'll rewrite the cancellation contract + webhook + add self-serve cancel.
- **"Fix P0 + P1"** → above plus template consolidation, orphan-route purge, cancellation history retention.
- **"Fix everything"** → full sweep including emails console and dispute auto-close.
- **"Just the lying button"** → minimum viable: stop the "Cancel at period end" strategy from immediate-cancelling, leave everything else for later.

I'd recommend P0 + P1 + #8 (emails console). That clears the data-integrity bugs and the two surfaces you can actually see drift in the UI.
