## Goal

Two hard rules, enforced end-to-end:

1. **Cancel = immediate termination.** No grace period, no refund, no "cancel at period end". Public profile hidden the same second, dashboard access dead, auth user deleted, subscription row closed with retention stamps. One member email, one ops alert.
2. **Dispute opened = account suspended immediately.** Login blocked, dashboard locked, public profile hidden, subscription flagged. If we win, the member gets a restore-and-resubscribe email. If we lose, the account is fully closed via the cancel path above.

The audit (see subagent report) shows the plumbing is 60% there but leaks in specific, fixable places. This plan is the smallest set of changes that closes those leaks and removes the contradictory "grace" paths so we cannot accidentally reintroduce them.

---

## Part 1 — Cancellation

### 1.1 Retire the "cancel at period end" surface
Grace periods are a policy decision the user has rejected. Remove them so they cannot be silently re-enabled:

- **Stripe Billing Portal config**: update the portal configuration to `cancellation_mode: 'immediate'` (no `at_period_end` option). This is a one-time Stripe dashboard change; document it in `docs/ops/stripe-portal-config.md`.
- **`setMemberCancelAtPeriodEnd`** (`src/lib/admin/billing-actions.functions.ts:104`) and the `schedule_end_period` branch of `_closeMembershipImpl` (`src/lib/admin/close-membership.server.ts`): delete both. Admin cancel UI (`Member 360 → Close membership`) collapses to a single "Cancel now (deletes account, no refund)" action.
- Drop the orphaned `cancellation-confirmation.tsx` template.
- Add a webhook safeguard: on `customer.subscription.updated` with `cancel_at_period_end === true`, immediately escalate to full close via `_closeMembershipImpl({ mode: 'end_now_delete', reason: 'member_request' })`. Belt-and-braces in case a Stripe misconfiguration slips through.

### 1.2 Tighten the immediate-close path
`_closeMembershipImpl({ mode: 'end_now_delete' })` mostly does the right thing, but two gaps:

- **Hide the profile before the auth delete cascades.** Add an explicit `UPDATE professionals SET is_published = false, unpublished_reason = 'membership_closed', unpublished_at = now() WHERE user_id = $1` at the top of the close path (before Stripe cancel calls). This makes the public profile disappear even if the auth-delete later fails and retries.
- **Ops alert.** Insert an `ops_alerts` row `payments.member_cancelled` with member email, tier, reason. Add a matching humaniser entry in `alert-humanizer.ts` so it renders in `/admin`.

### 1.3 Member email correction
The existing `member-cancelled` template already says "we've closed your membership" — that becomes truthful once 1.1 is done. No new template needed, but sweep the copy to remove any residual "until end of period" language.

---

## Part 2 — Payment Disputes

### 2.1 Suspend on `charge.dispute.created`
Extend `suspendMemberForDispute` (`src/lib/billing/disputes.server.ts:128`) to do all four in one transaction:

1. Set `subscriptions.payment_standing = 'payment_disputed'` (already done).
2. Cancel the Stripe subscription (already done).
3. **NEW: `UPDATE professionals SET is_published = false, unpublished_reason = 'dispute_suspended', suspended_at = now(), suspension_reason = 'payment_dispute' WHERE user_id = $1`.**
4. **NEW: `supabaseAdmin.auth.admin.updateUserById(userId, { ban_duration: '876000h' })`** (100 years — effectively permanent until lifted). This kills any active session and blocks new logins.
5. Link the subscription to the dispute: add a `dispute_id UUID REFERENCES disputes(id)` column on `subscriptions` and set it here (migration).

### 2.2 Route-level guard for edge cases
Add a check in `requireRole` / the `_authenticated/_professional` gate that if any of the user's subscriptions have `payment_standing IN ('payment_disputed', 'chargeback_lost')`, redirect to a lightweight `/account/suspended` page that just shows: "Your account is suspended pending a payment dispute. Contact support@repsuk.org." This is defence-in-depth in case the auth ban is ever lifted without clearing `payment_standing`.

Public profile route `/c/$slug` and `/pro/$slug`: add `professionals.is_published = true` and `suspended_at IS NULL` to the loader query so suspended pros 404 immediately.

### 2.3 Dispute close outcomes

- **Won** (`charge.dispute.closed` with `status = 'won'`): keep current `liftSuspensionAfterWin` behaviour on `payment_standing`, PLUS
  - unban the auth user (`ban_duration: 'none'`),
  - clear `suspended_at`/`suspension_reason` on `professionals`,
  - leave `is_published = false` (they still need to re-subscribe — old sub is cancelled),
  - send a new **`dispute-won-resubscribe`** email with a one-click Stripe checkout link to restart membership. No automatic role restore; they re-enter via checkout like any new member.
- **Lost** (`charge.dispute.closed` with `status = 'lost'`): call `_closeMembershipImpl({ mode: 'end_now_delete', reason: 'chargeback_lost' })`. This deletes the auth user, archives to `mailing_list_contacts`, sends the standard `member-cancelled` email. Skip the current `chargeback-resolved-lost` template (its content is redundant with the cancel email); consolidate into one message.

### 2.4 Ops alerts for disputes
Add `ops_alerts` inserts + humaniser entries for:
- `payments.dispute_opened` (member, amount, evidence_due_by)
- `payments.dispute_lost` (member, amount, account now closed)
- `payments.dispute_won` (member, amount, resubscribe email sent)

`funds_withdrawn` / `funds_reinstated` remain silent to the member (they don't need internal accounting drama) but log an ops alert each.

---

## Part 3 — Admin surfaces

Small additions to the dispute workbench (`src/lib/admin/billing-console/dispute-workbench.functions.ts` + its route):

- Show current suspension state (banned / published / payment_standing) per dispute row.
- "Force close now" button that calls the lost-path handler manually (for cases where Stripe hasn't closed the dispute but ops wants to pre-empt).
- "Manually lift ban" button (rare, requires typed confirmation) that runs the won-path.

Member 360 admin view: surface `payment_standing`, `suspended_at`, and `ban_duration` prominently so support can answer "why can't I log in?" instantly.

---

## Part 4 — Emails summary after this change

| Event | Member email | Ops alert |
|---|---|---|
| Cancel (self or admin) | `member-cancelled` | `payments.member_cancelled` |
| Payment failed | `renewal-payment-failed` (unchanged, 3-day throttle) | existing `payments.failed_active` |
| Dispute opened | `chargeback-received` (existing, revise copy: "your account is suspended while we investigate") | `payments.dispute_opened` |
| Dispute won | **new** `dispute-won-resubscribe` (with checkout link) | `payments.dispute_won` |
| Dispute lost | `member-cancelled` (via close path) | `payments.dispute_lost` |
| Funds withdrawn / reinstated | none | ops alert only |

Retire: `chargeback-resolved-won`, `chargeback-resolved-lost`, `cancellation-confirmation`.

---

## Technical details

**Migrations (single migration file):**
```sql
-- Link disputes to the subscription they suspended
ALTER TABLE public.subscriptions
  ADD COLUMN dispute_id UUID REFERENCES public.disputes(id);
-- Track why a profile is hidden
ALTER TABLE public.professionals
  ADD COLUMN unpublished_reason TEXT,
  ADD COLUMN unpublished_at TIMESTAMPTZ;
```

**Files touched:**
- `src/routes/api/public/payments/webhook.ts` — add `cancel_at_period_end` escalation; add `invoice.marked_uncollectible` as alias of `subscription.deleted`.
- `src/lib/billing/disputes.server.ts` — extend `suspendMemberForDispute` (profile hide + auth ban + dispute link); rewrite lost-path to call `_closeMembershipImpl`; extend `liftSuspensionAfterWin` (unban + resubscribe email).
- `src/lib/admin/close-membership.server.ts` — delete `schedule_end_period` branch; add profile-hide at top; add ops alert insert.
- `src/lib/admin/billing-actions.functions.ts` — delete `setMemberCancelAtPeriodEnd`.
- `src/lib/route-gates.ts` (or equivalent) — add `payment_standing` suspension redirect.
- `src/routes/c.$slug.index.tsx`, `src/routes/pro.$slug.index.tsx` loaders — filter on `is_published = true AND suspended_at IS NULL`.
- `src/routes/account.suspended.tsx` — new tiny page.
- `src/lib/emails/templates/dispute-won-resubscribe.tsx` — new template.
- `src/lib/admin/billing-console/dispute-workbench.functions.ts` + admin route — add force-close / lift-ban actions and status columns.
- `src/lib/admin/alert-humanizer.ts` — add three `payments.dispute_*` + one `payments.member_cancelled` entries.
- Delete: `cancellation-confirmation.tsx`, `chargeback-resolved-won.tsx`, `chargeback-resolved-lost.tsx`.
- `docs/ops/stripe-portal-config.md` — new, documents the Stripe dashboard portal setting.

**Out of scope (call out, don't build):**
- Refund policy: this plan hardcodes "no refund on cancel", matching your instruction. If ops ever needs discretionary refunds they'd use the Stripe dashboard directly — that already fires `charge.refunded` which is safely handled today.
- Escalating dunning sequence (day 7/14 emails). Existing single `renewal-payment-failed` stays as-is unless you want it expanded.
- Migration of any existing accounts currently in a `cancel_at_period_end = true` state — I'll include a one-shot data-fix in the migration to force-close them via the standard path, but flag it for your review before running.
