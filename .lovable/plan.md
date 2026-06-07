# /specialisms hero — fix v2

Image is great. Composition + overlay are the problem. The foreground kettlebell coach sits dead-centre/left, so the headline and CTA stack land on top of her face, and the overlay stack is so heavy you lose the gym entirely. Fix both, then QA against the colour heroes.

## 1. Regen the image — same scene, subject pushed right

Use `imagegen` (premium) to a NEW file (`src/assets/specialisms-hero-v2.jpg`) so v1 stays revertable. Prompt re-uses the exact contents of the current hero — same coach, same client, same power rack, same Pilates reformer, same shelves, same warm tungsten light, same REPS wordmark on the polos — but re-blocked so the **left ~38% of the frame is clean room** (high-ceiling window light, soft bokeh, no humans, no equipment masses).

- Composition: kettlebell coach + client moved to the **right third**, in focus. Mid-ground spotter + power rack centre-right. Pilates reformer + oak shelves far right.
- Left third: empty training floor + window light + a hint of orange ambient bounce. This is where the copy column lives.
- Aspect 21:9, 1920×832, same filmic grain / Form Athletica energy. REPS wordmark ALL CAPS on both polos.
- Upload via `lovable-assets`, new `.asset.json`, swap import in `specialisms.tsx`. Delete the v1 `.jpg.asset.json` once swap is verified.

## 2. Lighten the overlay stack to match colour heroes

Reference: `/for-professionals` hero uses `bg-reps-ink/70 lg:/55` base + a single radial behind copy + an orange top glow. No horizontal `from-reps-ink/80` curtain. That's why the room reads.

Rewrite the overlay layers in `Hero()` (`src/routes/specialisms.tsx` lines 514–535):

- **Base wash:** `bg-reps-ink/55 lg:bg-reps-ink/35` → keep mobile readable, let lg breathe more (we now have empty left-third doing the work).
- **Copy-column darken:** keep radial but anchor at `~18% 55%` and shrink: `radial-gradient(50%_75%_at_18%_55%,rgba(10,10,12,0.72),transparent_70%)`. On mobile: `radial-gradient(95%_75%_at_30%_45%,rgba(10,10,12,0.60),transparent_75%)`.
- **DELETE the horizontal seal** (`from-reps-ink/80 via-reps-ink/15 to-transparent`). This is what's flattening the photo.
- **Orange top glow:** keep, drop opacity a touch (`0.10`) so the room colour shows.
- **Floor seal:** keep as-is (anchors footer transition).

Net effect: left third reads as a darkened editorial card; right two-thirds reads as a real gym. Matches the overlay weight of for-professionals / features.* heroes.

## 3. QA pass (mandatory, in this turn)

After the swap:
1. `browser--screenshot` `/specialisms` at desktop (1440) and mobile (390).
2. Crop the hero, verify:
   - Coach + kettlebell fully visible, **not** under the headline.
   - Pilates reformer + shelves visible.
   - Headline / sub / CTAs sit on the clean left third with comfortable contrast (no text on faces).
   - Overlay density matches `/for-professionals` hero on a side-by-side.
3. If anything fails, iterate the prompt (one regen max) or nudge the radial position. Don't ship with text-on-face.

## Out of scope
- No copy changes, no section reordering, no card reintroduction, no nav changes.
- v1 image asset stays in CDN (immutable) — only the pointer file is replaced.

## Files touched
- `src/assets/specialisms-hero-v2.jpg.asset.json` (new)
- `src/assets/specialisms-hero.jpg.asset.json` (deleted after swap verified)
- `src/routes/specialisms.tsx` (import + overlay rewrite lines ~35 and ~514–535)

## Acceptance
- Coach + room clearly visible.
- Zero text overlapping any human face or piece of equipment.
- Overlay weight indistinguishable from `/for-professionals` hero on a side-by-side.
- Audit clean.
