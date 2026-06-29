
# Admin Billing — Unknown-member fix + MRR source + duplicate-sub cleanup (jgumbley) + Phase 1 Stripe-only QA

Four deliverables in one pass, in this order. **Phase 1 itself is read-only** (no DB writes, no Stripe mutations, no emails, no cron changes, no visibility flips). The two surgical fixes below run *before* the audit because they're targeted, low-risk, and you've already approved them.

## A. Fix "Member: Unknown" in Payments / Disputes / Refunds

**Root cause** — `listPayments`, `listDisputes`, `listRefunds` in `src/lib/admin/billing-console/list.functions.ts` only hydrate `email` / `fullName` from `payment_events.user_id`. Dispute and failed-charge webhook events frequently arrive with `user_id = null` because we never linked the event back through the customer. We still hold `stripe_customer_id` on the event — we just don't use it.

**Fix** (display-only, no behaviour change):
1. In each lister, collect `userIds` **and** `stripeCustomerIds` from the result set.
2. Add a fallback `subscriptions` lookup: `select user_id, stripe_customer_id where stripe_customer_id in (...) and environment = 'live'` to map customer → user.
3. Merge that into the existing profile / email hydration so any row with a known customer gets a real name + email.
4. Only render "Unknown" when neither `user_id` nor `stripe_customer_id` resolves.
5. When we resolve a user, render the member cell as a link to `/admin/members/$userId` (matches the rest of admin).

Files touched: `src/lib/admin/billing-console/list.functions.ts`, `src/routes/admin_.billing.tsx`. Typecheck after.

## B. Where MRR comes from (and why it's a P0 audit finding)

`getBillingKpis` in `src/lib/admin/billing-console/list.functions.ts` computes MRR as:

```
sum( monthlyPence(tier, period) )
  over subscriptions
  where environment = 'live'
    AND status IN ('active', 'trialing')
    AND tier != 'free'
```

`monthlyPence` is hardcoded: `verified = 9900/12 = £8.25`, `pro = £59`, `studio = £149`. It does **not** read Stripe price IDs and it **includes trialing**. So the £2,796.75 on your screenshot is mostly the 332 trialing members at £8.25/mo ≈ £2,739 plus the 7 active paying ≈ £58.

This is flagged P0 in the audit (Section C5): MRR must exclude trialing and source amounts from the canonical resolver / Stripe price, not a hardcoded table.

## C. One-off duplicate-subscription cleanup — jgumbley@hotmail.co.uk

You want to keep the £99 Core sub and cancel the older migration sub `sub_1TmXWIAP31Yc4cJj9jb8rduk`. That sub isn't in our local `subscriptions` mirror and the email doesn't match any REPs `auth.users` row, so this is a Stripe-only operation — Stripe is the source of truth.

**Action** (operator-confirmed Stripe write, one sub only):
1. `stripe.subscriptions.cancel("sub_1TmXWIAP31Yc4cJj9jb8rduk", { invoice_now: false, prorate: false })`.
2. Log the action to `admin_audit_log` with reason "duplicate of £99 Core sub — operator request".
3. If the Stripe customer for that sub *does* match a REPs user, re-sync the mirror so the cancellation is visible in `/admin/billing`.
4. Read-back: list all Stripe subs for that customer ID and confirm only the £99 one is active.

Surfaced as a one-shot script in `src/scripts/cancel-duplicate-sub.ts` (kept in repo, not run automatically). I'll run it once and paste the Stripe response back.

This is the **only** Stripe mutation in this entire plan. Everything else (Section D) is read-only.

## D. Phase 1 — read-only audit (no writes)

Report at `docs/admin-v2/stripe-only-admin-final-qa-2026-06-29.md` plus CSVs and Playwright screenshots. Sections:

1. **Stripe membership truth audit** — classify every user appearing in admin or directory into exactly one of: active paid · trialing/scheduled · canceling at period end · failed/recovery · awaiting setup · no subscription · lapsed · deleted/hidden · manual review. → `member-state-final-audit.csv`.
2. **Public visibility audit** — every visibility predicate in `directory.functions.ts`, `featured.functions.ts`, `professionals.public.ts`, `/pro/$slug` loader, sitemap, search, gym associations, review pages. Current vs target Stripe-only predicate. → `public-visibility-audit.csv`.
3. **Brilliant / BD / legacy sweep** — repo grep for `Brilliant`, `bd_`, `bd_member_seed`, `legacy_stripe_link`, `legacy-renewal`, `migrated_from_bd`, `future_due`, `verified_annual`, `awaiting_payment_method`, `plan: free`, `tier: free`, `Free trial`. Each hit classified (remove now / archive / migration-doc / internal-key / allowed Stripe metadata / unsafe / user-facing violation). → `brilliant-reference-sweep.csv`.
4. **Admin page audit** — for each admin route (~22): purpose, data sources, Stripe-only?, BD/legacy?, duplicate metrics?, keep/merge/archive/hide/delete, operator trust, screenshot path, required fixes. → `admin-page-audit.csv` + screenshots in `/tmp/browser/admin-qa/`.
5. **KPI & metric source audit** — one owner + one definition per KPI (Active Members · Active Paying · Core/Pro/Studio · Scheduled Renewals · Awaiting Card · Failed · Recovery · Churned · Pending Cancel · Revenue Received · Projected Cash · Net Growth · Open Disputes · Public Visible · Hidden · Deleted). Any KPI that unions `subscriptions` with `bd_member_seed` or `legacy_stripe_link` = blocker. The MRR-includes-trialing finding from Section B lands here as P0. → `kpi-source-audit.csv`.
6. **Subscription resolver enforcement** — every direct `.from("subscriptions")` outside `member-billing-row.server.ts` / `subscription-resolver.server.ts` / `active-paying-member.server.ts` classified (allowed cache / should-use-resolver / should-use-bulk / should-be-removed).
7. **Free-tier elimination audit** — rows with `subscriptions.tier='free'` and `professionals.plan='free'`. Each row classified. → `free-tier-audit.csv`.
8. **Cancellation / deletion policy audit** — current behaviour for canceling, canceled+period_end-passed, and explicit deletion. Gap list vs the target rules.
9. **Brilliant directory migration confirmation** — per-row table: total imported · converted · trialing/scheduled · active paid · awaiting setup · hidden · manual review · deleted · unclassified (must be 0).
10. **Disputes / payment integrity audit** — dispute webhook → `disputes` table, no duplicate truth, refunds don't leave canceled members "active", `payment_events` is ledger-only.
11. **Route & cron cleanup audit** — every cron + admin route (legacy-renewal, lifecycle, setup-card reminders, billing-setup-token, webhook replay, migration routes) → keep/temporary/archive/disable/delete. → `route-cron-cleanup-audit.csv`.

**Screenshots** (Playwright, headless, viewport 1280×1800, all to `/tmp/browser/admin-qa/`):
- every main admin page
- one active Core member · one scheduled-renewal member · one canceling member (if exists) · one hidden/no-sub profile
- Richard Bennett Member 360
- public directory before/after visibility checks (read-only)

## E. End of Phase 1 — patch plan, not patches

The audit report closes with a prioritised P0/P1/P2/P3 patch plan exactly as you specified. **No code edits, no migrations, no Stripe calls in Phase 1 beyond Sections A and C above.** You review, green-light, and Phase 2 opens as a separate plan.

## What's deliberately out of scope this turn

- Hiding profiles, soft-deleting members, archiving routes.
- Removing Brilliant/BD code (only documenting it).
- Changing MRR / KPI formulas (only flagging them).
- Any other Stripe mutation beyond the single duplicate-sub cancel in Section C.

## Technical notes

- `sub_1TmXWIAP31Yc4cJj9jb8rduk` is not in our local mirror — confirmed `auth.users` has no `jgumbley@hotmail.co.uk` row and the sub ID isn't in `public.subscriptions`. Cancellation goes direct to Stripe by sub ID.
- All CSVs + the markdown report go under `docs/admin-v2/` (versioned with the codebase, matching prior audits) — not `/mnt/documents`.
- Audit runs read-only via existing server fns + `supabase--read_query` + Playwright; no new RPCs.
