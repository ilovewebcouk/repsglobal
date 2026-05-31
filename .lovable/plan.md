# Phase 1 visual completion — proposed batch

## What's already built (✅)
Public: `/` · `/find-a-professional` · `/pro/$slug` · `/login` · `/signup`
Professional dashboard: `/dashboard` · `/dashboard/profile` · `/dashboard/leads` · `/dashboard/clients/sarah-johnson` · `/dashboard/calendar` · `/dashboard/programs` · `/dashboard/check-ins`
Admin: `/admin` (shell only)

## Proposed batch — remaining Phase 1 pages

All built against the locked `reps_fullpage_*_v1.png` mock-ups and the REPs visual system / radius / token rules (REPs Build Compliance skill enforced post-flight).

### Group A — Professional dashboard (remaining 6)
Per the spec doc §8.1 future routes:

1. **`/dashboard/bookings`** — payments-adjacent booking ledger (separate from calendar): upcoming / completed / cancelled / refund-requested, filters, per-booking row with client + service + status + amount.
2. **`/dashboard/payments`** — revenue KPIs, payouts timeline, invoices table, subscription clients, failed payment alerts.
3. **`/dashboard/nutrition`** — meal-plan builder analogue to programmes: plan list, daily macro targets, per-meal cards, client assignment, adherence.
4. **`/dashboard/messages`** — 3-pane inbox (conversation list / thread / client context panel), unread badges, quick replies.
5. **`/dashboard/reviews`** — public reviews feed, rating breakdown, response composer, flagged/pending moderation list.
6. **`/dashboard/cpd`** — CPD log, current cycle progress ring, certificate cards, upcoming courses, evidence uploads (visual only).
7. **`/dashboard/settings`** — account / business profile / notifications / billing / integrations tabs.

(Skipping `/dashboard/clients` index — `clients/$slug` already covers the deep page and the leads/CRM list serves a similar shell. Will add a clients index only if you want it.)

### Group B — Admin sub-pages (spec §9.1)
Lighter than dashboard — shell consistency over deep functionality:

8. **`/admin/professionals`** — searchable directory of pros, status chips, bulk actions.
9. **`/admin/verification`** — verification queue with evidence preview panel + approve/reject.
10. **`/admin/memberships`** — plan tiers, active member counts, churn signals.
11. **`/admin/reviews`** — moderation queue, flagged review detail panel.
12. **`/admin/payments`** — platform revenue, payout runs, refund queue.
13. **`/admin/migration`** — Brilliant Directories migration progress dashboard (BD-specific, allowed in Phase 1 as a visual shell).

(Skipping `/admin/directory`, `/admin/cpd`, `/admin/support`, `/admin/settings` from the batch — flag if you want any added back.)

### Group C — Public marketplace gaps
Phase 1 lock targets the 6 mock-ups. Public site only has homepage, directory, profile, signup/login. Likely-needed extras — **not in the batch unless you confirm**:
- `/about`, `/for-professionals`, `/pricing`, `/contact`
These have no locked mock-up, so they'd be derived from the public homepage visual language.

## Working agreement per page (Option A inside the batch)

For each page in the batch:
1. You give me ~5 lines: route confirm, any specific copy/numbers/sections that matter, anything to skip.
2. I build it directly (no plan tool, no long prompt) reusing the dashboard shell + tokens.
3. Post-flight: run the REPs build-compliance audit, capture a full-page screenshot, hand back.
4. You approve or request tweaks before I move to the next.

If you say "just go" for a page with no brief, I'll invent realistic UK-fitness placeholder data (client names, £ amounts, dates) consistent with the existing pages (Sarah Johnson, Amelia Carter, etc.).

## Decisions I need from you

1. **Approve the Group A + Group B list above?** (13 pages total.) Remove or add any?
2. **Group C public pages** — in or out of Phase 1?
3. **Order** — build in the order listed, or prioritise specific pages first (e.g. messages + payments first because they're core to the pro's daily use)?
4. **`/dashboard/clients` index page** — add it or skip?

Once you answer, I'll start with page #1 and we'll work through the batch one at a time.
