## Admin v2 — Subscription Data Contract Standardisation (revised)

One canonical resolver behind every admin surface. Subscription-first entitlement (no BD/legacy union). Stripe-preferred field mapping with local fallback. Discrepancies surfaced explicitly. No BD/legacy/migrated/trial language in active billing UI.

---

### 1. New canonical module — `src/lib/admin/subscription-resolver.server.ts`

Server-only. Exports:

- `type AdminSubscriptionState` exactly as specified (`hasSubscription`, `source`, `confidence`, `subscription`, `stripe`, `local`, `discrepancies`).
- `resolveAdminSubscriptionForUser({ userId, environment = "live", preferLiveStripe = true })`.
- `resolveAdminSubscriptionsForUsers({ userIds, environment = "live", preferLiveStripe = false })` — single SQL query, no per-row Stripe calls.
- `classifySubscriptionStatus(status, cancel_at_period_end, current_period_end)`.
- `mapStripePriceToTier(price)` — Stripe-first tier resolution against the known REPs price IDs / lookup keys / product metadata in `src/lib/billing.ts`.
- `formatTierLabel(tierKey)` — `verified|core → "Core"`, `pro → "Pro"`, `studio → "Studio"`, `free → "Free"`.
- `formatStatusLabel(state)` — `Active`, `Scheduled Core renewal`, `Existing paid period`, `Canceling`, `Failed payment`, `Lapsed`. Never `Trial user` / `Free trial` / `Trial ends`.

**Resolution order:**

1. Always read the latest live local `subscriptions` row for the user.
2. If `stripe_subscription_id` or `stripe_customer_id` is present and `preferLiveStripe`, call the Stripe mirror in a try/catch (errors recorded, never thrown).
3. Merge:
   - Stripe success → use Stripe for money/period/status fields **and** for tier via `mapStripePriceToTier(stripe.price)`. Only fall back to `local.tier` if the price → tier mapping returns null. `source: "stripe-live"`, `confidence: "high"`.
   - Stripe fail + local row → synthesise from local. For `status === "trialing"`, set `trial_end = current_period_end` (Core scheduled-renewal anchor). `source: "local-mirror"`, `confidence: "medium"`.
   - Stripe success + no local row → `source: "stripe-live"`, `confidence: "medium"`.
   - Both missing → `source: "none"`, `hasSubscription: false`.
4. Diff Stripe vs local on `status`, `price_id`, `current_period_end`, `cancel_at_period_end`, presence; populate `discrepancies[]`. Any `critical` → `source: "discrepancy"`, `confidence: "low"`.

### 2. **Subscription-first active entitlement** — `active-paying-member.server.ts` (in-scope, not deferred)

This is the change that makes the contract real, not cosmetic.

- Rewrite `fetchActivePayingMemberCollection` to derive active members from `subscriptions` only, via `classifySubscriptionStatus`. Active = `is_active_entitlement === true` (covers `active`, `trialing`, `past_due` per spec, `cancel_at_period_end` still active until period end).
- Stop reading `legacy_stripe_link` and `bd_member_seed` for entitlement. Remove the union/dedupe path. Both tables become archive-only — they may still be loaded by audit/reconciliation tools that explicitly want history, but no active count uses them.
- Update `buildActivePayingMemberCollection` callers/return shape so existing tiles (`/admin` Overview, Professionals KPI, Ops Customer Health, reconciliation table) read the new shape unchanged.
- Reconciliation page (`/admin/reconciliation` if still present): repurpose its left/right diff to show "in subscriptions" vs "in BD/legacy archives only" — labelled as historical/archive, not as members.

This is **in scope of this pass**. No "Phase 2" deferral. Definition of done requires it.

### 3. Member 360 wiring — `src/lib/admin/member360.functions.ts`

- Replace direct `getMirrorForUser` + ad-hoc `subscriptions.tier` lookup with `resolveAdminSubscriptionForUser({ userId, preferLiveStripe: true })`.
- `Member360Snapshot.subscription` becomes the resolver DTO's `subscription` block; add `source`, `confidence`, `discrepancies`, `stripe_error` siblings.
- `has_active_subscription` = `state.subscription?.is_active_entitlement ?? false`.
- Never return `subscription: null` when a local row exists.

### 4. Member 360 page — `src/routes/admin_.members.$userId.tsx`

- Sticky header status chip via `formatStatusLabel`; tier chip via `formatTierLabel` (always "Core", never "Verified").
- For `trialing` show `Scheduled Core renewal — renews {date}` (replaces the existing "Trial ends" badge).
- `BillingPane` renders from the DTO regardless of source.
- **Source badge** (top-right of Billing pane), non-alarming styling:
  - `Stripe live` → emerald `border-emerald-400/30 bg-emerald-500/15 text-emerald-300`.
  - `Local mirror` → neutral `border-reps-border bg-white/5 text-white/70` (informational, not a warning).
  - `Mismatch` → amber `border-amber-400/30 bg-amber-500/15 text-amber-300` — only this state shows warning styling.
- When `source === "discrepancy"`, render the diff panel below the badge with field/stripe/local/message rows and a link to `/admin/ops/billing`.

### 5. Other admin surfaces — swap to resolver

| File | Change |
|---|---|
| `src/lib/admin/professionals.functions.ts` | Bulk resolver for the "paid status" column; render via `formatTierLabel` / `formatStatusLabel`. |
| `src/routes/admin_.memberships.tsx` (+ data fn) | Bulk resolver; same formatters. |
| `src/routes/admin_.churn.tsx` | Bulk resolver to flag `failed_payment` / `canceled` / `canceling`. |
| `src/routes/admin_.ops.customer.tsx` | Single resolver call; show source + discrepancies. |
| `src/routes/admin_.ops.billing.tsx` (drill-downs) | Same. |
| `src/routes/admin_.ops.member.$userId.tsx` | Replace inline subscription read. |
| Member Timeline subscription state badges | Use `formatStatusLabel`. |
| Any "Open Billing" / has-subscription gate in components | Read `is_active_entitlement` from the resolver. |

Grep sweep: any `.from("subscriptions")` outside `subscription-resolver.server.ts`, `active-paying-member.server.ts`, billing webhooks, migrations → rewrite or delete.

### 6. UI-text grep enforcement (active billing UI only)

Hard-fail grep in `src/components/**`, `src/routes/admin*`, `src/routes/admin_*`, `src/lib/admin/**` for these literal strings:

- `BD member`, `legacy member`, `migrated member`
- `Trial user`, `Free trial`, `Trial ends`
- `Verified` used as a **tier** label (case-sensitive context match — `formatTierLabel`'s output for tier chips). The word may still appear for professional-verification status (e.g. "Verified pro", verification badge), which is unrelated.

Allowed in: audit logs, archive screens, the metadata/debug drawer, `docs/admin-v2/**`.

### 7. Tests — `src/lib/admin/__tests__/subscription-resolver.test.ts`

The 10 cases from your brief, plus the **Richard Bennett regression fixture** (`6c4d66dd-9fc4-4f37-bc01-e32a61bdff41`):

- local row exists, `status="trialing"`, `current_period_end="2027-05-28T..."`, `tier="verified"`
- Stripe mirror returns `null`
- Expect: `source === "local-mirror"`, `confidence === "medium"`, `is_active_entitlement === true`, `is_scheduled === true`
- `formatTierLabel(state.subscription.tier) === "Core"`
- `formatStatusLabel(state)` produces `Scheduled Core renewal — renews 28 May 2027`
- No string in the rendered output equals `No subscription` / `BD` / `legacy` / `migrated` / `Free trial` / `Trial user`

Plus a second fixture: a healthy **non-migrated, subscription-created Core** account (no Pro fixture invented — Pro members may not exist; if none exist, skip that case rather than fabricate one).

### 8. Verification

Playwright screenshots for: `/admin/members/{richard}`, `/admin/memberships`, `/admin/professionals`, `/admin/churn`, `/admin/ops/billing`. Confirm matching tier + status string for Richard across pages, `tsgo` clean, test suite green.

---

### Definition of done (re-stated)

1. Richard Bennett Member 360 matches the list/memberships page.
2. Member 360 never shows "No subscription" when a valid local live subscription row exists.
3. Every admin subscription display routes through the resolver / bulk resolver.
4. Active entitlement logic is identical across Member 360, Memberships, Professionals, Churn, Ops, **and aggregate counts** (`active-paying-member.server.ts`).
5. BD / legacy tables are **not** used for any active billing status or count.
6. "Core" everywhere; scheduled renewals never called free trials.
7. UI-text grep clean.
8. Typecheck and tests pass.
9. Before/after screenshots provided.

### Out of scope

- BD seed / `legacy_stripe_link` schema changes (still read-only archive; no DROP).
- Webhook/recovery logic.
- No DB migrations.

### Technical notes

- DTO + resolver live in a single server-only file. Member 360 / ops / professionals / memberships server fns import inside `.handler()` blocks.
- Bulk resolver uses `.in("user_id", userIds).eq("environment","live")` and keeps the latest per user in-memory.
- `mapStripePriceToTier` reads the existing `src/lib/billing.ts` price catalogue — no new env vars.
- Tier label conversion is centralised in `formatTierLabel`; no component should render `tier` directly.