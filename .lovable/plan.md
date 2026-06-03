
# Premium "PT review" cover + thumbnail rebuild

## Direction

Forget the space-age reference grids — but keep the one thing that worked: **each thumbnail shows a snapshot/mock-up of both platforms side by side**, so it instantly reads as "someone has reviewed REPs vs this competitor."

The new bar is **"a top creator just reviewed these platforms"**: cinematic gym / personal-training environments shot like editorial photography, with the real REPs and competitor logos cleanly composited on top, plus a floating product snapshot of each platform's UI sitting in the scene. Scroll-stopping, premium, on-brand with the rest of the REPs site (dark, warm, confident — not neon sci-fi).

## What the AI generates vs what we composite

**AI generates (cinematic photoreal backdrop only — zero text, zero logos, zero UI):**
- Moody, premium gym / PT scene — rack of dumbbells under warm rim light, a coach mid-session, kettlebells on a polished platform, a barbell loaded on a rack with shallow depth of field, hands on a phone in a gym setting, a coach demonstrating form.
- Dark warm palette aligned with REPs tokens, brand orange as accent (rim light / wall glow), not the dominant colour.
- Strong contrast and depth so overlay elements read instantly even at thumbnail size.
- Prompts explicitly forbid: any text, any letters, any logos, any UI, any screens, any holograms, any "futuristic" sci-fi tone, any cartoonish styling, any fake brand marks.

**We composite on top (real assets, pixel-crisp, no AI involvement):**
- Real REPs wordmark (existing brand SVG) and real competitor logo (`src/assets/logos/*.svg`).
- **Real product snapshots of each platform's UI** — see "Product snapshots" below — framed inside a tilted laptop/phone mock-up bezel sitting in the scene, with a soft drop shadow so it grounds into the photo.
- Headline + subline in a downloaded display font (Anton / Bebas Neue), on a subtle dark gradient scrim.
- A simple, bold typeset "VS" between the two mock-ups.

No chips. No evidence bar. No energy slash. No feature pill row. Clean editorial review-thumbnail composition: gym photo + two product mock-ups + two logos + headline + subline.

## Product snapshots (the bit the user liked)

Each cover/thumbnail features two device mock-ups sitting in the gym scene:

- **Left mock-up — REPs:** a real screenshot of the existing REPs UI from the project (e.g. a captured frame of the locked `/pro/$slug` profile mock-up in `src/mockups/`, or the search/results screen). Captured via headless browser at retina scale, saved as a PNG, then composited into a tilted laptop or phone bezel.
- **Right mock-up — competitor:** a clean, current screenshot of the competitor's public-facing product page or app screen (publicly available marketing imagery only — same standard we already apply on the comparison pages). Composited into a matching bezel.

Both mock-ups use the same bezel style and the same tilt angle so they read as a fair head-to-head, not a hit piece. If a usable competitor screenshot cannot be sourced cleanly, fall back to that competitor's public hero/product image — never a fabricated UI and never an AI-generated screen.

## Two compositions per competitor (not just resized)

| Format | Size | Composition |
|---|---|---|
| **OG cover** | 1200×630 | Wide editorial layout: REPs mock-up left-of-centre, competitor mock-up right-of-centre, both tilted slightly inward, real logos floating above each, headline + subline along the bottom over a soft dark scrim. Gym backdrop fills the full frame. |
| **YouTube thumbnail** | 1280×720 | Bolder, simpler: two mock-ups slightly larger and lower in the frame, big typeset "VS" between them, oversized headline across the top. Designed to read at 320px wide. |

## Per-competitor scene + copy

| Competitor | Backdrop scene | Headline | Subline |
|---|---|---|---|
| Trainerize | UK gym floor — barbell on a rack, warm tungsten rim light, shallow DoF | TRAINERIZE vs REPs | Which platform gives UK PTs more? |
| My PT Hub | Coach with a clipboard beside a client, dumbbells racked behind | MY PT HUB vs REPs | Which is right for UK personal trainers? |
| PT Distinction | Close-up of hands logging a session on a phone, kettlebells out of focus | PT DISTINCTION vs REPs | Coaching depth vs full business platform |

Shared: dark warm palette, single brand-orange accent, editorial photoreal style, no recognisable faces in focus.

## Tooling

- **Backdrop generation**: `openai/gpt-image-2` via `/v1/images/generations`, `quality: "high"`, non-streaming, written directly to PNG. One backdrop per format per competitor (6 backdrops total) so cover and thumbnail aren't crops of the same image.
- **Product snapshots**:
  - REPs screen — Playwright/headless Chromium against the local dev preview at retina scale, captured from the existing in-project mock-ups.
  - Competitor screen — sourced from each vendor's publicly available marketing imagery (consistent with current comparison-page sourcing), saved into `/tmp/` for compositing only.
- **Composite**: Python + Pillow + librsvg (existing toolchain). Used purely for overlay: bezel + drop-shadow for each mock-up, place real SVG logos, paint dark scrim, typeset headline/subline, save final PNG.

## Files

**Regenerated in place (6 PNGs):**
- `src/assets/compare/reps-vs-trainerize-cover.png` (1200×630)
- `src/assets/compare/reps-vs-trainerize-thumbnail.png` (1280×720)
- `src/assets/compare/reps-vs-mypthub-cover.png` (1200×630)
- `src/assets/compare/reps-vs-mypthub-thumbnail.png` (1280×720)
- `src/assets/compare/reps-vs-pt-distinction-cover.png` (1200×630)
- `src/assets/compare/reps-vs-pt-distinction-thumbnail.png` (1280×720)

**No code changes** — route files already wire `og:image` / `twitter:image` to the `-cover.png` paths. New PNGs land at the same filenames; metadata is already correct.

**Unchanged:** `VsHeroCard.tsx`, `HeadToHead.tsx`, `competitor-data.ts`, all routes, tokens, radius, navigation, backend, auth, pricing.

## QA per asset (mandatory before delivery)

1. Inspect each PNG at full size + at 320px wide (YouTube feed scale).
2. Verify: no AI-generated text anywhere in the backdrop, no fake logos, no garbled UI inside the mock-ups, no sci-fi/space-age tone, scene reads as gym/PT.
3. Verify: real REPs + competitor logos crisp, correctly coloured, not stretched.
4. Verify: both product mock-ups are real, readable at thumbnail scale, and sit naturally in the scene (matched tilt, matched bezel, grounded drop shadow).
5. Verify: headline + subline fully on-canvas, legible at 320px.
6. Verify: cover and thumbnail are visibly different compositions, not crops.
7. If any asset fails, retune the prompt or recomposite — iterate until all 6 pass.

## Out of scope

No metadata wiring changes, no new routes, no in-page `VsHeroCard` changes, no chips / evidence bars / energy slashes, no deletion (old generic JPGs already gone).
