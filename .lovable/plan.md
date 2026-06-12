# Server-side avatar crop + 4 MB cap + 512 px min + initials fallback

## What changes

**1. Move cropping to the server**
- Add a new `processAvatar` server function in `src/lib/profile/avatar-ai.functions.ts` that:
  - Downloads the uploaded temp file from the `avatars` bucket
  - Crops it to a square centred on the AI-detected face box, with ~60% padding around the face (same maths as the current client-side crop)
  - Resizes to 1024 × 1024 and re-encodes as JPEG, quality 88
  - Uploads the result to `{userId}/avatar-{ts}.jpg`
  - Returns the final path
- Use **Jimp** (pure-JS, Worker-compatible). Sharp/canvas don't run in the Cloudflare Workers runtime; Jimp does.
- Install: `bun add jimp`
- Authorise the path the same way `validateAvatar` does (must start with `{userId}/`).

**2. Simplify the client flow**
- In `dashboard_.profile.tsx` `handlePickAvatar`:
  - Step 1: upload original to `{userId}/pending-{ts}.{ext}` (unchanged)
  - Step 2: call `validateAvatar` (unchanged — hard-rejects non-headshots)
  - Step 3 (new): call `processAvatar({ tempPath, faceBox })` instead of cropping client-side
  - Step 4: call `commitAvatar` with the returned final path (unchanged)
- Delete the client-side `cropToSquareJpeg` helper.
- The "Cropping…" busy state still shows while the server is processing.

**3. Tighten size limits**
- Max upload size: **8 MB → 4 MB**.
- Minimum dimensions: **200 × 200 → 512 × 512** (matches the previous standard).
- Update the helper copy under the upload button to say: *"Real headshot only · JPG or PNG · min 512 × 512 · max 4 MB · we check uploads with AI to keep the directory trustworthy"*.
- Update the corresponding error toasts to reflect the new numbers.

**4. Initials fallback when no avatar**
- The shadcn `Avatar` already renders `AvatarFallback` (initials on orange) when no `avatar_url` is set — confirmed on the profile photo card and the live preview card. No change needed there.
- One small fix: the current fallback uses `(form.full_name || "?").slice(0, 2).toUpperCase()`. Switch to a helper that returns the first letter of the first and last word (e.g. "James Wilson" → "JW", "Cher" → "CH"), with `?` as the last-resort fallback. Apply in both fallback sites on this page.

## Technical notes

- All work is in `src/lib/profile/avatar-ai.functions.ts` (new server fn + Jimp import) and `src/routes/_authenticated/_professional/dashboard_.profile.tsx` (remove client crop, change limits, swap initials helper).
- No DB schema changes. No changes to any locked screens or other pages.
- Jimp adds ~400 KB to the server bundle but is the standard Worker-safe option; no native binaries, no `__dirname` issues.

## Verification before handing back

- Reproduce the full flow against a test user: upload a real headshot → confirm `pending-…` then `avatar-…jpg` (1024 px square) appear in storage, and `profiles.avatar_url` is updated.
- Upload a 6 MB photo → confirm it is rejected client-side with the 4 MB message.
- Upload a 300 × 300 photo → confirm rejected with the 512 × 512 message.
- Upload a logo → confirm hard-rejected by AI validation.
- Sign out / view a profile with no avatar → confirm initials render.
