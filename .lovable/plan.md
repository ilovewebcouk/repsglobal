# Operations hero — fix composition + lock REPs-logo rule

## What's wrong now
The current `src/assets/hero-operations-bg.jpg` centres the trainer/reception, so the right-side device cluster lands directly on top of the human focal point. That weakens the "real person in a real studio" narrative the photo is meant to carry.

## Changes

### 1. Re-generate the Operations hero backdrop
Use `imagegen--generate_image` (premium tier, 1920×1280) to produce a replacement with:
- **Composition:** trainer + reception desk anchored in the **left third** of the frame; right two-thirds = quieter studio depth (blurred equipment, warm rim-lit architecture, negative space) so the device mockup cluster lands in clean territory, not on the trainer.
- **Wardrobe:** trainer wearing a dark T-shirt with a visible **"REPs"** wordmark on the chest. For this shot, use a **small left-chest wordmark** (premium / staff-polo feel — reads as a real partner studio, not a billboard).
- **Same color grade / lens character as the for-pros hero:** cool blue-gray shadows, warm tungsten highlights, low key, cinematic depth of field, dusk light.
- **Subject:** trainer reviewing the day's schedule on a tablet at the reception desk of a premium boutique studio.

Upload via `lovable-assets` to replace `src/assets/hero-operations-bg.jpg.asset.json` (overwrite the existing pointer so the import in `features.operations.tsx` keeps working unchanged).

### 2. Save the REPs-logo rule to project memory
Add a new core memory line and a detailed memory file so every future trainer image follows the rule.

- **Core line (in `mem://index.md`):** "Any generated image of a trainer/coach MUST show a visible 'REPs' wordmark on their T-shirt/polo. Choose chest placement per shot (small left-chest for premium/editorial, centred for wide team/action shots)."
- **Detailed file (`mem://design/trainer-imagery`):** placement guidance (left-chest vs centred), color (white or brand orange on dark garments; dark on light garments), and the rule that the wordmark must read as a real embroidered/printed logo — never a floating overlay or watermark.

## Out of scope
- No changes to `PillarPage.tsx`, the device cluster position, overlays, H1, or CTAs.
- No new pillar pages (Visibility / Coaching / AI / Growth get their own images later).
- No changes to the for-pros hero image (existing trainer there is acceptable for now; we'll revisit when that page next gets touched).

## Files touched
- `src/assets/hero-operations-bg.jpg.asset.json` — replaced (new CDN asset)
- `mem://index.md` — append core rule
- `mem://design/trainer-imagery` — new memory file

## QA
After upload, screenshot `/features/operations` hero and verify: (a) trainer visible to the left of the device cluster, (b) "REPs" wordmark legible on the T-shirt, (c) overall grade still matches the for-pros hero.
