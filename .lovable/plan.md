# Unify the avatar pipeline

One validator, one threshold, one outcome. Whatever the dashboard rejects, the BD backfill rejects too — and when something fails, the card falls back to a monogram tile exactly like the dashboard does.

## The root cause (so we don't repeat it)

There are two validator modules today with two different prompts and two different acceptance bars:

- `src/lib/profile/avatar-ai.functions.ts` — used by `/dashboard/profile`. Stricter prompt ("must be a clear, frontal portrait"), and the dashboard UI rejects when `faceCoverage` is too small or `qualityScore < 3`.
- `src/lib/admin/bd-recrop.functions.ts` — built last turn for the BD backfill. Looser prompt (accepts "any human"), no `faceCoverage` floor, no `qualityScore` floor.

That's why Scott's full-body shot, Nerin's selfie-in-front-of-Gold's-Gym, and Matt's wide gym shot all passed BD ingest but would fail the dashboard validator if a pro tried to upload the same file today.

## The fix — one validator, called from both paths

### 1. Promote the dashboard validator to the canonical rule

Move `validateAvatar` + its threshold constants out of `src/lib/profile/avatar-ai.functions.ts` and into a single shared module: `src/lib/avatar/validate.functions.ts`. Both the dashboard and the BD backfill import from here. No more divergent prompts.

The shared module exports:

- `validateAvatarBytes(bytes, mime)` — Gemini call, returns `{ isHeadshot, faceBox, qualityScore, rejectReason }`.
- `MIN_FACE_COVERAGE = 0.18` and `MIN_QUALITY = 3` — the same numbers the dashboard already enforces.
- `decideAvatar(result)` — pure function returning `{ verdict: 'accept' | 'reject', reason?: string }`. Both code paths call this so the decision is identical.

### 2. Delete the duplicate validator in the BD recrop file

`src/lib/admin/bd-recrop.functions.ts` stops defining its own `validateBdAvatarBytes` and calls the shared `validateAvatarBytes` + `decideAvatar`. Same prompt, same thresholds.

### 3. BD recrop panel behaviour (already wired, just retuned)

`/admin/migration` → "BD avatar re-crop" → "Run batch":

- For each of the 124 `recrop_status='pending'` rows:
  1. Download the raw `bd-seeds/{uid}/seed-{bdId}.{ext}` source.
  2. Call the shared validator.
  3. `accept` → crop face-centred 1024² JPEG, upload to `avatars/{uid}/avatar-bdrecrop-…jpg`, update `profiles.avatar_url`, mark `recrop_status='ok'`.
  4. `reject` → **clear** `profiles.avatar_url` (set to `NULL`), record `recrop_status='rejected'` with the reason ("face too small", "not a frontal portrait", "quality too low", etc.).

### 4. Monogram fallback (already exists, just gets triggered)

`FeaturedProCard`, the profile header, and every other card already render `<Monogram name={fullName} />` when `avatar_url` is null. When we clear Scott's `avatar_url`, his card automatically flips to an "SL" tile in the same warm-ivory palette as the rest of the directory.

### 5. Admin queue for the rejects

Add a "Photos needing re-upload" section to `/admin/professionals` that lists every pro with `recrop_status='rejected'`. Columns: name, slug, reject reason, link to source image, "Email re-upload prompt" button. This is the list to chase down before launch.

## What you'll see after running

| Pro | Source photo | Result |
|---|---|---|
| Matt Jessup | Tight upper-body in blue polo | ✅ Cropped headshot |
| Rita Ibolya Molnar | Studio portrait, white shirt | ✅ Cropped headshot |
| **Scott Laidler** | Full-body, grey wall | ❌ Cleared → "SL" monogram tile |
| Nerin Govender | Selfie outside Gold's Gym | ❌ Cleared → "NG" monogram tile |
| ~60-80 others | Tight headshots | ✅ Cropped headshot |
| ~30-45 others | Wide / full-body / selfie | ❌ Cleared → monogram tile |

Estimated breakdown: ~80 accepts, ~45 rejects out of 124. Numbers confirmed once it actually runs.

## Files touched

- **New:** `src/lib/avatar/validate.functions.ts` — single shared validator + thresholds + `decideAvatar`.
- **Edit:** `src/lib/profile/avatar-ai.functions.ts` — re-export from the shared module; dashboard upload calls the shared `decideAvatar`.
- **Edit:** `src/lib/admin/bd-recrop.functions.ts` — drop its private validator, call the shared one. `rejectBdRecrop` already clears `avatar_url` — no change needed.
- **Edit:** `src/components/admin/BdRecropPanel.tsx` — pass the shared `decideAvatar` result through the existing accept/reject branches; show reject reasons in the live log.
- **Edit:** `src/routes/admin_.professionals.tsx` — add a "Photos needing re-upload" filtered section reading `bd_member_seed.recrop_status = 'rejected'` joined to `profiles`.
- **No migration needed** — `recrop_status`, `recrop_reason`, `recropped_at` columns already exist on `bd_member_seed`.

## Operational steps

1. Implement the unification (above).
2. Click **Run batch (25)** on `/admin/migration` once to sanity-check the first 25 rows and confirm accept/reject split looks right.
3. Click **Run batch (100)** to clear the remainder.
4. Spot-check `/in/london`, `/professions/personal-trainer`, and a couple of profile pages.
5. Triage the reject list at `/admin/professionals` → "Photos needing re-upload" before public launch.

## Technical notes

- The shared `validateAvatarBytes` runs inside a `createServerFn` so the Gemini API key never reaches the browser — same boundary as today.
- `decideAvatar` is a pure function (no I/O) so it can be unit-tested and reused on the client for the dashboard upload preview as well.
- Reject reasons get stored verbatim in `recrop_reason` so the admin queue shows *why* each photo failed without a re-run.
