## Problem

`regenerateAvatar` (and `validateAvatar`) in `src/lib/profile/avatar-ai.functions.ts` dynamically import `jimp` and call `Jimp.read(...)` inside the server function. Jimp's PNG decoder pulls in `pngjs` → `pako`. On Cloudflare workerd (our server runtime), `pako`'s `Inflate` class gets bundled in a way that calls it as a plain function, producing:

> Class constructor Inflate cannot be invoked without 'new'

That bubbles back through the server-fn RPC and the dashboard surfaces it as the red toast in the screenshot. This started the moment we added the post-AI face-detect + crop pass.

This is a runtime-environment incompatibility, not a logic bug. Jimp is not Worker-safe.

## Fix (one file: `src/lib/profile/avatar-ai.functions.ts`)

1. **Drop all `Jimp` usage from the server functions.**
   - Remove the dynamic `await import("jimp")` calls and the `classifyImageForFaceBox` / `cropToPortraitJpeg` Jimp helpers from both `validateAvatar` and `regenerateAvatar`.
   - The AI prompt already enforces a square 1024px headshot composition; we save the model output (or the raw upload for validate) directly to storage as JPEG.
   - `validateAvatar` keeps its model-based moderation/classification call — only the Jimp face-box / crop step is removed; if classification rejects the image, behavior is unchanged.

2. **Keep the regen quality work intact.**
   - Pro model, identity-lock prompt, variation tokens per `attempt`, warm-light/soft-bokeh language all stay exactly as they are — only the post-process crop pass is removed.

3. **Re-do framing on the client (already in place).**
   - Direct uploads continue to use the existing browser-side square crop in the dashboard profile flow, so manual uploads stay 1:1 framed.
   - AI output is already square from the model, so no extra crop is needed for parity.

4. **No other files change.**
   - `dashboard_.profile.tsx`, `UserAvatar`, `UserAccountMenu`, initials helper — all unchanged.
   - No new dependencies. We are removing a server dependency, not adding one.

## Why not swap Jimp for a Worker-safe lib

`@cf-wasm/photon` or `wasm-vips` would work but adds a meaningful WASM bundle and a second code path for a feature (server-side face-crop) the AI prompt already handles. Not worth it for this pass. If we later need true server-side image processing (e.g., for arbitrary user uploads), that's a separate decision.

## Out of scope

- Changing the AI model or prompt.
- Re-introducing server-side face detection in any form.
- Touching the upload/crop flow on the client.
- Any UI changes to the dashboard, topbar avatar, or directory.

## Verification

- Trigger "Regenerate" on `/dashboard/profile` — should complete without the red toast and save a square portrait to storage.
- Trigger a manual upload — should still save a 1:1 cropped JPEG (client-side crop unchanged).
- Topbar + sidebar avatars continue to show identical initials when no image is set.
