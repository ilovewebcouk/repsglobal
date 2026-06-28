# BD Migration → Stripe Subscriptions (Full Rail Swap)

End state: BD migration **disappears as a concept**. Every paying member is a real Stripe Subscription. One billing rail, one KPI query, no more `is_legacy` branches.

## What "clean" looks like after all 4 phases ship

| Cohort | Count | Treatment | End state |
|---|---:|---|---|
| Auto-convertible | 331 | Phase 2 auto-convert | Real Stripe Sub, trial-anchored to BD date, auto-renew £99/yr |
| Grace (0–30d lapsed, card on file) | small | Phase 2 auto-convert with `trial_end = now+7d` | Real Stripe Sub |
| No card on file | 27 | Phase 3 magic-link (setup) | Subscribed OR honest Unverified lapse |
| Lapsed >30d | 9 | Phase 3 magic-link (reactivate) | Subscribed OR stays Unverified |
| `renewed_to_verified` / `awaiting_payment_method` | 7 | Excluded (already on new rail) | Untouched |

## Phase 2 — Execute auto-convert (already wired, not yet run)

1. **Live batch of 10** from `/admin/ops/billing` → BdRailSwapCard → spot-check in Stripe Dashboard, verify confirmation email lands, verify `legacy_stripe_link.migration_status = 'converted_to_subscription'`.
2. **Resumable batches of 50** until all 331 auto rows + grace rows are converted.
3. **24h soak.** Monitor `/admin/ops/billing` failed-payment tile, dispute hook, support inbox.

Idempotency: `stripe_subscription_id IS NULL` filter + Stripe `idempotency_key = bd-convert-<id>`. Re-runnable safely.

## Phase 3 — Magic-link cohorts (27 no-card + 9 lapsed)

New files:
```
src/lib/billing/setup-tokens.server.ts            (create/consume tokens)
src/routes/api/public/billing/setup-card.$token.tsx
src/routes/api/public/billing/reactivate.$token.tsx
src/lib/email-templates/legacy-setup-card-now.tsx
src/lib/email-templates/legacy-setup-card-reminder-30.tsx
src/lib/email-templates/legacy-setup-card-reminder-7.tsx
src/lib/email-templates/legacy-reactivate-invite.tsx
src/routes/api/public/hooks/setup-link-reminders.ts  (daily 09:00 London cron)
```

Flow:
- **Setup cohort**: token → Stripe Checkout `mode=setup` → on completion create Subscription with `trial_end = next_due_at`.
- **Reactivate cohort**: token → Stripe Checkout `mode=subscription` at £99/yr starting immediately.
- **Reminders**: T-30 and T-7 days before BD renewal date.
- **Lapse policy**: if not clicked by renewal date → `verification = 'unverified'`. Profile stays live (Trustpilot policy). No further emails after that point — final state is honest "unverified" not silent suspension.

Admin UI: extend BdRailSwapCard with "Send invites" batch buttons + funnel tile (invited → card added → converted).

## Phase 4 — Tear down legacy rail (gated on 7 days green telemetry)

After Phase 2 + Phase 3 sit green for 7 days:

- `SELECT cron.unschedule('legacy-stripe-renewal-daily')`
- `/api/public/hooks/legacy-renewal` returns 410 Gone (delete file one release later)
- Delete `is_legacy` / `legacy_kind` branches from:
  - `src/lib/members/active-paying-member.ts`
  - KPI queries in `/admin` and `/admin/professionals`
  - dispute webhook
  - churn lifecycle
  - payment recovery
- Delete Site Time panel's "next legacy renewal run" tile
- Mark `legacy_stripe_link` read-only (revoke INSERT/UPDATE grants except service_role for historical reads)
- Mark `docs/admin-v2/12-implementation-roadmap-and-migration-plan.md` BD section **CLOSED**

## Phase 5 — Comms (runs alongside Phase 2)

One transactional email per conversion via `sendTransactionalEmailServer` (Mailgun, loop-guarded):
- Subject: *"Your REPs Core membership — next renewal £99 on [date]"*
- Body: what changed (back-end upgrade, no fee change), confirmed renewal date + amount, cancel-anytime link, support contact.
- Legal basis: existing BD T&Cs MIT mandate. No re-consent needed for cohorts with card on file.
- Stripe's own 7-days-before pre-renewal email layers on automatically.

Magic-link cohorts get the setup/reactivate templates instead — different subject, different CTA, no implied charge until they confirm.

## Phase 6 — Admin observability (built in Phase 2, extended in Phase 3)

`/admin/ops/billing` → BdRailSwapCard:
- Population tiles: `auto-convertible / setup-link-required / reactivation / converted / lapsed`
- Dry-run + live batch buttons (already shipped Phase 2)
- Invite batch buttons (Phase 3)
- Funnel tile: invited → card added → converted
- Recent failures table
- Each row deep-links to `/admin/professionals?q=<email>` and the Stripe Customer

## Brutal honest residual risks

1. **Involuntary churn tail (~5–10 members)** — dormant 2024 cards fail SCA on first real charge. Stripe Smart Retries + card-update email handle most. Rest lapse to Unverified (same outcome as today's cron, better UX).
2. **Magic-link conversion ~60–80%** — the rest lapse to Unverified. Correct outcome for someone with no card on file.
3. **Phase 4 is gated on Phase 2 telemetry.** If Phase 2 throws errors, we pause and fix before tearing legacy down. Non-negotiable.

## Execution order

1. **Today**: Phase 2 live batch of 10 → soak 1 hour → spot-check.
2. **Today**: Phase 2 remaining batches of 50 until all 331+grace converted.
3. **+24h**: green-light Phase 3 build (magic links + reminders + cron).
4. **+72h**: send first batch of magic-link invites.
5. **+7 days from Phase 2 completion**: Phase 4 teardown.
6. **+14 days**: delete `/api/public/hooks/legacy-renewal` file entirely.

## Technical reference (for the build agent)

- Stripe call shape, schema, idempotency keys, file list: already documented in `.lovable/plan.md` (unchanged).
- Dry-run CSV (`bd-rail-swap-dryrun-2026-06-28.csv`) approved — cohort classification matches expected population.
- Excluded rows hardened: `renewed_to_verified`, `awaiting_payment_method`, and any row with `stripe_subscription_id IS NOT NULL`.

## Answer to your question

**Yes — this makes everything clean.** After Phase 4, BD migration is gone. Everyone on Core is on a real Stripe Subscription auto-renewing at £99/yr. The dual-rail mess is dead. KPIs become one query. Disputes, churn, payment recovery stop branching. The 27+9 magic-link cohort either subscribes or honestly lapses to Unverified — both clean states.

The only way this fails to clean everything up is if you stop after Phase 2. **Commit to all 4 phases** or the mess survives.
