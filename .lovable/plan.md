## The problem

Right now the Website editor's "Hero image" field is just a URL text input. Trainers can paste any image — wrong shape, wrong size, low resolution — and the public `/c/$slug` hero ends up letterboxed or pixelated. The demo (Coach James) uses a **1080 × 1920 portrait (9:16)** shot, and we want every trainer's hero to match that spec.

## What "correct" looks like

Lock the hero to the demo spec everywhere:
- **Aspect ratio**: 9:16 portrait (enforced, not just suggested)
- **Output size**: 1080 × 1920 (re-encoded server-side)
- **Format**: JPEG, ~85% quality, ≤ 800 KB
- **Min source**: 1080 px on the short edge — smaller uploads are rejected with a clear message

## Three ways to set the hero

The editor will offer three tabs in one "Hero image" card, all producing the same locked 1080 × 1920 output:

1. **Upload** — pick a file (JPG / PNG / WebP / HEIC).
2. **AI generate** — describe the shot in one line; we generate it using their profile photo as the subject reference.
3. **Paste URL** — keep the existing field as a fallback (still re-processed to 1080×1920).

For every path, the user lands on the same **crop + preview step** showing the locked 9:16 frame before saving. No image bypasses the cropper.

### 1. Upload flow

- Drag-and-drop or file picker
- Client-side: validate type + min dimensions, then open the cropper locked to 9:16
- On confirm: re-encode to 1080×1920 JPEG in the browser (canvas), upload to a new `shop-front-hero` Storage bucket at `hero/{user_id}/{timestamp}.jpg`, save the public URL into `shop_fronts.hero_image_url`

### 2. AI generate flow

- One-line prompt input (e.g. "coaching a client through a deadlift, gym setting, golden hour")
- We send the prompt + their profile photo to `google/gemini-3.1-flash-image` (Nano Banana 2) via the AI Gateway so the generated hero **looks like them**, not a stock face
- A locked system prompt enforces: full-body or 3/4 portrait, 9:16 framing, REPS-wordmark T-shirt rule from memory, no logos/text overlays, photographic
- Streaming preview → user picks "Use this" or "Try again" (up to 3 retries per save to keep costs sane)
- Same cropper step before save, same 1080×1920 output, same bucket

### 3. Paste URL (kept)

- Existing input stays as a fallback
- On save, server fetches the URL, validates dimensions, re-encodes to 1080×1920, re-hosts in our bucket (so we're not hot-linking external images that can disappear)

## Public page treatment

`/c/$slug` already uses `coach.heroImage` in two places (lines 804 and 1653 in `src/routes/c.$slug.tsx`). No layout change — once every hero is 1080×1920 they'll all crop cleanly into the existing hero frame. Add `loading="eager"`, `fetchpriority="high"`, and an explicit `width`/`height` for LCP.

## Out of scope (for now)

- Multiple hero variants per breakpoint (one master 1080×1920 covers it)
- Video heroes
- A separate "About" image upload (currently mirrors hero / avatar — leave that alone)

---

## Technical section

**Storage**
- New public bucket `shop-front-hero` via `supabase--storage_create_bucket`
- RLS on `storage.objects`: owner can insert/update/delete under `hero/{auth.uid()}/...`; world-readable SELECT
- 2 MB upload cap enforced server-side

**Client cropper**
- Add `react-easy-crop` (~15 KB) — locked `aspect={9/16}`, no free-form
- Canvas re-encode to 1080×1920 JPEG before upload — no server image processing needed
- HEIC: convert via `heic2any` only if Safari upload detected

**New server functions** (`src/lib/shop-front/hero.functions.ts`)
- `uploadHeroFromBlob({ blob })` — `requireSupabaseAuthWithImpersonation`, writes to bucket, returns public URL
- `generateHeroFromAi({ prompt })` — calls Lovable AI Gateway `/v1/images/generations` with `google/gemini-3.1-flash-image`, passes their `profiles.avatar_url` as a reference image in `messages[].content` (multimodal input shape), streams partial frames back via a server route `src/routes/api/shop-front/hero-generate.ts` (not `createServerFn`, because we need to stream). Final PNG is returned as `{ b64 }` so the client can drop it into the cropper.
- `ingestHeroUrl({ url })` — server-side fetch + Sharp-free re-encode (use `@cf-wasm/photon` or just the browser-side canvas path by sending URL → client downloads via CORS proxy if needed)

**Editor UI** (`src/routes/_authenticated/_professional/dashboard_.shop-front.tsx`)
- Replace the single hero `TextInput` (~line 100-130) with `<HeroImageEditor value={hero} onChange={setHero} avatarUrl={...} />`
- New component in `src/components/dashboard/HeroImageEditor.tsx` with Tabs (Upload / AI / URL) + cropper modal
- Show locked-spec helper text: "Portrait 9:16 · 1080 × 1920 · saved automatically"

**AI cost guardrails**
- Rate-limit `generateHeroFromAi` to 5/hour per user (Supabase RPC counter)
- Default model `google/gemini-3.1-flash-image` (cheapest pro-quality); fall back to `google/gemini-3-pro-image` only on explicit "higher quality" toggle

**Migration**
- `shop-front-hero` bucket + policies
- Backfill: leave existing `hero_image_url` values alone — they'll be re-processed next time the trainer opens the editor and re-saves

**Files touched**
- `src/components/dashboard/HeroImageEditor.tsx` (new)
- `src/lib/shop-front/hero.functions.ts` (new)
- `src/routes/api/shop-front/hero-generate.ts` (new — streaming route)
- `src/routes/_authenticated/_professional/dashboard_.shop-front.tsx` (swap input for editor)
- `src/routes/c.$slug.tsx` (add `width`/`height`/`fetchpriority` to two `<img>` tags)
- New migration for storage bucket + RLS
