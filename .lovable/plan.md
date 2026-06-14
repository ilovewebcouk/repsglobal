# Legacy Member Import — Staging Plan

Stage all 391 active members from the old `repsuk.org` CSV into a new `bd_member_seed` table, validate their profile photos with the existing Gemini gatekeeper, and stop. No `auth.users` rows, no claim flow, no emails — those come later when we're ready to launch.

## 1. Schema

New enum `bd_member_photo_status`: `pending | ok | rejected | missing | fetch_error`.
New enum `bd_member_claim_status`: `staged | invited | claimed | skipped`.

New table `public.bd_member_seed` (admin-only RLS, service_role full access):

- Identity: `bd_member_id` (PK from CSV), `email` (unique, lower+trim), `first_name`, `last_name`, `phone_raw`
- Location: `address1`, `address2`, `city`, `zip_code`, `country_ln`, `lat`, `lon`, `service_areas`
- Profile content: `about_me`, `quote`, `credentials`, `services_text`, `experience`, `years_active`
- Web/social: `website`, `instagram`, `linkedin`, `youtube`, `tiktok`, `twitter`
- Photo: `profile_photo_src` (legacy filename), `profile_photo_status`, `profile_photo_reject_category`, `profile_photo_reject_reason`, `profile_photo_storage_path`
- Commerce: `legacy_plan` (`founding` | `standard`), `legacy_billing_period` (`yearly` | `onetime`), `legacy_signup_at`, `legacy_last_login_at`
- Status: `claim_status` (default `staged`), `claimed_user_id`, `notes`
- `created_at`, `updated_at` (+ trigger)

`bd_migration` rows created in parallel: `target_tier='verified'`, `target_billing_period='annual'`, `status='pending'`.

## 2. Field mapping (locked)

| CSV column | Destination (on claim) | Notes |
|---|---|---|
| `first_name` + `last_name` | `profiles.full_name` | concat |
| `email` | `auth.users.email` | lower+trim, dedupe |
| `about_me` | `professionals.bio` | strip HTML |
| `quote` | `professionals.headline` | |
| `phone_number` | `professionals.contact_phone` | raw now, E.164 later |
| `city` | `professionals.city` | |
| `country_ln` | `professionals.country` | default `UK` if blank |
| `website` | `professionals.website` | |
| `instagram/linkedin/youtube/tiktok/twitter` | `social_*` | strip to handle |
| validated `profile_photo` | `profiles.avatar_url` + `face_box` | |
| `lat` + `lon` | `professional_locations` | seed on claim if sane |
| `primary_profession` | `professionals.primary_profession` | force `personal-trainer` |
| `specialisms` | `professionals.specialisms` | empty `{}`, prompt on claim |
| `credentials`, `services`, `experience`, `year` | kept in `bd_member_seed` only | claim wizard offers them back as textareas |
| `facebook`, `blog` | dropped | no REPs equivalent |
| `password`, `verified`, `is_subscription_active`, `seo_*`, `form_security_token`, `bd_security`, `cc_type`, `payment_method_id`, `ref_code`, `google_*`, `gmap`, `geo_state`, cover/logo | dropped | |

## 3. Importer (one-off server fn, admin-gated)

`importBdMembersCsv` — reads the uploaded CSV path, BOM-aware, lower+trim emails, dedupe by email keeping the highest `bd_member_id`, parses `YYYYMMDDHHMMSS` → `timestamptz`, maps `subscription_name` → `legacy_plan`/`legacy_billing_period`, upserts `bd_member_seed` + `bd_migration`. Idempotent on re-run.

## 4. Photo fetch + validate (separate server fn)

`processBdMemberPhotos` — for each `bd_member_seed` row with `profile_photo_status='pending'`:

1. Fetch `https://repsuk.org/pictures/profile/{filename}` (8 concurrent, per-request timeout, retries on transient errors).
2. 404 → `missing`; network error → `fetch_error`.
3. Run the **existing** Gemini gatekeeper from `src/lib/profile/avatar-ai.functions.ts` (no prompt changes). Same reject categories: `logo | illustration | group | full_body | face_obscured | low_quality | not_a_person | other`.
4. `ok` → upload to `avatars` bucket at `bd-migration/{bd_member_id}/profile.{ext}`, record path.
5. `rejected` → store category + model reason, never upload.

Resumable by status.

## 5. Admin summary

`/admin/bd-migration` — counts by `claim_status`, `profile_photo_status`, top reject reasons, CSV export of rejects so we can hand-review before launch.

## 6. Stop

No claim email, no claim page, no `auth.users` creation, no welcome email, no Stripe touch. Launch-day email + claim flow is a later phase.

## Out of scope (this phase)

Claim wizard, launch email send, parsing the `services` blob into `services` table rows, phone E.164 normalisation, country-scoped UI surfacing for non-UK members, cover/logo binaries.

## Technical notes

- Table grants: `service_role` ALL; `authenticated` SELECT only via admin policy (`has_role(auth.uid(),'admin')`); no `anon` access.
- Importer + photo fn live under `src/lib/admin/bd-migration.functions.ts`, both gated by `requireSupabaseAuth` + admin role check; `supabaseAdmin` loaded inside handlers.
- CSV ingestion: accept upload via existing admin uploader OR read from a path the admin uploads to a private bucket; confirm preferred ingestion path before build.
