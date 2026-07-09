# Fold Providers into Members (remove separate admin surface)

Undo the separate `/admin/providers` sidebar tab. Keep all provider-specific power (whitelist edits, rename+redirect, name history, suspend/republish/close, manual create, activity) but expose it inside the existing Members surface, branched on `account_type='organisation'`.

No changes to: pricing, public profile, dashboard layouts, design tokens, close-membership worker, verification workflow, `providers.functions.ts` server logic.

## What changes

### 1. Sidebar
- `src/components/dashboard/nav-data.ts` — remove the `Providers` item from `ADMIN_NAV`. Members stays as the single people surface.

### 2. Members list (`/admin/members`)
- Add an **Account type** filter: All / Individual / Organisation (default All).
- Add an **Account type** column (or badge next to name) so orgs are visually distinct.
- For rows where `account_type='organisation'`, display `profiles.business_name` as the primary name (fall back to full name if empty).
- Existing search extended to match `business_name` and `slug` in addition to current fields.
- Extend the existing members list server fn (not `listProviders`) with an optional `accountType` filter. `listProviders` stays for internal reuse but is no longer called from a route.

### 3. Member 360 (`/admin/members/$userId`)
- On load, read `professionals.account_type`.
- If `individual`: render the current member tabs unchanged.
- If `organisation`: render the provider tab set instead — Profile (whitelist), Verification (read-only), Qualifications, Name history, Billing, Activity, Danger. These are the exact components already built under `src/components/admin/providers/`.
- Header shows `business_name` + slug + verified/published/suspended badges (reuse the existing Provider360 header component, just mounted inside the members route).
- All existing provider server fns (`getProvider`, `updateProviderField`, `renameProvider`, `suspendProvider`, `republishProvider`, `closeProvider`) are called from this branch — untouched.

### 4. Manual create → unified Invite dialog on Members
- Existing "Invite member" dialog on `/admin/members` gets a **Type** toggle: Individual / Organisation.
- Individual → current invite path unchanged.
- Organisation → calls existing `createProvider` server fn (pre-seeds `profiles.business_name` + `professionals.account_type='organisation'` + slug, sends invite, audits `provider.manual_create`).
- Delete the standalone `ProviderCreateDialog` once its fields are merged into the members invite dialog.

### 5. Files to delete
- `src/routes/admin_.providers.tsx`
- `src/routes/admin_.providers_.$userId.tsx`
- `src/components/admin/providers/ProviderListTable.tsx` (list is now Members)
- `src/components/admin/providers/ProviderCreateDialog.tsx` (merged into Members invite)

### 6. Files kept (reused from Members 360)
- `src/lib/admin/providers.functions.ts` — all server fns retained.
- `src/components/admin/providers/Provider360Header.tsx`
- `src/components/admin/providers/ProviderProfileTab.tsx`
- `src/components/admin/providers/ProviderVerificationTab.tsx`
- `src/components/admin/providers/ProviderNameHistoryTab.tsx`
- `src/components/admin/providers/ProviderBillingTab.tsx`
- `src/components/admin/providers/ProviderActivityTab.tsx`
- `src/components/admin/providers/ProviderDangerTab.tsx`
- `src/components/admin/providers/ProviderRenameDialog.tsx`
- `src/components/admin/providers/ProviderSuspendDialog.tsx`
- Migration index on `admin_audit_log(target_table, target_id, created_at DESC)` — keep.
- The `dashboard-profile.functions.ts` org-preserving patch — keep.

### 7. Files edited
- `src/components/dashboard/nav-data.ts` — remove Providers entry.
- `src/routes/admin_.members.tsx` (or equivalent list route) — add account_type filter/column, extend search.
- `src/routes/admin_.members_.$userId.tsx` (or equivalent 360 route) — branch on `account_type` and mount provider tabs when organisation.
- Existing members list server fn — add `accountType` filter and org-aware name projection.
- Existing members invite dialog — add Type toggle wiring to `createProvider`.
- `.lovable/plan.md` — mark folded into Members.

## Build order

1. Remove `Providers` from `ADMIN_NAV`.
2. Extend members list server fn + list route (filter, column, search).
3. Branch Member 360 route on `account_type`; mount existing provider tabs.
4. Merge org path into Members invite dialog; delete `ProviderCreateDialog`.
5. Delete `admin_.providers.tsx` + `admin_.providers_.$userId.tsx` + `ProviderListTable`.
6. Regenerate route tree, typecheck.
7. QA report.

## Acceptance tests

1. Admin sidebar has no "Providers" item; Members is the single people entry.
2. Members list default (All) shows both individuals and organisations; filter Organisation shows only `account_type='organisation'`; row shows `business_name` for orgs.
3. Search "acme" matches an org by `business_name` and by `slug`.
4. Opening a member with `account_type='individual'` renders existing member tabs (unchanged).
5. Opening a member with `account_type='organisation'` renders provider tabs (Profile whitelist edit, Verification read-only, Name history, Billing, Activity, Danger) — same behaviour as previous `/admin/providers/$userId`.
6. Rename an org from Member 360 → `profiles.business_name` updated, slug regenerated, `legacy_redirects` inserted, audit `provider.rename` written.
7. Members invite dialog with Type=Organisation → invite sent, org row pre-seeded, audit `provider.manual_create` written.
8. Direct-navigating to `/admin/providers` and `/admin/providers/<id>` returns 404 (routes removed).
9. Typecheck passes; route tree regenerates cleanly with no orphan references.
10. No changes to pricing, public profile, dashboard layouts, design tokens, close-membership worker, verification workflow.

Verdict target after this pass: 10/10 — one Members surface, provider power intact behind the same URL space, zero sidebar noise.
