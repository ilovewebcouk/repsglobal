## What "profile photo" enforces today

Two layers gate an upload:

1. **Copy** (`ProfilePhotoPanel.tsx` 352, 411, 474; `dashboard_.website.tsx:561`; help article) says "Real headshot only".
2. **Gemini gatekeeper** (`src/lib/avatar/validate.shared.ts`):
   - Prompt rejects anything not "head-and-shoulders or similar portrait".
   - `MIN_FACE_AREA = 0.15` — a head-and-torso (chest/waist up) mid-shot sits at ~0.06–0.12 and fails today.

BD backfill routes through the same `decideAvatar` — one bar, one file to change.

## Plan — loosen to "head-and-shoulders OR head-to-torso"

1. **Prompt** — change the framing rule to *"head-and-shoulders or head-to-torso (chest/waist up) portrait — NOT a full-body, distant, or group shot"*. All other rules unchanged (one person, front-facing, in focus, not obscured, clean background, no logos/illustrations).
2. **Threshold** — lower `MIN_FACE_AREA` from `0.15` → `0.07`. Admits mid-shots; still rejects true full-body (~0.005–0.02) and distant/group shots.
3. **Reject copy** — update the "face too small" message to *"…head-and-shoulders or waist-up portrait where your face is clearly visible"*. Internal `full_body` category name stays.
4. **User-facing copy** — swap "Real headshot only" → "Real photo of you (head-and-shoulders or waist-up)" in:
   - `src/components/dashboard/ProfilePhotoPanel.tsx` (lines 352, 411, 474)
   - `src/routes/_authenticated/_professional/dashboard_.website.tsx` (561)
   - `src/content/help/articles/profile-photo.tsx` (line 18 body copy; tags stay)

## Stays strict (unchanged)

- One real person, front-facing, in focus, face not obscured.
- Background rules (no logos, storefronts, busy text).
- `MIN_QUALITY = 3` sharpness/lighting bar.
- Face bounding box still required — no crop without a locatable face.

## Out of scope

- Re-validating previously accepted/rejected avatars.
- Changing the output crop (still centred on `faceBox`; a torso shot crops tighter to the face for the round avatar).
- New "action shot" / gallery surface — separate feature.

## Verify

Upload three test images: tight headshot (passes), chest-up shot (now passes — previously rejected as `full_body`), full-body distant shot (still rejects).
