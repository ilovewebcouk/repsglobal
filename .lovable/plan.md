# Avatar AI validation, auto-crop, and opt-in regenerate

Hard reject anything that isn't a real headshot, auto-crop to a centered square on the face, and offer an optional "Generate a professional version" button as a clearly-labelled alternative. New uploads only — existing avatars untouched.

## User-facing flow

1. Pro clicks **Change photo** on `/dashboard/profile`.
2. Client-side pre-checks (instant, free):
   - Reject SVG by mime / extension.
   - Reject files > 8MB or < 200×200px.
3. File uploads to the `avatars` bucket as a temp path (`{userId}/pending-{ts}.{ext}`).
4. New server fn `validateAndProcessAvatar` runs:
   - Calls Lovable AI (`google/gemini-3-flash-preview`, vision + structured output) to classify the image.
   - If **not a valid headshot** → delete temp file, return `{ ok: false, reason }`. UI shows a hard-reject dialog with the reason ("This looks like a logo", "Group photo — we need a solo headshot", "Face not clearly visible", etc.) and a **Try again** button. No fallback path.
   - If **valid** → use the returned face bounding box to crop server-side to a centered square (with ~30% padding around the face), re-encode as JPEG (max 1024×1024, quality 88), upload to final path `{userId}/avatar-{ts}.jpg`, delete the temp file, sign a 1-year URL, write to `profiles.avatar_url`.
5. On success, show the cropped result with two buttons:
   - **Keep this photo** (default — done).
   - **Generate a professional version** (opens regenerate dialog — see below).

## AI validation contract

Single Lovable AI call, structured output via `Output.object`:

```ts
{
  isHeadshot: boolean,        // true only if: single human face, photograph, front-facing-ish, face visible
  rejectionReason: string | null,  // short human-facing reason when isHeadshot=false
  rejectionCategory: "logo" | "illustration" | "group" | "full_body" | "face_obscured" | "low_quality" | "not_a_person" | null,
  faceBox: { x: number, y: number, width: number, height: number } | null,  // normalized 0-1, relative to original image
  qualityScore: 1 | 2 | 3 | 4 | 5,
}
```

System prompt makes the bar explicit: photograph of one real human, face clearly visible, no logos / illustrations / group shots / heavily-obscured faces (sunglasses + hat together = reject).

## Opt-in "Generate a professional version"

Clearly-labelled dialog, not silent enhancement. Two-step:

1. User clicks the button → confirmation modal explains: *"We'll create an AI-generated portrait based on your photo. This is clearly a re-rendered image — use it only if you're comfortable with that. Your original stays available."*
2. On confirm, call new server fn `regenerateAvatar`:
   - Sends the cropped headshot to `google/gemini-3.1-flash-image-preview` (image edit) with prompt: clean professional studio portrait, neutral background, keep facial identity, no text/logos, REPS wordmark stitched onto polo/T-shirt (per `mem://design/trainer-imagery`).
   - Returns base64 PNG, uploads to `{userId}/avatar-ai-{ts}.png`, signs URL.
3. Modal shows **side-by-side**: Original cropped vs AI-generated. Buttons: **Use AI version** / **Keep original** / **Try again**.
4. The AI version, if used, is the one written to `profiles.avatar_url`. Original cropped version stays in storage (not deleted) so they can revert.

Tagged in DB with a new `profiles.avatar_is_ai_generated boolean` flag (default false) so we can later surface a small "AI portrait" indicator internally if we ever want to — not exposed publicly in v1.

## Files

**New**
- `src/lib/profile/avatar-ai.functions.ts` — `validateAndProcessAvatar({ path })`, `regenerateAvatar({ sourcePath })`. Both protected with `requireSupabaseAuth`. Server-side cropping via `sharp`-free pure-JS (use the existing image pipeline — if none, do crop with `@napi-rs/canvas` alternative; **fallback: use `Jimp`** which is pure-JS and Worker-compatible). Lovable AI calls go through the existing AI gateway pattern (see `connecting-to-ai-models-tanstack`).
- `src/components/dashboard/AvatarRejectionDialog.tsx` — shadcn Dialog showing the rejection reason + Try again.
- `src/components/dashboard/AvatarRegenerateDialog.tsx` — confirm → side-by-side preview → choose.

**Migration**
- Add `profiles.avatar_is_ai_generated boolean not null default false`.

**Edited**
- `src/routes/_authenticated/_professional/dashboard_.profile.tsx` — replace the current `avatarMutation` flow: upload to temp path → call `validateAndProcessAvatar` → on reject show dialog, on accept refresh profile + show "Generate AI version?" CTA next to the avatar.
- `src/lib/profile/dashboard-profile.functions.ts` — `updateMyAvatar` stays for the "remove" case but the upload-and-set logic moves into `validateAndProcessAvatar`.

## Worker-runtime notes (server-runtime constraints)

- `sharp` is NOT Worker-compatible — do not use it. Use `Jimp` (pure JS) for cropping/resizing, which works in the workerd runtime.
- Lovable AI image responses come back as base64 PNG (per `ai-image-generation`) — non-streaming is fine here since this is a one-shot generation called from a server function returning JSON. Use `stream: false`.

## What's explicitly out of scope (v1)

- Retroactive scanning of existing avatars.
- Auto-enhance (lighting/sharpness touch-ups) without regeneration — too easy to abuse, ship later if asked.
- Public "AI portrait" badge on profiles.
- Admin manual override of rejections (can add later if false-positive rate is high).

## Cost / latency expectations

- Validation call: ~1–2s, fractions of a cent per upload.
- Crop + re-encode: <500ms server-side.
- AI regenerate: ~5–10s, ~1–3 cents per call. Only runs when user explicitly clicks.

## Risks

- **False positives** on the validation model (rejecting genuine headshots). Mitigate by writing a clear rejection reason and a one-click retry. If we see >5% false-reject rate in practice, add an "admin review" path.
- **Identity drift** on AI regeneration — the model may change facial features. Mitigated by the explicit side-by-side compare + opt-in, not silent. Worst case the user keeps the original.
