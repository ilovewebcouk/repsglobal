# Post-Implementation QA Evidence

**No further code changes proposed. This is a read-only verification pack.**

## 1. Files created

- `src/lib/admin/erase-member-data.server.ts` (3220 bytes)

## 2. Files edited

- `src/lib/admin/close-membership.server.ts` — rewritten (canonical worker + ops alerts + erasure wire-in + marketing consent fix + new reasons)
- `src/lib/admin/billing-actions.functions.ts` — `CancelReason` union + `ALL_REASONS` extended
- `src/lib/settings/settings.functions.ts` — `deleteMyAccount` refactored to delegate
- `src/lib/admin/batch-cleanup.functions.ts` — `marketing_opt_in: true` → `false`
- `src/routes/api/public/payments/webhook.ts` — `invoice.marked_uncollectible` reason swap + DLQ ops alert

## 3. Migration

`supabase/migrations/20260709123853_13d1ea71-c21a-4ba1-afed-282555009a9b.sql`

```sql
ALTER TYPE public.mailing_list_deletion_reason ADD VALUE IF NOT EXISTS 'self_delete';
ALTER TYPE public.mailing_list_deletion_reason ADD VALUE IF NOT EXISTS 'stripe_uncollectible';
```

- Idempotent (`IF NOT EXISTS`), non-destructive, additive-only.
- Touches only `mailing_list_deletion_reason` enum; no tables, RLS, or grants changed.

## 4. Typecheck

`bunx tsgo --noEmit` — **zero errors in any touched file**. Filter of the 5 changed paths + new file against the tsgo output returned empty. Pre-existing errors elsewhere (`routes/reviews.tsx`, `routes/signup.tsx`, `routes/specialisms.tsx`, `routes/t.*.tsx` — TanStack Router `search` param requirements) are unrelated to this pass.

## 5. Scope confirmation — no forbidden surfaces touched

None of the following categories were edited:

- Pricing (`src/lib/billing.ts`, `src/routes/pricing.tsx`, plan tiers) — untouched
- Public profile (`src/routes/pro.*.tsx`, `src/routes/c.$slug.tsx`, `src/routes/t.$slug*.tsx`) — untouched
- Dashboard layout (`src/components/dashboard/**`, `src/routes/_authenticated/**` UI) — untouched
- Design tokens / marketing pages — untouched

Only backend workers, webhook handler, one server fn (`deleteMyAccount`), and one enum migration.

## 6. `deleteMyAccount` no longer calls destructive APIs directly

`rg -n "stripe.subscriptions.cancel|erase_user_pii|storage.*remove|auth.admin.deleteUser" src/lib/settings/settings.functions.ts` returns **empty**. Only surviving admin call is a subscriptions read to decide `mode`. Validation (`confirm_email` match + `DELETE` phrase) runs before any admin work — see lines 316–321 below.

---

## A. Self-delete path — `src/lib/settings/settings.functions.ts:307–348`

- L338–345: `await _closeMembershipImpl({ user_id: userId, mode: hasLiveSub ? "end_now_delete" : "delete_only", reason: "self_delete", notes: ..., actor_id: \`user:${userId}\` })`
- L316–321: email echo + `DELETE` phrase validated before any admin call
- L347: `return { ok: true }`

## B. Canonical worker — `src/lib/admin/close-membership.server.ts`

- L199–210: `professionals.update({ is_published: false, unpublished_reason: 'membership_closed', ... })` runs FIRST, before Stripe/erasure/auth-delete
- L296–299: `eraseClosedMemberData(input.user_id, { erasureMode: erasureModeFor(input.reason) })` — called before auth delete
- L312–313: `auth.admin.deleteUser(input.user_id)` — runs AFTER erasure
- Ops alerts on partial failure: Stripe (L233), email (L279), erasure (L303), audit (L332), roll-up `payments.member_close_partial_failure` (L344)
- L361–367: return object includes `erasure: {...}` and `partialFailures: string[]`

## C. Erasure policy — `src/lib/admin/erase-member-data.server.ts`

```
ALL_BUCKETS = ["avatars","pro-photos","identity-docs","insurance-docs",
               "verification-docs","support-attachments","cpd-certificates"]
CHARGEBACK_RETAIN = { "identity-docs", "insurance-docs", "verification-docs" }
```

`bucketsForMode()`:
- `full_self_delete` → all 7 buckets ✓
- `membership_closed` → all 7 buckets ✓
- `chargeback_lost` → filters out CHARGEBACK_RETAIN → deletes `avatars`, `pro-photos`, `support-attachments`, `cpd-certificates` ✓; retains `identity-docs`, `insurance-docs`, `verification-docs` ✓

Reason → mode mapping (`close-membership.server.ts:123–128`): `self_delete` → `full_self_delete`; `chargeback_lost` → `chargeback_lost`; everything else → `membership_closed`.

## D. Marketing consent — `close-membership.server.ts:132–162, 259` and `batch-cleanup.functions.ts:148`

- `resolveMarketingOptIn(userId, email)`:
  1. Reads `notification_preferences.marketing_opt_in` — returns it if present ✓ (preserves existing opt-in)
  2. Falls back to prior `mailing_list_contacts.marketing_opt_in` by email
  3. Defaults `false` when both unknown ✓
- Upsert (L259): `marketing_opt_in: marketingOptIn` — never hard-coded `true` ✓
- `batch-cleanup.functions.ts:148`: was `marketing_opt_in: true`, now `marketing_opt_in: false` ✓

## E. `invoice.marked_uncollectible` — `src/routes/api/public/payments/webhook.ts:828–834`

```
await _closeMembershipImpl({
  user_id: userId,
  mode: "end_now_delete",
  reason: "stripe_uncollectible",   // was "member_request"
  notes: `Invoice marked uncollectible (invoice ${invoice.id})`,
  actor_id: "stripe_webhook",
});
```

- reason ✓ `stripe_uncollectible`
- actor ✓ `stripe_webhook`
- `member_request` no longer present in this branch ✓

## F. Ops alerts — all six emitted

| Alert kind | Site | Severity |
|---|---|---|
| `payments.webhook_dead_lettered` | `webhook.ts:1005` (in DLQ branch, after `dead_lettered_at` stamp) | high |
| `payments.member_close_stripe_cancel_failed` | `close-membership.server.ts:233` (Stripe cancel catch) | high |
| `payments.member_close_storage_erasure_failed` | `close-membership.server.ts:303` (erasure post-check) | high |
| `payments.member_close_email_failed` | `close-membership.server.ts:279` (email `ok:false`) | medium |
| `payments.member_close_audit_failed` | `close-membership.server.ts:332` (audit log catch) | medium |
| `payments.member_close_partial_failure` | `close-membership.server.ts:344` (roll-up when `partialFailures.length > 0`) | high |

Plus existing `payments.member_cancelled` (info / high for chargeback) preserved.

## G. Migration

Full content shown in §3. Safety review:

- `ADD VALUE IF NOT EXISTS` → safe to re-run; no error if value already present
- Only affects one enum type
- No table alterations, no policy/grant changes, no data mutations
- Cannot be inside an explicit transaction with other DDL that reads the enum in the same statement — not applicable here (standalone migration)

## H. Manual QA checklist (expected behaviour)

| # | Scenario | Expected result |
|---|---|---|
| 1 | Self-delete from `/dashboard/settings` | Validates email + `DELETE`. Worker: profile hide → Stripe cancel (if live sub) → retention stamp → mailing archive (opt-in preserved) → bd_migration detach → email → erasure (all 7 buckets) → auth delete → audit `actor:user:<uuid>` → ops alert `member_cancelled` info |
| 2 | Stripe portal cancel | `customer.subscription.deleted` handler → worker (`reason:member_request`, `actor:stripe_webhook`) → same footprint + full erasure now included |
| 3 | Admin close (Member 360) | `closeMembership` → worker (`actor:admin:<uuid>`) → cannot close own admin account (guard in `billing-actions.functions.ts`) → full erasure |
| 4 | Invoice uncollectible | Webhook → worker with `reason:stripe_uncollectible`, `actor:stripe_webhook`; audit + `member_cancelled` ops alert reflect new reason; label = "closed after payment could not be collected" |
| 5 | Chargeback lost | Existing dispute-lost caller passes `reason:chargeback_lost` → erasure mode `chargeback_lost` → retains identity/insurance/verification buckets, deletes avatars/pro-photos/support-attachments/cpd-certificates; `member_cancelled` ops alert severity = high |
| 6 | Webhook duplicate delivery | Existing `payment_events` idempotency layer unchanged; second delivery no-ops. Worker also idempotent-friendly: profile already hidden, Stripe cancel returns `resource_missing` (skipped), auth delete on already-deleted user throws → surfaces as error (caller retries, DLQ eventually) — behaviour matches pre-change |
| 7 | Webhook dead-letter | After 5 attempts, `payment_events.dead_lettered_at` stamped, 200 ack returned, and new `payments.webhook_dead_lettered` high-severity ops alert inserted with `{event_id, event_type, attempts, error}` |
| 8 | Simulated storage delete failure | `eraseClosedMemberData` catches per-bucket error, populates `storageBucketsFailed`, `ok:false`. Worker still completes (auth delete runs), emits `member_close_storage_erasure_failed` high + roll-up `member_close_partial_failure` high. Return payload shows failed bucket list |
| 9 | Simulated email failure | `sendCancellationEmail` returns `{ok:false, error}`. Worker still completes, emits `member_close_email_failed` medium + roll-up partial-failure high. `emailSent:false` + `emailError` in return |
| 10 | Marketing opt-out member cancels | `resolveMarketingOptIn` reads `notification_preferences.marketing_opt_in = false` → mailing archive row written with `marketing_opt_in:false`; no forced `true` |

---

**Verdict:** all P0-1 through P0-5 fixes verified against source. Awaiting sign-off before next work item.
