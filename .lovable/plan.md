## Goal

Two parallel tracks, one build:

1. **Pro side** — Pro+Studio professionals connect their own Stripe account in Settings. Clients book + pay on REPs via Stripe Checkout. Money lands in the pro's Stripe. REPs takes £0.
2. **Admin side** — World-class `/admin/payments` page. REPs subscription revenue (MRR, churn, retention) and marketplace activity (Connect volume, payouts, disputes) treated as two distinct lenses, not merged.

## Architecture (the "why")

- **Connect goes in Settings, not its own dashboard tab.** It's a one-time setup, not a daily workflow. Settings → Payments is the world-class pattern (Calendly, Notion, Linear all do this).
- **Pro's main dashboard gets a one-line status strip** ("Stripe: Active · Next payout £X on Tue") so they see it without digging.
- **Admin page has two top-level tabs**: **Subscriptions** (REPs revenue) and **Marketplace** (Connect activity). Never blended. Each tab has its own KPIs, its own time controls, its own drill-downs.
- **Per-pro drilldown** (`/admin/payments/pros/$id`) is built in Phase A — that's where 80% of admin time will be spent.

## Phase A — what ships

### 1. Schema (one migration)
- `connected_accounts` (1:1 with `professionals`): `professional_id` PK/FK, `stripe_account_id`, `charges_enabled`, `payouts_enabled`, `details_submitted`, `requirements_due jsonb`, `country`, `default_currency`, `connected_at`, `disconnected_at`, `last_synced_at`, `updated_at`. RLS: pro reads own, admin reads all, service_role writes.
- `bookings`: `id`, `professional_id`, `service_id`, `client_email`, `client_name`, `client_user_id` nullable, `amount_pence`, `currency`, `stripe_checkout_session_id`, `stripe_payment_intent_id`, `stripe_charge_id`, `status` enum (`pending|paid|refunded|partially_refunded|failed|canceled|disputed`), `paid_at`, `refunded_at`, `refunded_amount_pence`, `dispute_status`, `metadata jsonb`. RLS: pro reads own, client reads own (SECURITY DEFINER fn matching `auth.uid()` or email), admin reads all.
- Materialised view `mrr_movement_daily` (date, new_mrr, expansion_mrr, contraction_mrr, churned_mrr, reactivation_mrr, net_mrr) — refreshed nightly from `subscriptions` + `payment_events`. Powers the MRR chart without recomputing on every page load.
- GRANTs in same migration. `tg_set_updated_at` triggers.

### 2. Pro side

**Settings → Payments** (new section, not new route):
- States: not_connected / onboarding_incomplete / restricted / active / disconnected.
- `active` shows: Stripe account email, charges enabled ✓, payouts enabled ✓, default currency, "Open Stripe dashboard" link, "Disconnect" button (admin-confirmed action — see risks).
- `restricted` shows requirements list from Stripe (e.g. "Verify your bank account") with "Continue setup" button → fresh Account Link.
- Server fns in `src/lib/payments/connect.functions.ts`: `startStripeConnect`, `getConnectStatus`, `refreshConnectStatus` (called on Settings load + on return-from-Stripe), `requestDisconnect`.

**Main pro dashboard** (`dashboard_.index.tsx`):
- New compact "Payments" strip at the top of the page: status pill + "Next payout £X on Tue" if active. Click → Settings → Payments. No new nav item.

**`/c/$slug` Book CTA**:
- If pro has `charges_enabled === true` → Stripe Checkout via `createBookingCheckoutSession` (server fn) → Checkout Session on connected account, `application_fee_amount: 0`, success/cancel back to `/c/$slug?booking=…`.
- Else → existing enquire flow (no copy change visible to client).

### 3. Webhook (extend `src/routes/api/public/payments/webhook.ts`)
- Detect Connect events via `Stripe-Account` header. Verify against new `STRIPE_CONNECT_WEBHOOK_SECRET`.
- Handle: `account.updated`, `checkout.session.completed`, `payment_intent.succeeded`, `charge.refunded`, `charge.dispute.created`, `charge.dispute.closed`, `payout.paid`, `payout.failed`.
- Idempotent via existing `payment_events.event_id` unique index. Every event stored verbatim — that's the audit trail.

### 4. Admin /admin/payments — restructured

Two top tabs, no blending:

**Tab 1 — Subscriptions (REPs revenue)**
- **MRR movement chart** (T12M) with stacked bars: New / Expansion / Contraction / Churn / Reactivation → Net. Default range 12 months, selectable.
- KPI row: **MRR, ARR, Active subs, Net new this month, Gross churn %, Net revenue retention %, Trial → paid %**. Each tile click-through to underlying list.
- **Failed payments queue** (the highest-ROI tile): list of `past_due` + `unpaid` subscriptions with one-click "Send update-card email" and Stripe Customer Portal link. This is where £ is recovered.
- **Upcoming renewals** (next 30 days, by tier).
- **Recent subscription events** table (signup / upgrade / downgrade / cancel / reactivation) — read from `payment_events`.
- **Top customers by LTV** — small list, link to Stripe customer.
- **Cohort retention grid** — monthly cohorts × months retained. Tells the truth about whether Verified pros actually stay.

**Tab 2 — Marketplace (Connect activity — NOT REPs revenue)**
- Honest framing copy at the top: "REPs takes £0 from these payments. This view aggregates client-to-pro activity across all connected accounts."
- KPI row: **Connected accounts (active / pending / restricted), Gross volume (30d), Refund rate, Dispute rate, Bookings (30d)**.
- **Volume chart** (30/90/365d) of gross processed across all pros.
- **Pros leaderboard** — top 10 by 30d volume, with status pills + drill-through link.
- **Recent bookings** table — joined to pro + service, filterable by status (paid/refunded/disputed/failed).
- **Disputes queue** — anything open, link to Stripe.
- "Connected accounts" table with status filter, click → per-pro drilldown.

**Per-pro drilldown `/admin/payments/pros/$id`** (built in Phase A — this is where you'll actually live):
- Stripe account status card (charges/payouts/requirements).
- Lifetime gross, refund rate, dispute rate.
- Bookings table (all-time, paginated).
- Payouts list (lazy-fetched from Stripe Balance API).
- "Open in Stripe" deep-link.

**Event audit log** (`/admin/payments/events`) — every webhook stored, filterable by type/account/date. Non-negotiable for debugging.

### 5. Secrets
- `STRIPE_CONNECT_WEBHOOK_SECRET` (separate signing secret from the subs webhook).
- No `STRIPE_CONNECT_CLIENT_ID` needed — Standard accounts with Account Links don't require it.

### 6. Tier gating
- `startStripeConnect`, `createBookingCheckoutSession`: `has_active_tier(uid, ARRAY['pro','studio'])`. Verified pros see "Upgrade to Pro to take payments" card in Settings instead of the connect button.

### 7. Marketing copy guardrail
- `/features/shop-front`, `/features/operations`, `/pricing`, `/c/$slug`: "money lands directly in your Stripe account — REPs takes £0." Never "we handle/process payments."
- Memory rule added: `mem://feature/stripe-connect-payments`.

## Out of scope for Phase A (named so we don't drift)

**Phase B:** Pros selling subscriptions/packages on REPs; coupons; in-product refund button (refund in Stripe dashboard for now); calendar integration; multi-currency display normalisation in admin.

**Phase C:** Per-pro fee toggle (if REPs ever takes commission); 1099/tax summaries; SCA/3DS edge cases beyond Checkout defaults; embedded Stripe Connect components.

## Risks + mitigations

- **Pro abandons onboarding mid-flow** → Settings clearly surfaces `onboarding_incomplete` with one-click resume. Book CTA falls back to enquire when `charges_enabled !== true`.
- **MRR materialised view drifts** → nightly `REFRESH MATERIALIZED VIEW CONCURRENTLY` + a manual "Recalculate MRR" admin button.
- **Pro self-disconnects with active bookings** → `requestDisconnect` flags for admin review rather than instant disconnect; admin confirms in /admin/payments. Avoids orphaned in-flight Checkouts.
- **Refund happens in Stripe dashboard, not REPs** → `charge.refunded` webhook keeps `bookings.status` in sync. Admin view never lies.
- **Dishonest mockup tiles** ("Release payouts" CTA) → deleted, not preserved. The mock was wrong; the page becomes honest.

## Technical details

- Reuse existing `stripe` SDK in `src/lib/billing/stripe.server.ts`. Connect calls pass `{ stripeAccount: id }`.
- Server fns gated by `requireSupabaseAuth` + tier check; `createBookingCheckoutSession` intentionally public but validates `serviceId` belongs to a published Pro+Studio pro with `charges_enabled`.
- Webhook: two `constructEvent` calls — existing subs secret, new Connect secret — branched by presence of `Stripe-Account` header.
- Admin reads MRR from materialised view, marketplace KPIs from `bookings` aggregations + Stripe Balance API (lazy, server-fn cached 60s).
- All schema changes via migration tool in one call.

## Build order

1. Migration (tables + view + grants + RLS).
2. Connect server fns + Settings → Payments UI.
3. Webhook extension + event handlers.
4. Booking checkout server fn + `/c/$slug` CTA swap.
5. Admin Subscriptions tab (MRR chart + KPIs + failed-payments queue).
6. Admin Marketplace tab + pros leaderboard.
7. Per-pro drilldown.
8. Event audit log viewer.
9. Pro dashboard status strip.
10. Marketing copy guardrail + memory write.

## What I will NOT touch

- Existing Verified/Pro tier sign-up checkout (`startCheckout.ts`, existing subs webhook handler).
- Locked `/c/$slug` visual design — only the Book CTA target changes.
- Locked admin sidebar/nav layout — `/admin/payments` is restructured internally, sidebar entry stays.
- Any marketing page outside the small copy guardrail.