# Fix avatar upload crash (Inflate error)

## What's actually wrong

The "Class constructor Inflate cannot be invoked without 'new'" error comes from the Jimp image library, which is incompatible with our server runtime. The previous fix removed it from the **AI regenerate** path — but the **upload** path still uses it: after the AI validates your photo, the server tries to crop it with Jimp (`processAvatar` in `src/lib/profile/avatar-ai.functions.ts`, line 233) and crashes every time.

## The fix

Move the crop into the browser, where it's fast and reliable — no server-side image decoding at all.

1. **Client-side crop** (`dashboard_.profile.tsx`): after AI validation returns the face box, crop the original photo in the browser with a canvas using the exact same framing math as today (2.0× padding around the face, face centred ~38% from the top, square, max 1024px, JPEG q88). The browser already has the file in memory.
2. **Upload the cropped JPEG directly** to the final storage path (`{userId}/avatar-{timestamp}.jpg`), then commit it as today.
3. **Delete `processAvatar`'s Jimp code**: replace it with a tiny temp-file cleanup (delete the pending upload after the final image is committed) — no image decoding on the server.
4. **Remove the `jimp` dependency** from the project entirely so this class of error can't come back.

Nothing else changes: AI validation gatekeeping, the rejection messages, the AI regenerate flow, and the commit/signing logic all stay exactly as they are.

## Verification (before claiming it's fixed)

- Confirm zero references to Jimp remain anywhere in the codebase.
- Confirm the build passes.
- Exercise the full upload flow end-to-end in the preview as the demo pro (upload → validate → crop → commit) and confirm the photo saves with no red toast, plus check server logs for any Inflate/Jimp errors.

## Technical details

- Crop math ported 1:1 from the current server implementation (face box → square side = max(fw,fh)×2.0, clamped to image bounds, vertical shift so face centre sits at 38%).
- Canvas export via `canvas.toBlob("image/jpeg", 0.88)`; resize to 1024×1024 when larger.
- Temp-file cleanup folded into the commit step (server-side, admin client) so no orphaned `pending-*` files accumulate.
- Files touched: `src/lib/profile/avatar-ai.functions.ts`, `src/routes/_authenticated/_professional/dashboard_.profile.tsx`, `package.json` (remove jimp).
