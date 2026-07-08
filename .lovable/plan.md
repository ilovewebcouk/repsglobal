# Provider verification & change-approval overhaul

Everything a training provider edits on their dashboard (name, about, phone, contact email, socials, domain email, etc.) becomes a **pending change request** that appears in a unified admin queue. Trainer verification stays untouched.

## 1. Audit (first step, via subagent)

Spawn `acp_subagent--explore` to enumerate:
- Every editable field on `src/components/dashboard/organisation/ProviderProfilePage.tsx` (identity, contact, about, socials, addresses).
- Which server function currently writes each field (`updateMyProviderProfile`, `submitProviderNameChange`, `startProviderDomainVerification`, etc.).
- Which underlying table/column each field maps to (`professionals`, `websites`, `provider_name_requests`, `provider_domain_verifications`).
- Anything already gated by approval (name, domain) vs. anything currently published instantly.

Output: a field → table → save-path map used to drive step 2. No code changes in this step.

## 2. Data model — `provider_change_requests`

New generic queue table (single migration, with GRANTs + RLS per project rules):

```text
provider_change_requests
  id, provider_id (auth.users.id), field_group, field_key,
  proposed_value (jsonb), current_value (jsonb, snapshot at submit),
  status enum('pending','approved','rejected','superseded'),
  admin_note, reviewer_id, reviewed_at, created_at, updated_at
```

Rules:
- RLS: provider can `SELECT`/`INSERT` their own pending rows; admin (via `has_role`) can do everything.
- When a new pending row lands for a `(provider_id, field_key)` that already has one pending, the old row is auto-marked `superseded` (trigger).
- Approving copies `proposed_value` into the real column on `professionals` / `websites` (SECURITY DEFINER function `apply_provider_change(id)`).
- Existing `provider_name_requests` is kept as-is for now; the new admin queue reads from both via a view `provider_pending_queue` (union: name requests + domain verifications in `pending_admin_review` + change requests in `pending`).

## 3. Server functions

New in `src/lib/verification/provider-changes.functions.ts`:
- `submitProviderChange({ field_key, proposed_value })` — auth'd provider; validates against a per-field Zod schema; inserts pending row.
- `listMyProviderChanges()` — provider's own pending/recent decisions (for inline "Awaiting review" pills on the Profile page).
- `adminListProviderQueue({ status })` — merges name requests, domain verifications, change requests.
- `adminDecideProviderChange({ id, decision, note })` — approve/reject; on approve calls `apply_provider_change`.

Rewire `updateMyProviderProfile` so that **only whitelisted "safe" fields** (e.g. preferred display timezone, cosmetic bits — final list from step 1) still write directly. Every public-facing field routes through `submitProviderChange`.

## 4. Provider dashboard UX

On `ProviderProfilePage.tsx`:
- Each managed field shows one of three states: **Live**, **Awaiting review** (amber pill matching the existing Provider-domain "Awaiting review" chip: `border-amber-400/30 bg-amber-500/15 text-amber-300`), **Changes requested** (with admin note).
- Save button copy changes to "Submit for review" for gated fields.
- Inline read-only preview of the proposed value while pending.

On `VerificationPage.tsx` (provider):
- Fix "0 of 2" hero copy (already correct here) — no change needed.
- Add a small "Pending profile changes: N" line linking to Profile when the provider has other pending edits.

## 5. Admin `/admin/verification` — Trainer / Provider tabs

Refactor `src/routes/admin_.verification.tsx`:
- Top-level tab switcher: **Trainers** (current UI, unchanged) / **Providers**.
- Providers tab renders `<AdminProviderQueue />`:
  - Left list, grouped by provider, each row = one pending item with a type badge (Domain / Name / About / Phone / Contact email / …).
  - Right detail pane: current value vs proposed value diff, admin note textarea, Approve / Reject buttons (reject requires note, matching current name-approval UX).
  - Realtime refresh via existing Supabase channels + new `provider_change_requests` subscription.
- `/admin/provider-names` route becomes a redirect into the Providers tab (or is removed from the sidebar and folded in).

## 6. Sidebar badge

`src/components/dashboard/DashboardSidebar.tsx`:
- **Trainer badge** (`/dashboard/verification`): unchanged 0–3 counter, but tint amber (`bg-amber-500/15 text-amber-300 border-amber-400/30`) while any check is `pending_admin_review`, green when complete, neutral otherwise.
- **Provider badge**: new `VerificationCountBadge` variant using `tier === "training_provider"` → shows `n/2` with the same amber-while-pending rule (fixes the current "0/3" bug).
- **Admin badge** (`/admin/verification`): `useAdminVerificationPending` extended to include `provider_change_requests` + `provider_domain_verifications` + `provider_name_requests` totals. Remove standalone "Name approvals" sidebar item.

## 7. Realtime + notifications

- Extend `useAdminVerificationPending` subscription list to include the two new tables.
- Email templates: reuse existing name-approval decision email pattern for generic change decisions (single new template `provider-change-decision.tsx` with dynamic field label). Out of scope: bulk digest.

## 8. QA checklist (verify before shipping)

- Editing About on Profile → row appears in `provider_change_requests`, amber pill shows on Profile, appears in admin Providers tab.
- Approve → value reflected on public `/t/$slug`, provider Profile shows "Live", email sent.
- Reject with note → provider sees "Changes requested" pill + note, can edit and resubmit; old row `superseded`.
- Sidebar: provider account shows `0/2` not `0/3`; amber while domain pending.
- Existing name & domain flows continue to work through the merged queue.
- No regression on trainer verification tab.

## Files touched (high-level)

- New: `supabase/migrations/*` (table + view + trigger + function), `src/lib/verification/provider-changes.functions.ts`, `src/components/admin/verification/AdminProviderQueue.tsx`, `src/lib/email-templates/provider-change-decision.tsx`.
- Modified: `src/routes/admin_.verification.tsx`, `src/components/dashboard/organisation/ProviderProfilePage.tsx`, `src/components/dashboard/organisation/VerificationPage.tsx`, `src/components/dashboard/DashboardSidebar.tsx`, `src/components/dashboard/nav-data.ts`, `src/hooks/useAdminVerificationPending.ts`, `src/lib/verification/provider-profile.functions.ts` (or wherever `updateMyProviderProfile` lives).
- Removed from sidebar: standalone "Name approvals" entry. Route file kept as a redirect for one release.

## Explicitly out of scope (this pass)

- Auto-approval heuristics / trust levels per provider.
- Bulk approve.
- Historical audit UI for approved changes (data is captured; UI later).
- Migrating old `provider_name_requests` rows into the new table (kept as-is, read via union view).
