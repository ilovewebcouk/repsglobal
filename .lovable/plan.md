# Admin Provider Control — build plan

Backend/admin only. No pricing, public profile, dashboard layout, design tokens, or verification override. One provider name: `profiles.business_name`. `professionals.legal_entity_name` never surfaced or editable.

## Snag handling (from honest review)

1. **`admin_pro_invites.plan` enum** — pass `'pro'` for provider invites this pass. No enum change. Note the provider-ness via the seeded `professionals.account_type='organisation'`; revisit invite metadata in a later pass.
2. **Pre-seed race with signup handler** — `upsert` on `professionals.id` and `profiles.id` with `account_type='organisation'` locked in. Any downstream new-user flow overwriting it back to `individual` is a bug to fix if observed, not something we work around here.
3. **`renameProvider` old-slug capture** — SELECT current `professionals.slug` first; skip `legacy_redirects` insert when old == new; hard-fail if `regenerateProviderSlug` returns `null` (empty slugify base).
4. **Provider verification queue display** — small edit to existing `AdminProviderQueueTab` copy so "current provider name" shows `profiles.business_name` and the requested change reads alongside it. No behavioural change.

## Files created

**Routes**
- `src/routes/admin_.providers.tsx` — list page.
- `src/routes/admin_.providers_.$userId.tsx` — Provider 360 shell + tabs.

**Server functions**
- `src/lib/admin/providers.functions.ts` — `listProviders`, `getProvider`, `updateProviderField`, `renameProvider`, `createProvider`, `suspendProvider`, `republishProvider`, `closeProvider`.

**Components** (under `src/components/admin/providers/`)
- `ProviderListTable.tsx`
- `ProviderCreateDialog.tsx`
- `ProviderRenameDialog.tsx`
- `ProviderSuspendDialog.tsx`
- `Provider360Header.tsx`
- `ProviderProfileTab.tsx` (whitelisted per-field edit)
- `ProviderVerificationTab.tsx` (read-only)
- `ProviderQualificationsTab.tsx` (scoped reuse of existing provider qualification list)
- `ProviderNameHistoryTab.tsx` (name requests + rename audit)
- `ProviderBillingTab.tsx` (mirrors Member 360 read shape)
- `ProviderActivityTab.tsx` (`admin_audit_log` filter)
- `ProviderDangerTab.tsx`

**Migration**
- `supabase/migrations/<ts>_admin_audit_log_target_idx.sql`
  ```sql
  CREATE INDEX IF NOT EXISTS admin_audit_log_target_idx
    ON public.admin_audit_log (target_table, target_id, created_at DESC);
  ```

## Files edited

- `src/components/admin/verification/AdminProviderQueueTab.tsx` (or equivalent) — display current `profiles.business_name` alongside `provider_name_requests.requested_name`; no behaviour change.
- `.lovable/plan.md` — mark this pass complete.

Nothing else. No touches to: pricing files, `/t/*` public routes, dashboard route/layout files, `src/styles.css` or design tokens, close-membership worker, `regenerateProviderSlug`, RLS.

## Server function contracts

All `.middleware([requireSupabaseAuth])` + inline `has_role('admin')` check. `supabaseAdmin` loaded via `await import` inside handlers. Audit via existing `log_admin_action` RPC — `logAdminAction` server fn or direct `.rpc('log_admin_action', ...)` inside the same handler (single tx-adjacent write). Zod inputValidator on every fn.

- `listProviders({ q?, verified?, published?, suspended?, limit, offset })` — SELECT from `professionals` where `account_type='organisation'`, LEFT JOIN `profiles` for `business_name`, projections only. Search: OR across `business_name`, `slug`, `contact_email`.
- `getProvider({ userId })` — return 404 if row missing or `account_type != 'organisation'`. Returns professionals + profiles snapshot.
- `updateProviderField({ userId, field, value, reason? })` — field must be in whitelist (see below). Per-field validator. Fetch before → update → fetch after → audit `provider.field_update`.
- `renameProvider({ userId, name, reason })` — required reason. Trim, 1–120. Capture old slug. Update `profiles.business_name`. Call `regenerateProviderSlug`. If old !== new slug, insert `legacy_redirects(source_path='/t/<old>', destination_path='/t/<new>', kind='provider_rename')` (upsert on PK). Audit `provider.rename` with `{old_name, new_name, old_slug, new_slug}`.
- `createProvider({ email, name, website?, note? })` — email regex, name 1–120. `supabaseAdmin.auth.admin.generateLink({type:'invite'})` — reuse `sendProfessionalInvite` style. On existing email → throw clean error, write nothing. Upsert `profiles {id, business_name}`. Upsert `professionals {id, account_type:'organisation', slug: uniqueSlugify(name), is_published:false, website_url?}`. Insert `admin_pro_invites` row with `plan='pro'`. Send `professional-invite` email. Audit `provider.manual_create`.
- `suspendProvider({ userId, reason })` — reason required. Update `professionals { is_published:false, suspended_at:now(), suspension_reason:reason, unpublished_reason:'admin_suspend', unpublished_at:now() }`. Audit `provider.suspend`.
- `republishProvider({ userId, reason? })` — set `is_published:true`, clear `suspended_at`/`suspension_reason`/`unpublished_reason`/`unpublished_at`. Audit `provider.republish`.
- `closeProvider({ userId, reason, notes? })` — thin wrapper calling `_closeMembershipImpl({ user_id, mode:'end_now_delete', reason:'admin_delete', notes, actor_id:'admin:<uid>' })`. Worker owns its own audit.

## Profile field whitelist

Editable: `headline`, `bio`, `value_prop`, `contact_email`, `contact_phone`, `website`, `website_url`, `city`, `address`, `country`, `year_established`, `staff_count`, `company_number`, `cover_url`, existing social link columns on `professionals`, `awarding_bodies` (text[]).

Validators: email regex; URL parse + http/https + trailing-slash normalise; int 1800–currentYear; int ≥ 0; array-of-strings trim+dedupe; light trim for phone; 1–120 char provider name (rename only, not generic).

Never editable / not shown as edit fields: `id`, `slug`, `account_type`, `verification_status`, `verification`, `reps_member_id`, `is_published`, `suspended_at`, `suspension_reason`, `unpublished_reason`, `unpublished_at`, `created_at`, `updated_at`, any Stripe IDs, auth email, and — per one-name rule — `legal_entity_name`.

## Tabs behaviour

- **Profile** — whitelist-driven form; per-field save with inline validator; each save calls `updateProviderField` and shows toast.
- **Verification** — read-only list of `provider_regulated_permissions` rows for this provider (status, evidence_type, ofqual_number, reviewed_at). Link out to `/admin/verification`. Explicit copy: "Provider verification is handled through the regulated permissions workflow." No write buttons.
- **Qualifications** — reuse existing provider qualifications component, scoped by provider id (read-only view).
- **Name history** — `provider_name_requests` rows (chronological) + `admin_audit_log` rows where `action='provider.rename'` and `target_id=userId`.
- **Billing** — reuse Member 360 billing read fns (subscriptions rows, latest status, tier). No write actions.
- **Activity** — `admin_audit_log` where `target_table='professionals' AND target_id=userId`, newest first (uses the new index).
- **Danger** — Suspend / Republish / Close actions. Modal for each with required reason (except republish). Close copy: "This will cancel the membership, remove public visibility, delete the account, and may affect CPD courses/accreditation data connected to this provider."

## Build order

1. Migration (audit-log target index).
2. `providers.functions.ts` — read paths (`listProviders`, `getProvider`).
3. `/admin/providers` list route + create-dialog trigger (dialog non-functional yet).
4. `/admin/providers/$userId` shell + header + tab skeleton.
5. Profile tab + `updateProviderField`.
6. `renameProvider` + rename dialog + `legacy_redirects` insert.
7. Danger tab (`suspendProvider`, `republishProvider`, `closeProvider`).
8. `createProvider` + manual-create dialog wired.
9. Read-only tabs: Verification, Qualifications, Name history, Billing, Activity.
10. Small edit to `AdminProviderQueueTab` for current-name display.
11. QA report.

## Acceptance tests

1. `/admin/providers` shows only `account_type='organisation'` — verify by counting rows in the response vs a direct query.
2. `/admin/providers/<individual-id>` → 404 UI (no provider found).
3. Edit `contact_email` → `professionals.contact_email` updated; `admin_audit_log` has `action='provider.field_update'` with `target_table='professionals'`, `target_id=<userId>`, `before_state`/`after_state` containing the field.
4. `legal_entity_name` does not appear in Profile tab; grepping the new components returns zero matches.
5. Rename "Acme" → "Acme Fitness": `profiles.business_name` updated, `professionals.slug` regenerated, `legacy_redirects` has row `source_path='/t/acme'`, `destination_path='/t/acme-fitness'`, `kind='provider_rename'`, and an audit row exists.
6. Verification tab renders but issues no writes — DB snapshot of `verification_decisions` / `professionals.verification_status` unchanged after visiting.
7. Manual create new email: invite email sent, `profiles.business_name` set, `professionals` row has `account_type='organisation'`, `is_published=false`, `slug` non-empty; audit `provider.manual_create` present.
8. Manual create existing email: clean error surfaced in UI, no `profiles`/`professionals`/`admin_pro_invites` rows written.
9. Suspend with reason: `is_published=false`, `suspension_reason` set; hitting `/t/<slug>` no longer shows the provider (existing public route already filters on `is_published`).
10. Close via Danger: `_closeMembershipImpl` invoked; provider account gone; worker's normal audit+ops output present. Close-membership source file unchanged.
11. Activity tab query hits `admin_audit_log_target_idx` (verified via EXPLAIN or by observing sub-ms response on a seeded row set).
12. Diff review: no changes to `src/lib/billing*`, `src/routes/t.*`, `src/routes/(dashboard|_authenticated/dashboard)*`, `src/styles.css`, `src/lib/admin/close-membership.server.ts`, `src/lib/verification/provider-name.functions.ts`.

## QA report contents (returned after build)

- Files created (listed).
- Files edited (listed — should be exactly `AdminProviderQueueTab.tsx` + `.lovable/plan.md`).
- Migration filename.
- Typecheck result.
- Grep confirmations: `legal_entity_name` zero-hit in new files; no writes to `verification_decisions` / `professionals.verification_status` in new files; no changes to forbidden paths (diff summary).
- Acceptance test evidence for each of the 12 above.
