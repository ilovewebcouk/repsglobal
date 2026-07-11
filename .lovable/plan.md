Two related fixes for training-provider (organisation) accounts and the identity check that surfaces "SCOTT CAMERONMCKAY".

## 1. Fix the merged-name bug (quick win)

The Stripe Identity webhook at `src/routes/api/public/payments/webhook.ts:275` builds the verified name with:

```ts
const name = [out.first_name, out.last_name].filter(Boolean).join("").trim();
```

Stripe returns `first_name: "SCOTT CAMERON"` and `last_name: "MCKAY"` as two fields — joining with `""` produces `"SCOTT CAMERONMCKAY"`. Change the separator to `" "` so it becomes `"SCOTT CAMERON MCKAY"`. This also collapses to `.replace(/\s+/g, " ")` in case a field already has trailing whitespace.

This retroactively affects new verifications only. For SCOTT specifically, once he restarts the ID check the name will store correctly and the name-mismatch auto-flag will re-evaluate.

Nothing else needs to change for this bug — `identity_verified_name` is a single free-text field used only for display and mismatch comparison.

## 2. Add contact-person + organisation-name split for provider accounts

Today `professionals` has:
- `legal_entity_name` — the org/business legal name
- `identity_verified_name` — the individual's name from Stripe Identity
- `account_type` — `individual` | `organisation`

Missing: a stored **contact person full name** for organisation accounts (the human running the account, distinct from the org). Right now organisation accounts reuse `profiles.full_name`, which is why "Northline Fitness Academy" ends up as a person's name and vice versa.

### Schema change (migration)

Add two columns to `public.professionals` (nullable, only meaningful when `account_type = 'organisation'`):

- `contact_first_name text`
- `contact_last_name text`

Rationale for two columns instead of one `contact_full_name`: mirrors Stripe's `first_name` / `last_name` shape so the ID check comparison is deterministic, and avoids the same merge bug for future admin-entered names.

No RLS changes needed — the existing owner + admin policies cover these columns.

### Where the fields appear

Per your answer: **admin/verification only + provider dashboard/account settings**. NOT on the public profile.

- **Provider dashboard → Account settings** (organisation accounts only): two inputs "Contact first name" / "Contact last name" alongside the existing "Organisation name" (`legal_entity_name`). Individual accounts do not see these — they continue to use their profile name.
- **Admin verification panel** (`src/routes/admin_.verification.tsx`): for organisation accounts, show "Contact: {first} {last}" under the org name in the identity card, and use the concatenated `{first} {last}` (not `profiles.full_name`) as the "profile name" that the Stripe-Identity name-match compares against.
- **Public profile / directory / coach website**: unchanged — the org name is what's shown.

### Name-match logic (organisation accounts)

In `webhook.ts` name-mismatch check (line 302 area):

- If `account_type = 'organisation'` and both `contact_first_name` and `contact_last_name` are set → compare `docName` against `"{contact_first_name} {contact_last_name}"`.
- Otherwise → compare against `profiles.full_name` (current behaviour).

This means an organisation's Stripe Identity check compares the ID against the actual human running the account, not against the org name (which would always mismatch).

## 3. Files touched

- `supabase/migrations/<new>.sql` — add `contact_first_name`, `contact_last_name` columns
- `src/routes/api/public/payments/webhook.ts` — fix `.join(" ")` and switch mismatch comparison to contact name for organisations
- `src/routes/_authenticated/.../account settings` — the provider account settings page (locate the existing organisation-name field, add the two contact fields beside it). I'll find the exact route during implementation.
- `src/routes/admin_.verification.tsx` — display contact name for organisation accounts in the identity card
- Server fn(s) that write org profile fields — extend the validator/handler to accept and persist the two new fields

## 4. Out of scope

- No changes to `identity_verified_name` semantics or storage (still one free-text field from Stripe)
- No public-profile changes
- No signup-flow changes — contact-person fields are edited from account settings after signup (can be added to signup as a follow-up if you want)
- No backfill for existing organisation accounts — fields start null; admin/owner fills them in when they next visit settings

Confirm this scope and I'll implement it.
