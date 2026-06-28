Admin display/aggregation fix for `/admin/memberships`. No business-logic, webhook, renewal, churn, reconciliation or payment-recovery changes. No migrations, no new server functions.

## A — "Renewals due next 14 days" uses the same renewal universe as the forecast

In `src/lib/admin/memberships.functions.ts → getMembershipMetrics`, extend the upcoming-payments projection so it mirrors the forecast source set (used by `getRevenueForecast`):

1. **Live Stripe** — kept as-is (`current_period_end ∈ [now, now+14d]`, paid tier, LIVE_STATUSES).
2. **`bd_member_seed` cohort** — kept, using the same `nextCohortDue()` annual roll-forward already in the function.
3. **`legacy_stripe_link`** — NEW source. Read `bd_member_id, claimed_user_id, email, bd_next_due_date, is_lifetime`. Skip lifetime. For each non-lifetime row, project the next annual due using the same Europe/London-anchored roll-forward as cohort rows. Include if it lands in `[now, now+14d]`.

Reuse the existing `nextCohortDue()` shape — do not introduce a second projection algorithm. Factor the per-row "roll annually until ≥ now" into a small local helper (`projectNextAnnual(anchor, baseAmount)`) shared by cohort rows and the new legacy rows. Forecast logic is untouched; the metric simply becomes a 14-day slice of the same universe.

## B — Identity-ladder dedupe (no double-counting)

Replace the current `seenUserIds: Set<string>` with a ladder-based dedupe key built per row in this precedence:

```text
stripe_subscription_id  →  user_id  →  claimed_user_id  →  email (lowercased)  →  bd_member_id
```

Source precedence when the same identity surfaces in more than one source:

```text
1. Live Stripe subscription   (wins)
2. Legacy Stripe link
3. BD seed / cohort           (loses)
```

A `Map<dedupeKey, sourceRank>` enforces this — only insert/keep the higher-precedence source. Same ladder is applied to the past-due list so it does not collide with the upcoming list.

## C — Date handling

- `now = new Date()`, `in14d = daysFromNow(14, now)` — already consistent with forecast.
- Date-only fields (`bd_next_due_date`) are parsed via the same path as the forecast (`new Date(string)`), then the existing "roll annually until on/after `now`" loop runs. The window test stays `due >= now && due <= in14d`.
- No new tz library; we explicitly do not change how the renewal job interprets dates.

## D — Card copy in `src/routes/admin_.memberships.tsx`

- Title: **Renewals due next 14 days** (replaces "Payments in next 14 days").
- Subtitle (always, no launch-cohort branch): **Stripe renewals · legacy renewals · BD cohort**.
- Empty state: **Renewals and scheduled charges in the next 14 days will list here.**
- Remove the `launchDate`-based subtitle conditional entirely.

## E — Failed payments / Raheela verification

Audit, not a logic change:

1. From the server fn perspective, confirm `getMembershipMetrics()` returns `pastDueCount = 1` when Raheela's row is `incomplete_expired` (the status set is already correct in `FAILED_PAYMENT_STATUSES`). Use a read-only DB query to confirm her sub exists with that status and that her profile row exists (orphan filter would otherwise hide her).
2. Add an opt-in server log gated on `process.env.DEBUG_MEMBERSHIPS === "1"` only — prints `pastDue.length`, the dedupe-key sample, and orphan count. Off by default. No noisy logs in production.
3. On the route, ensure the Failed Payments card re-fetches on mount (the query already runs via TanStack; we'll add `staleTime: 0` only on this single key if needed). No churn / recovery logic touched.

## F — Free tier display

In `src/routes/admin_.memberships.tsx` past-due list:

- `tierLabel`: `free → "Free"` (display fallback). Already partially in place — re-confirm and keep.
- Disambiguate amount column:
  - The card shows the **plan amount** (current behaviour) → relabel the column header / row sub-text as **Plan amount**. £0 for Free is correct under that label.
  - If a `payment_events` row of type `invoice.payment_failed` exists for that user, surface the attempted amount as a secondary line: **Last failed attempt: £NN.NN**. Read-only — no writes, no new server fn. Done inline via a small additive `select` in `getMembershipMetrics` (latest `invoice.payment_failed` per past-due user_id) returned on the `PastDueItem`.
  - If no failed-attempt amount is found, omit the second line — do not invent £0.

## Acceptance check (manual after build)

1. `/admin/memberships` → "Renewals due next 14 days" lists non-zero rows when any Stripe / legacy_stripe_link / BD cohort due-date lands in the window.
2. The card total equals the 14-day slice of the forecast universe (cross-check with forecast's `next14dPence`).
3. No member appears twice across the three sources.
4. Raheela appears in Failed Payments on a fresh load, status `incomplete expired`, tier label `Free`.
5. Amount column clearly labelled "Plan amount"; her last failed attempt shown if a `payment_events` row exists.
6. No "launch cohort" subtitle remains anywhere on the 14-day card.
7. `git grep` shows no changes to billing, webhook, renewal, churn, reconciliation, or payment-recovery files.

## Files touched

- `src/lib/admin/memberships.functions.ts` — extend `getMembershipMetrics` only (legacy_stripe_link source, ladder dedupe, optional debug log, latest-failed-attempt amount on `PastDueItem`). `getRevenueForecast` unchanged.
- `src/routes/admin_.memberships.tsx` — card title / subtitle / empty-state copy, "Plan amount" column label, optional last-failed-attempt line, tier fallback.

No new files. No migrations. No new server functions.
