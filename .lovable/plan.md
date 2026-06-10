## Goal

Replace the current portrait image in section 4 of `/about` ("A new kind of register") so it sits in the same photographer lookbook as `Built for Independence` and the new About hero — instead of feeling like a different shoot.

Target asset: `src/assets/about/heritage.jpg.asset.json` (rendered at `aspect-[4/5]` portrait, ~1024×1280).

## Scene direction

- **Subject:** one calm, credible fitness professional (different person from the About hero so the page doesn't repeat the same face — e.g. mid-30s male coach with a quiet, considered look). Mid-consultation / post-session moment: standing on an urban pavement at dawn with a clipboard/phone in hand, or hands-on-hips in a quiet listening posture. Reads instantly as "professional", not "mid-rep".
- **Wardrobe:** charcoal heather REPS performance tee + technical joggers + trainers — same wardrobe language as About hero & Independence.
- **Backdrop:** same Independence universe — dark cladding + glass curtain wall, low sun raking down a wet pavement, soft city bokeh receding. Portrait crop tighter than the hero (more architecture above the head, less negative space).
- **Light:** low golden-hour sun side/back, warm amber rim on shoulder/hair/jawline, deep architectural shadow filling the rest of the frame.
- **Composition:** 4:5 portrait, subject anchored slightly right, architectural negative space top-left. Tight enough that the chest logo is legible at the rendered size.
- **Finish:** muted film palette, deep blacks, warm amber highlights only on rim/pavement, realistic textile, shallow DoF, soft 35mm grain. No graphic overlays, no extra text, no extra logos.

## Logo

- Source of truth: `src/assets/brand/logo.svg` (the header mark, NOT the wordmark).
- Placement: small **left-chest** embroidery (wearer's left).
- Execution: pure-white embroidery thread, visible stitch texture, follows fabric folds, picks up rim light subtly. Exact `logo.svg` letterforms. ALL CAPS. Always white.

## Process

1. Generate 4:5 base image with a completely blank upper-left-chest area on the tee (no typed logo, no placeholder).
2. Composite real `logo.svg` (rendered to PNG) onto the chest via `imagegen--edit_image` as embroidered patch — fabric warp, stitch detail, white thread.
3. If stitch quality isn't world-class on the first pass, run a tightening edit pass (smaller, cleaner, exact letterforms).
4. Upload final via `lovable-assets create --file ... --filename heritage.jpg` and overwrite `src/assets/about/heritage.jpg.asset.json`.
5. QA on `/about` against About hero + Independence — must read as the same photographer, same morning, different frame.

## Out of scope

- No copy, layout, section-order or other-asset changes on `/about`.
- No changes to About hero, Independence, or any other route.
