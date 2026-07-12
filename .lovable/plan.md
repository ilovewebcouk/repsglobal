# Training providers only — one name, one source of truth

**Scope: training provider accounts (`account_type = 'organisation'`) only. Individual trainers are NOT touched — their existing behaviour (`profiles.full_name` = person's name, `identity_verified_name` from Stripe) stays exactly as-is.**

## The rule for training providers

- **`profiles.full_name`** = the provider's display name (e.g. "Northline Fitness Academy"). One source of truth. Shown on public profile, dashboard, admin. Editable on the profile page (already exists).
- **`professionals.identity_verified_name`** = whatever Stripe Identity returned for the person who ran the ID check. Compliance/audit only. Never edited by the user. Never shown publicly. No comparison against the profile name — Stripe sets it, we accept it.
- **Nothing else.** No `legal_entity_name`, no `contact_first_name`, no `contact_last_name`, no "Legal name" input, no "Organisation name" input, no admin "Organisation / Contact" rows.

## Changes

### 1. Database migration

Drop three columns from `public.professionals`:
- `contact_first_name` (added yesterday)
- `contact_last_name` (added yesterday)
- `legal_entity_name` (added 2026‑07‑06)

Before dropping `legal_entity_name` I'll sweep every SECURITY DEFINER function / view / RPC that references it (notably the `admin_provider_*` upsert in `20260706132157...`) and update them in the same migration so nothing breaks.

### 2. `src/routes/api/public/payments/webhook.ts`

- **Keep** the `.join(" ")` fix (line 275). That's the actual bug — Stripe returns `first_name` / `last_name` separately; joining without a space produced `SCOTT CAMERONMCKAY`. This applies to both individuals and organisations, but it doesn't change semantics for individuals — same field, same code path, just correctly spaced. **No behaviour change for trainers.**
- **Remove** the organisation-branch name-match lookup I added yesterday (~lines 296–320): the `contact_first_name`/`contact_last_name` fetch and the org-vs-individual comparison.
- **For organisation accounts specifically**, skip the profile-name mismatch flag. Trainer (individual) name-match against `profiles.full_name` stays unchanged.

### 3. `src/lib/settings/settings.functions.ts`

- Remove `legal_entity_name`, `contact_first_name`, `contact_last_name` from `SettingsBundle`, the SELECT, the validator, and the update handler.
- `account_type` can stay in the bundle if other UI needs it, but the settings mutation no longer writes any provider-name field. Provider name is edited on the profile page like today.

### 4. `src/components/dashboard/organisation/SettingsPage.tsx`

- Delete the "Legal name", "Organisation name", "Contact first name", "Contact last name" fields and their state. (This page is provider‑only — `dashboard/organisation/…` — so trainer settings are not touched.)

### 5. `src/lib/verification/verification.functions.ts`

- Drop `legal_entity_name, contact_first_name, contact_last_name` from the `listPendingVerifications` SELECT (line 525). `identity_verified_name` stays.

### 6. `src/routes/admin_.verification.tsx`

- Remove the "Organisation" and "Contact" rows I added yesterday to the identity card (~lines 613–635). Identity card renders the same two-line shape for every account: profile display name (from `profiles.full_name`) + Stripe identity name (`identity_verified_name`). No organisation-specific branch.

### 7. Comment / doc cleanup

- Update comments in `src/lib/admin/providers.functions.ts` (line 6) and `src/lib/certificates/certificates.functions.ts` (line 901) that reference `legal_entity_name` as "compliance-only" — the column no longer exists.
- Keep the existing "SINGLE SOURCE OF TRUTH: `profiles.full_name`" comment in `src/lib/qualifications/qualifications.functions.ts` (line 829) — that's already correct and now matches reality.

## QA sweep (before I say done)

Grep the repo and confirm zero non-historical references to:
```
legal_entity_name
contact_first_name
contact_last_name
"Legal name"
"Organisation name"
"Contact first name"
"Contact last name"
```
(Historical `supabase/migrations/*.sql` obviously keep their old references — that's fine.)

Then a typecheck, then a click-through with Playwright of:
- Provider settings page (`/dashboard/settings` while signed in as a provider) — screenshot to confirm no name inputs remain
- Admin verification panel — screenshot to confirm identity card is back to the two-line shape
- Provider profile edit page — screenshot to confirm the single "Provider name" field is present and edits `profiles.full_name`

## Explicitly untouched (trainer side)

- `src/components/dashboard/…` non-organisation settings — not read, not written.
- Trainer profile editor — not read, not written.
- Trainer verification/identity flow — not read, not written.
- `identity_verified_name` write path for trainers — unchanged (same `.join(" ")` fix, but that's a strict improvement).

Confirm and I'll execute.
