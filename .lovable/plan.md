## Goal

One column is the provider's display name: **`profiles.business_name`**. The admin queue reads *only* that column. Providers cannot submit qualifications or CPD until it's set.

## Why the mess exists today

Five columns compete for "provider name":

| Column | Table | Purpose today |
|---|---|---|
| `legal_entity_name` | professionals | Legal/trading name (org) |
| `identity_verified_name` | professionals | Name from ID doc |
| `business_name` | profiles | Provider-editable display/trading name (approved via name-change queue) |
| `display_name` | profiles | Rarely used, mostly null |
| `full_name` | profiles | Personal name from signup |

The admin queue currently falls back through all five, so Scott's `full_name` ("Scott") wins even though he's operating as "Diverse Trainers".

## The fix

### 1. Single read column
- Admin queue, notifications, provider-domain review, insurance review, qualification review, CPD review → read `profiles.business_name` and *nothing else* for "provider name".
- Fall back to a neutral `"Unnamed provider"` label if it's empty (never to `full_name` — that's the individual behind the account).

### 2. Onboarding gate
- Add a required "Trading name" step to provider onboarding that writes `profiles.business_name` directly (no name-change-request queue for the *first* value — only subsequent changes go through the approval queue).
- Block `submitProviderRegulatedPermission` and `submitCpdCourse` server fns with an explicit error if `profiles.business_name` is empty.
- Surface a dashboard banner on `/dashboard/verification` when it's missing: "Set your trading name before you can submit qualifications or CPD."

### 3. Retire the fallback chain in the read path
- Remove `hydrateProviderNames` and the `legal_entity_name`/`identity_verified_name`/`display_name`/`full_name` cascade from:
  - `src/lib/qualifications/qualifications.functions.ts`
  - `src/lib/verification/admin-pending.functions.ts`
  - `src/lib/cpd/cpd.functions.ts`
  - `src/components/admin/verification/AdminProviderQualificationsTab.tsx`
- Keep the columns in the DB (they still serve other purposes: `legal_entity_name` for legal docs/invoices, `identity_verified_name` for ID matching, `full_name` for personal identity), but they are **not** read for provider display anywhere.

### 4. Backfill
- One-off migration: for existing rows where `profiles.business_name IS NULL` and the account has already submitted a qualification/CPD, copy from `professionals.legal_entity_name` (if the account is an organisation) so the current admin queue keeps working. Scott stays empty → he'll be forced through the new gate on his next visit.

## Files to change

**Server**
- `src/lib/verification/admin-pending.functions.ts` — read only `business_name`
- `src/lib/qualifications/qualifications.functions.ts` — remove `hydrateProviderNames`, read only `business_name`
- `src/lib/cpd/cpd.functions.ts` — same
- `src/lib/verification/provider-changes.functions.ts` — same for the domain/name review queues
- New: `assertProviderHasTradingName(userId)` helper called at the top of `submitProviderRegulatedPermission` and `submitCpdCourse`

**Onboarding UI**
- Add a "Trading name" required field to the provider onboarding flow (or the first-run dashboard nudge) that writes `profiles.business_name` on save.
- Add a banner + inline block on `dashboard/verification` when trading name is empty.

**Admin UI**
- `AdminProviderQualificationsTab.tsx`, admin CPD tab, admin domain/name tabs → drop fallback rendering, show `business_name || "Unnamed provider"`.

**Migration**
```text
UPDATE profiles p
SET business_name = pr.legal_entity_name
FROM professionals pr
WHERE pr.id = p.id
  AND p.business_name IS NULL
  AND pr.legal_entity_name IS NOT NULL
  AND pr.account_type = 'organisation';
```

## Result

- Admin queue for Scott shows **"Unnamed provider"** until he completes the trading-name step, at which point it shows exactly what he types.
- One column, one source of truth, no five-way fallback.
- Existing `provider_name_requests` approval queue still governs *changes* after the initial value is set.
