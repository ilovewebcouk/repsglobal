## Mirror the 124 AI-approved BD seed photos into our own storage

You're right — storing the photos ourselves is the correct call. URLs on `legacy.repsuk.org` are a dependency we don't control; the day that host disappears, the directory breaks. We mirror once, then we own them.

## What I'll do

A one-off server-side job, then a data update. No schema changes, no UI changes.

### 1. New admin-only server function: `mirrorBdSeedPhotos`

Lives in `src/lib/admin/bd-photos.functions.ts`. Gated by `requireSupabaseAuth` + `has_role(_, 'admin')` so only you (`cruz.pt@icloud.com`) can run it. Loads `supabaseAdmin` inside the handler (per server-function rules).

For each `bd_member_seed` row where `profile_photo_status='ok'` AND `profile_photo_src IS NOT NULL` AND `claimed_user_id IS NOT NULL` AND the linked `profiles.avatar_url IS NULL`:

1. Rewrite host: `repsuk.org/pictures/` → `legacy.repsuk.org/pictures/`.
2. `fetch()` the image. Skip + log on non-200, non-image content-type, or > 5 MB.
3. Detect extension from `Content-Type` (`image/jpeg` → `.jpg`, `image/png` → `.png`, `image/webp` → `.webp`).
4. Upload to the existing **`avatars`** bucket (private) at key `bd-seeds/{claimed_user_id}/seed-{bd_member_id}.{ext}` with `cacheControl: '31536000'`, `upsert: true`, correct `contentType`.
5. Get the public URL via `supabaseAdmin.storage.from('avatars').getPublicUrl(key)` and store it in `profiles.avatar_url`. (The `avatars` bucket is currently private — see step 3 below.)
6. Mirror the storage key into `bd_member_seed.profile_photo_storage_path` so we have a record of what was stored.
7. Return `{ attempted, uploaded, skipped, failed, errors[] }`.

Runs in batches of 25 with `Promise.all` per batch; the whole job for 124 files should complete in a single invocation (~30–60s, within the 60s default timeout — I'll bump if needed).

### 2. Trigger it

You run it from the existing admin area (one button), or I invoke it once via `stack_modern--invoke-server-function` after deploy. I'll go with the latter unless you want a UI control — it's a one-shot.

The `tg_refresh_score_by_profile_id` trigger fires automatically on each `profiles.avatar_url` update, so quality scores recompute without a separate pass. The 124 pros gain +15 each and rise above the photo-less seeds.

### 3. Make the `avatars` bucket publicly readable

It's currently private. The directory needs `<img src>` to load without signed URLs, same as Katie Gibbs and the demo pros (which use static `/demo-avatars/...` paths). I'll flip `avatars` to public via `supabase--storage_update_bucket`. Upload/delete remain RLS-gated on `storage.objects` — only read becomes public, which is the correct posture for profile pictures.

If your workspace policy blocks public buckets (`cloud_block_public_buckets`), I'll fall back to issuing 1-year signed URLs at mirror time and re-signing via a nightly cron. I'll know within one tool call.

### 4. Sanity / verification

- Before the bulk run: dry-run on 5 rows, log results.
- After: `psql` check — count of `profiles` with `avatar_url LIKE '%/avatars/bd-seeds/%'` should be ~124, and re-screenshot `/find-a-professional` to confirm the swap.

## Files touched

- `src/lib/admin/bd-photos.functions.ts` — new server function (admin-only)
- `supabase--storage_update_bucket` — flip `avatars` to public (one tool call, no migration)
- One `supabase--insert` to set `profile_photo_storage_path` (optional bookkeeping — done inside the server function anyway)

## Out of scope

- The 266 BD seeds with no `profile_photo_src` ever — monogram stays. Correct.
- A user-facing "re-mirror" UI. One-shot job; if we ever need to re-run, I invoke the same function again — it's idempotent (`upsert: true`, `WHERE avatar_url IS NULL` guard).
- Image resizing / WebP conversion. The originals are already trainer-headshot-sized; not worth the complexity for a one-time mirror. Can revisit if avg file size surprises us.

Approve and I'll build it.