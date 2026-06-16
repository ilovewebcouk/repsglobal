## Goal

Get all 390 `bd_member_seed` rows into the live directory **now** so you can see real profiles, click into them, and start wiring any fields that aren't yet connected. No "claim" / "activate" language anywhere — they're treated as existing REPs members on a new platform.

## The model (locked from previous turn)

- **Activated by default.** Each seed row becomes a real `auth.users` + `professionals` + `profiles` triplet.
- **`primary_profession = NULL`** → label everywhere = **"Fitness Professional"**.
- **`identity_status = 'pending'`** → unverified badge, shop-front / enquiries / services / education locked.
- **Photo:** use approved BD photo (124 rows) if present, else monogram with initials (no broken images).
- **Listed in:** main directory + `/in/$city` pages. **Not listed in** `/professions/$profession` (no profession yet).
- **`noindex`** only on profiles that are *both* unverified AND have no bio/photo. The other ~260 (have bio or photo) stay indexable.
- **Sign-in:** users hit `/auth`, use "Forgot password" → set password → land in dashboard. No invite tokens, no activation ceremony. The welcome email is out of scope for this step (separate launch-day email task).

## What we have today

- `bd_member_seed`: 390 rows, all with email, 384 with city, 390 with lat/lon, 174 with about_me, 110 with quote, 124 with approved photo, 165 missing photo, 101 rejected photo.
- `professionals` table has every column we need (`primary_profession`, `identity_status`, `slug`, `city`, `country`, `bio`, `headline`, socials, `public_email`, `website`, `is_published`).
- `bd_migration` table exists for tracking but is empty.
- Admin migration page lives at `/admin_/migration` with stats UI already wired (`getBdMigrationStats`).

## Plan

### 1. One migration: add the seeding RPC

New `SECURITY DEFINER` function `public.seed_bd_member_into_directory(_bd_member_id bigint)` that, given a seed row:

1. Creates a `auth.users` row via the admin path (called from the server fn, not SQL — see step 2). SQL function just handles the public-schema inserts given a `_user_id`.
2. Inserts/updates `profiles` (full_name = "First Last", avatar_url = approved photo URL or NULL).
3. Inserts `professionals` with:
   - `slug` = `slugify(first + last)` with numeric suffix on collision
   - `bio` = `about_me` (truncated to column limit) or NULL
   - `headline` = `quote` (truncated) or NULL
   - `city`, `country`, social_* fields, `website`, `public_email = email`
   - `primary_profession = NULL`, `primary_title_slug = NULL`
   - `identity_status = 'pending'`, `verification_status = 'unverified'`
   - `is_published = true`
   - `online_available = false`, `in_person_available = true` (per your earlier note)
   - `specialisms = '{}'`, `languages = '{}'`
4. Inserts one `professional_locations` row (primary) from `city / zip_code / lat / lon / country_ln`.
5. Adds `professional` role to `user_roles`.
6. Inserts a `bd_migration` row tracking the link (`bd_member_id → rep_user_id`, status = `seeded`).

Plus a small helper `slugify_unique(text)` that returns a free slug.

### 2. One server function: `seedBdDirectory` (admin only)

`src/lib/admin/bd-seed.functions.ts`:

- `requireSupabaseAuth` + `has_role(_role: 'admin')` gate.
- Loops `bd_member_seed` rows where no `bd_migration` row exists yet.
- For each row:
  - `supabaseAdmin.auth.admin.createUser({ email, email_confirm: true, user_metadata: { signup_kind: 'professional', full_name } })` — random password (they reset via /auth on first sign-in).
  - The existing `handle_new_user` trigger already creates `profiles` + `user_roles` + `professionals` shells from the metadata. 
  - Then call the new RPC to **fill in** the profile (bio, headline, city, socials, photo, location row) and write the `bd_migration` link.
- Batched in groups of 25 with a `dryRun` flag and per-row error capture.
- Returns `{ inserted, skipped, failed: [{ bd_member_id, email, error }] }`.

### 3. Photo wiring (no new storage work)

- Approved photos: `bd_member_seed.profile_photo_storage_path` is already populated. Set `profiles.avatar_url` to that path's public URL (avatars bucket); if the bucket is private, generate a signed URL on read. Confirm path layout during dry run.
- Rejected / missing: leave `avatar_url = NULL`. Every avatar consumer on the site already falls back to the `MonogramAvatar` — verify all 4 surfaces (directory card, FeaturedProCard, `/pro/$slug`, `/c/$slug`) render initials when null, and patch any that don't.

### 4. Directory / SEO behaviour

- `/in/$city` and main directory: include all 390 (they're `is_published = true`).
- `/professions/$profession`: filter is already `primary_profession = $slug` — 390 won't appear. No change needed.
- `noindex` flag: add `bd_seed_thin` boolean to `professionals` (true if no bio and no photo and `identity_status='pending'`). `/pro/$slug` head() adds `noindex` when true. Cleared automatically by an `UPDATE` trigger when bio or avatar is set, or identity is approved.

### 5. Admin UI hook-up

On `/admin_/migration`:
- Add a **"Seed directory"** panel next to the existing photo / claim stats.
- Buttons: `Dry run`, `Seed next 25`, `Seed all remaining`.
- Live stats: `390 total → 0 seeded → 390 remaining`; shows per-batch result + failures table.

### 6. Verify on the public site (after first batch)

Spot-check 5 profiles across the four states:
- Approved photo + bio + quote (best case — should look complete)
- Missing photo + bio (monogram + bio)
- Rejected photo + no bio (monogram + thin)
- City listing — confirm new pros appear on `/in/london` etc.
- Search the directory page for one by name.

Surface any field the existing components reference but the seed doesn't fill (services, specialisms, reviews count, response time) and flag for the next round — those stay empty by design (no fake data) but the UI must not break.

## Technical notes

- `handle_new_user` trigger already does the right things for `signup_kind='professional'` — we lean on it, then enrich.
- Slug collisions: ~390 unique names should be fine, but the helper handles dupes with `-2`, `-3` suffixes.
- `validate_professional_professions` trigger allows `primary_profession = NULL` and empty `specialisms` — confirmed.
- `tg_seed_shop_front_on_identity_approved` only fires on identity approval, so seed pros don't get a shop-front yet — correct.
- No emails sent during seeding (`email_confirm: true` bypasses Supabase confirmation; we won't trigger password-reset emails here — launch-day email is a separate task).
- `bd_migration` table reused for tracking; `status` extended to include `seeded`.

## Out of scope (separate tasks after seeding)

- Launch-day "Welcome to the new REPs" email blast.
- Identity verification flow for migrated pros (Gate 1).
- Certificate upload flow that sets `primary_profession` (Gate 2).
- Re-engagement email cadence for pros who don't sign in.
- Stripe legacy linking (already covered by existing `stripe-linking.functions.ts`).

## Deliverable

After this runs you'll see all 390 in the directory, can click through every `/pro/$slug`, and we'll have a clean list of any field the UI expects that we're not yet populating — which becomes the next build round.
