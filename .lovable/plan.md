## Decision (LOCKED)

- Phone number is collected, **never displayed on any public page**.
- All client ↔ pro communication goes through the platform (in-app messages + email notifications). No public phone, no public email-as-CTA, no WhatsApp deep-links.
- SMS = Phase 3 (transactional only). WhatsApp = not on the Phase 2 roadmap.
- Phone is **required at profile activation** (a profile can't be published without one).

## What changes

### 1. Database

- Rename `professionals.public_phone` → `professionals.contact_phone` (the field is no longer "public"; the old name is misleading and tempts future code into rendering it).
- Add `CHECK` constraint: must match E.164 (`^\+[1-9]\d{6,14}$`) when not null.
- Backfill: existing values are GB numbers entered as freeform. Migration normalises any value starting with `07` → `+447...`, leaves already-E.164 values intact, and nulls anything else (handful of rows, safe).
- RLS already scopes `professionals` rows to the owner + admin; no change. Service-role reads in public server fns must continue NOT to select this column.

### 2. Server functions

- `dashboard-profile.functions.ts`: rename field in select, zod schema, return type, save payload. Zod becomes `z.string().regex(E164).nullable()`.
- `public-profile.functions.ts`: confirmed it never selects phone today — add an inline comment + a code-level allowlist so a future dev can't accidentally add it. (Belt-and-braces: add a TypeScript `Omit<…, "contact_phone">` on the public return type.)
- New validation rule in `publishProfile` (or the existing publish/activate path): reject if `contact_phone` is null. Returns a typed `MissingPhone` error the dashboard surfaces inline.

### 3. Dashboard UI

- `dashboard_.profile.tsx`:
  - Rename `Public phone` field → **"Contact phone"** with helper text: *"Used for account recovery and booking alerts. Never shown on your public profile."*
  - Replace freeform `<Input>` with a proper international phone field — `react-phone-number-input` (MIT, ~13kb, ships libphonenumber-js). Country selector + flag + live national formatting + E.164 storage. Wrapped in our shadcn `Field` so it matches the dark theme (custom `inputComponent` + custom `countrySelectComponent` that re-uses shadcn `Select` + `Input` styling — no library default CSS imported).
  - Default country = **GB** (most pros are UK today; selector still shows all 250+ countries).
  - Validate with `isValidPhoneNumber()` on blur; `data-invalid` + inline error.
  - Checklist item "Contact details" now requires phone AND email (today it's OR).
  - Publish button is disabled with tooltip "Add a contact phone first" when missing.

### 4. Public pages — explicit no-op guardrails

- Audit and confirm zero references to `contact_phone` / `public_phone` in:
  - `src/routes/pro.$slug.index.tsx`
  - `src/routes/c.$slug.tsx`
  - `src/routes/pro.$slug.enquire.tsx`
  - `src/routes/in.$location.tsx`
  - `src/lib/profile/public-profile.functions.ts`
  - any FeaturedProCard / search card
- Add a one-line ESLint-style code comment at the top of `public-profile.functions.ts`: *"NEVER select `contact_phone` here. Phone is internal-only."*

### 5. Memory

- Add `mem://policy/contact-channels`:
  - Phone is internal-only; never rendered publicly.
  - All comms go through the platform (in-app messages + email notifications today; push later).
  - SMS is Phase 3, transactional only (booking confirmed / reminder). WhatsApp is not in scope.
  - Email notifications use the existing pgmq queue infra.

## Out of scope

- The in-app client portal messaging UI (separate feature, separate plan).
- Twilio / SMS integration.
- Phone 2FA / OTP auth (Supabase phone auth wiring).
- WhatsApp Business API.
- Migrating the booking-notification email templates to include phone.

## Technical details

- Library: `react-phone-number-input` + bundled `libphonenumber-js`. Install via `bun add`.
- Storage shape: `text` column, format `+[country][subscriber]`, max 16 chars.
- Regex check: `^\+[1-9]\d{6,14}$` (E.164 max 15 digits + leading `+`).
- Display formatting on dashboard (read-only summary card): `formatPhoneNumberIntl(value)` → `+44 7911 123456`.
- Backfill SQL handles three cases: already starts with `+` → keep; starts with `07` and 11 digits → `'+44' || substring(value, 2)`; everything else → `NULL`.
- TypeScript: bump the public-profile return type to `Omit<DashboardProRow, "contact_phone">` so a future select-mistake fails at compile time.

## Files touched

- migration (rename + check constraint + backfill)
- `src/lib/profile/dashboard-profile.functions.ts`
- `src/lib/profile/public-profile.functions.ts` (comment + type guard only)
- `src/routes/_authenticated/_professional/dashboard_.profile.tsx`
- `src/components/forms/PhoneField.tsx` (new)
- `mem://policy/contact-channels` (new) + `mem://index.md` (entry)
- `package.json` (+ `react-phone-number-input`)
