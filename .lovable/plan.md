# Stripe Subscriptions + BD Migration + Connect Plan

Same Stripe account as BD. REPs uses **real Stripe Subscriptions** for membership billing. BD members migrate against the cards already vaulted in Stripe — no card re-entry. **Stripe Connect** lets trainers take client payments through REPs.

Two billing systems, kept cleanly separate:
- **Platform billing** — REPs charges trainers for membership (Subscriptions)
- **Connect billing** — trainers charge their clients through REPs (Connect)

---

## Phase 0 — Locked decisions

1. **Legal entity** — Same as BD (**REPs**). Existing card mandate carries over; no re-consent needed.
2. **Statement descriptor** — `REPS MEMBERSHIP`.
3. **Migration pricing** — Existing BD members move to **REPs standard pricing at next renewal**.
4. **Cutover** — Hard cutover on a single date. BD billing cron disabled the same day REPs takes over.
5. **Tier vs Status split** — These are TWO independent attributes per member. Never conflated.
   - **Tier** (what they pay): Free / Pro / Verified / Studio — lives on `subscriptions` table.
   - **Verification status** (badge / trust signal): `pending` / `verified` / `unverified` / `expired` — lives on `professionals` table.
   - Losing verification **never** auto-downgrades the billing tier. They keep paying Verified, keep all Verified features, just lose the public badge until they re-verify.
6. **Pending window for new Verified signups** — **30 days**. After 30 days without approved cert + insurance, status flips `pending` → `unverified` (still on Verified tier, still paying, badge stripped).
7. **BD migration verification grace** — All migrated members imported as **tier = Verified**, **status = `verified`**, **grace_until = now() + 12 months**. After 12 months without valid cert + insurance, status flips `verified` → `unverified`.

### Status × Tier outcome matrix

| Scenario | Tier | Status | UX |
|---|---|---|---|
| BD member, day 1 of migration | Verified | `verified` (grace) | Full badge, dashboard banner: "Upload certificate + insurance within 12 months to keep your Verified badge" |
| BD member, 12 mo later, no docs | Verified | `unverified` | Still paying Verified, badge stripped, banner: "Restore your Verified badge — upload docs now" |
| New signup picks Verified | Verified | `pending` (30d) | Full features, "Verification pending" badge state, banner: "Upload docs within 30 days" |
| New signup, 30 days, no docs | Verified | `unverified` | Still paying, no badge, banner pressuring upload |
| Verified member, insurance expired | Verified | `expired` | Badge shows "Expired", banner: "Renew insurance to restore verification" |
| Member explicitly cancels | Free (at period end) | `unverified` | Downgraded to Free tier only on explicit cancel |

---

## Phase 1 — Platform billing foundation

Goal: brand-new trainer can sign up, pay membership, manage subscription end-to-end. Zero BD involvement.

1. **Enable Stripe** via Lovable's built-in integration, pointed at existing BD Stripe account.
2. **Create Products + Prices** for 4 paid tiers, monthly + annual. Founding Prices as separate Price objects with `metadata.tier=founding`.
3. **Database tables** (Supabase):
   - `subscriptions` — `user_id`, `stripe_customer_id`, `stripe_subscription_id`, `tier`, `billing_period`, `status` (Stripe sub status), `current_period_end`, `cancel_at_period_end`
   - `payment_events` — raw webhook audit log
   - Add to `professionals`: `verification_status` enum (`pending` / `verified` / `unverified` / `expired`), `verification_grace_until` timestamp, `cert_uploaded_at`, `insurance_valid_until` (already exists)
   - RLS: users see own rows; service role full access; admins see all
4. **Checkout** (`createServerFn`): `createCheckoutSession({ priceId })` → Stripe Checkout URL; creates/reuses `stripe_customer_id`.
5. **Customer Portal** (`createServerFn`): `createPortalSession()` → Stripe-hosted card/plan/cancel/invoices.
6. **Webhook** at `/api/public/stripe/webhook` (signature-verified): handles `checkout.session.completed`, `customer.subscription.*`, `invoice.payment_succeeded`, `invoice.payment_failed`.
7. **Verification state machine**:
   - New Verified-tier signup → `verification_status = 'pending'`, `verification_grace_until = now() + 30 days`
   - Admin approves docs → `verified`
   - Daily cron flips `pending` → `unverified` when grace expires AND no approved docs
   - Daily cron flips `verified` → `expired` when `insurance_valid_until < now()`
   - Member uploads/renews + admin re-approves → `verified` (resets grace)
8. **Wire `/pricing`**: tier buttons call `createCheckoutSession` with correct Price ID based on monthly/annual toggle.
9. **Dashboard widgets**:
   - Billing card: current plan, next billing date, "Manage billing" → Customer Portal
   - Verification banner: reads `verification_status`, shows different copy/CTA per state
10. **Public profile**: `/pro/$slug` renders badge based on `verification_status` (not tier). `unverified` / `expired` profiles still display but without the Verified mark.
11. **Test-mode QA**: signup → pay → upgrade → downgrade → cancel → reactivate, plus full verification flow (pending → verified → expired → re-verified).

---

## Phase 2 — BD member migration

Only after Phase 1 is live + stable.

1. **Export from BD** — CSV: email, BD plan, BD price, BD renewal date, `cus_xxx`, default `pm_xxx`, existing cert/insurance status if available.
2. **Plan mapping** — every BD plan → REPs Verified tier standard Price (monthly or annual based on BD cadence). Reviewed manually.
3. **Staging table** `bd_migration` with `status` (`pending` / `account_created` / `subscription_created` / `failed` / `skipped`).
4. **Pre-flight Stripe check** — dry run: confirm every `cus_xxx` exists with valid `pm_xxx`. Flag missing cards.
5. **Create REPs auth accounts** — Supabase user per BD email, link `stripe_customer_id`, generate "set your password" magic link.
6. **Create Stripe Subscriptions** per member:
   - `customer = cus_xxx`, `default_payment_method = pm_xxx`
   - `items = [{ price: <REPs Verified standard Price> }]`
   - `billing_cycle_anchor = existing BD renewal date` (no gap, no double-charge)
   - `proration_behavior = 'none'`
   - `metadata = { migrated_from: 'bd', bd_plan, bd_price }`
   - Idempotency key from `bd_member_id`
7. **Set verification fields** on `professionals`: `verification_status = 'verified'`, `verification_grace_until = now() + 12 months`.
8. **Announcement email**: "Your REPs account is ready. Your Verified status is honoured for 12 months — upload cert + insurance before [date] to keep your badge. Next renewal [date] at [REPs standard price]. Set your password / manage / cancel here."
9. **Disable BD billing cron** on cutover day. Getting this wrong = double-billing.
10. **Reconciliation** — daily for 2 weeks: BD count vs Stripe Sub count vs REPs DB count.
11. **Grace-expiry reminder cron** — at 60 days, 30 days, 7 days before `verification_grace_until`: email member to upload docs.

---

## Phase 3 — Stripe Connect (trainers → clients)

Completely separate from platform billing — different Stripe objects, different webhooks, different DB tables.

1. **Connect account type** — **Express** accounts. Stripe-hosted onboarding (KYC, bank, tax).
2. **Database**:
   - `connect_accounts` — `professional_id`, `stripe_account_id`, `charges_enabled`, `payouts_enabled`, `onboarding_completed_at`
   - `connect_products` — trainer offerings (one-off + recurring)
   - `client_payments` — every charge: `professional_id`, `client_email`, `payment_intent_id`, `amount`, `application_fee`, `status`
   - `client_subscriptions` — recurring coaching: mirrors Stripe Subscription on connected account
3. **Onboarding** in `/dashboard/business`: "Set up payments" → `createConnectAccountLink()` → Stripe-hosted URL.
4. **Offering management** — `/dashboard/services`: create Product + Price on connected account.
5. **Client checkout** — `/pro/$slug` "Book" / "Subscribe": `createConnectCheckoutSession({ professionalId, priceId })` using `application_fee_amount` (one-off) or `application_fee_percent` (recurring), with `stripeAccount` header → destination charge.
6. **Platform fee** — **OPEN, see questions below**.
7. **Connect webhook** at `/api/public/stripe/connect-webhook` (separate endpoint + signing secret).
8. **Payouts** — Stripe auto (daily/weekly to trainer bank).
9. **Trainer payments dashboard** — `/dashboard/payments` (already mocked) wired to real Connect data.

---

## Phase 4 — Admin + safety nets

1. **Admin payments** `/admin/payments` (already mocked) — wire to real data: search by email, refund, comp, customer link.
2. **Admin verification queue** `/admin/verification` (already exists) — review uploaded docs, approve/reject (flips `verification_status`).
3. **Admin Connect view** — connected accounts list, onboarding status, lifetime volume, platform fee earned.
4. **Failed payment handling** — Stripe Smart Retries + dunning emails + in-app banner.
5. **Tax** — confirm Stripe Tax for UK VAT. Connect tax model TBD (Phase 3 open question).
6. **Runbook** — refunds, comps, missed BD members, chargebacks, Connect disputes, verification re-approvals.

---

## Out of scope

- Migrating BD content (profiles, reviews, photos) — separate data migration
- Replacing BD before Phase 1 proven — BD keeps running until cutover
- Escrow / hold-and-release on Connect — direct destination charges only

---

## Technical details

- **One Stripe account, two integrations**: platform billing = standard API. Connect = same key with `Stripe-Account` header.
- **Webhook separation**: platform events vs Connect events go to separate endpoints with separate signing secrets.
- **Connect charge type**: destination charges with application fee. Trainer is merchant of record for their services.
- **Idempotency**: every Phase 2 Stripe call keyed by `bd_member_id`.
- **No client secrets**: only `VITE_STRIPE_PUBLISHABLE_KEY` ships to browser; all writes in `createServerFn` / server routes.
- **Founding pricing**: locked to existing founders via Price IDs. Migrated BD members get **standard** Prices.
- **Verification status crons**: daily `pg_cron` hitting `/api/public/hooks/verification-sweep` to flip `pending → unverified` (after 30d), `verified → expired` (when insurance lapses), `verified → unverified` (after 12-month BD grace).

---

## Open questions before Phase 3 starts

1. **Platform fee model** — flat %, tiered by membership tier, or zero?
2. **Connect tax handling** — REPs handles via Stripe Tax on connected accounts, or trainers handle own VAT?
3. **Trainer payout schedule** — Stripe default or override?

These don't block Phase 1 or Phase 2.

---

## Recommended sequencing

1. **Now** — approve this plan
2. **Next** — Phase 1 (Stripe enable + Products + Checkout + Portal + webhook + verification state machine + pricing wiring). ~1 build session.
3. **Then** — Phase 2 (BD migration). Needs BD export CSV from you. ~1 session for script + dry run, then cutover.
4. **Then** — Phase 3 (Connect). Answer the 3 open questions first. ~2 sessions.
5. **Then** — Phase 4 (admin polish). Ongoing.
