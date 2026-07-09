## Goal

Make every account-ending path — member self-delete, Stripe cancel, admin close, dispute lost, invoice uncollectible — go through **one** canonical worker with the same audit, retention, profile hide, email, PII/storage erasure, and ops-alert behaviour. Backend consistency pass only. No pricing, refund, plan, public-profile, or dashboard-layout changes.

## Scope (in order)

### Fix 1 — Route self-delete through `_closeMembershipImpl`

**Files**
- `src/lib/admin/close-membership.server.ts`
- `src/routes/api/**` or wherever `deleteMyAccount` currently lives (locate via `rg "deleteMyAccount"` in build mode)

**Changes**
- Extend `CancelReason` union with `"self_delete"`.
- Extend `REASON_LABEL` with `self_delete: "at your request"`.
- Refactor `deleteMyAccount` to:
  1. Validate email echo + `DELETE` phrase (keep existing guards).
  2. Resolve `userId` from session.
  3. Call `_closeMembershipImpl({ user_id, mode: hasLiveSub ? "end_now_delete" : "delete_only", reason: "self_delete", notes, actor_id: \`user:${userId}\` })`.
  4. Remove duplicated Stripe cancel + `auth.admin.deleteUser` calls — the worker owns them.
- Keep the client-facing return shape (`{ ok: true }`) stable.

### Fix 2 — Shared erasure helper into canonical worker

**New file**
- `src/lib/admin/erase-member-data.server.ts` exporting `eraseClosedMemberData(userId, { erasureMode })`.

**Erasure surface (ported from current `deleteMyAccount`)**
- `erase_user_pii` RPC (whichever tables it covers today).
- Storage buckets: `avatars`, `pro-photos`, `identity-docs`, `insurance-docs`, `verification-docs`, `support-attachments`, `cpd-certificates`.

**`erasureMode` policy matrix**

| Mode | PII RPC | Avatars/pro-photos | Identity/insurance/verification | Support attachments | CPD certificates |
|---|---|---|---|---|---|
| `full_self_delete` | yes | delete | delete | delete | delete |
| `membership_closed` (admin close, stripe cancel, uncollectible) | yes | delete | delete | delete | delete |
| `chargeback_lost` | yes | delete | **retain** | **retain** | delete |
| (future: `admin_close` — currently maps to `membership_closed`) | — | — | — | — | — |

- Each step wrapped in try/catch; failures raise a partial-failure signal (see Fix 5) but do not abort the close.

**Wire-in**
- `_closeMembershipImpl` calls `eraseClosedMemberData(user_id, { erasureMode })` **before** `auth.admin.deleteUser` (auth row is FK target for storage owner checks; deleting after erase keeps RLS predictable).
- Map incoming `CancelReason` → `erasureMode`:
  - `self_delete` → `full_self_delete`
  - `chargeback_lost` → `chargeback_lost`
  - everything else → `membership_closed`
- Remove the equivalent inline erasure from `deleteMyAccount` once it delegates to the worker.

### Fix 3 — Marketing consent must not be forced true

**File**: `src/lib/admin/close-membership.server.ts` (the `mailing_list_contacts` upsert block)

**Changes**
- Before upsert, read existing row by `email`:
  - If found and `marketing_opt_in = true` with a real prior source → preserve `marketing_opt_in`, `marketing_consent_source`, `marketing_consent_at`.
  - Otherwise → `marketing_opt_in = false`, do not set `marketing_consent_source = 'cancellation'`, leave `marketing_consent_at` null.
- `source` column (archive/provenance) can remain `"cancellation"` — that is provenance, not marketing consent.
- Confirm `marketing_consent_source` / `marketing_consent_at` columns exist on `mailing_list_contacts`; if not, defer those two fields and only fix `marketing_opt_in`. (Check in build mode via `supabase--read_query`; if columns are missing, do NOT add a migration in this pass — flag as follow-up.)

### Fix 4 — `stripe_uncollectible` reason

**Files**
- `src/lib/admin/close-membership.server.ts` (type + label)
- `src/lib/admin/billing-actions.functions.ts` (`ALL_REASONS` array, `CancelReason` union)
- Stripe webhook handler for `invoice.marked_uncollectible` (locate via `rg "marked_uncollectible"`)

**Changes**
- Add `"stripe_uncollectible"` to `CancelReason` union in both files.
- `REASON_LABEL.stripe_uncollectible = "closed after payment could not be collected"`.
- Webhook path swaps `reason: "member_request"` → `reason: "stripe_uncollectible"`, `actor_id: "stripe_webhook"`.

### Fix 5 — Ops alerts for dead-letter and partial failures

**New helper** in `close-membership.server.ts` (or a sibling `ops-alerts.server.ts`):

```
insertOpsAlert(kind, severity, context)
```

**Emit from**:

| Kind | Severity | Site |
|---|---|---|
| `payments.webhook_dead_lettered` | high | webhook DLQ handler (after retry threshold, when `payment_events.dead_lettered_at` is stamped) |
| `payments.member_close_partial_failure` | high | worker top-level catch when any non-fatal step throws |
| `payments.member_close_storage_erasure_failed` | high | `eraseClosedMemberData` catch |
| `payments.member_close_stripe_cancel_failed` | high | existing Stripe cancel loop |
| `payments.member_close_email_failed` | medium | when `sendCancellationEmail` returns `ok: false` |
| `payments.member_close_audit_failed` | medium | audit log catch |

- Each context payload: `{ user_id, reason, actor, step, error: message }`.
- Ops-alert insert failure itself stays a `console.warn` — unavoidable last resort.

## Non-goals (explicit)

- No change to "cancel = immediate termination, no grace" policy.
- No change to pricing, refund logic, plan tiers.
- No public-profile or dashboard UI changes.
- No new schema migrations unless a column referenced above is missing; if so, flag and defer.

## Verification (acceptance tests to walk through post-build)

1. Self-delete from `/dashboard/settings` runs the canonical worker; audit row shows `actor: user:<uuid>`, reason `self_delete`; storage buckets scrubbed; `member-cancelled` email sent.
2. Stripe portal cancel: still works, now also erases storage; duplicate webhook is idempotent (existing behaviour preserved).
3. Admin close: unchanged actor format `admin:<uuid>`, now also erases storage.
4. `invoice.marked_uncollectible`: reason `stripe_uncollectible`, actor `stripe_webhook`, ops alert emitted.
5. Marketing consent: opted-out member stays opted out; unknown → false; no forced `true`.
6. Chargeback lost: identity/insurance/verification retained; other storage erased.
7. Webhook DLQ: dead-lettered event → high-severity ops alert.
8. Partial failure (simulate Stripe cancel or storage delete throwing): close still completes, high-severity ops alert written.

## Deliverable

One implementation turn covering Fixes 1–5, followed by a short QA note in chat confirming each acceptance test.
