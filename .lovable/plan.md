
# AI pillar — same cinematic photo hero, fresh subject

Match the Coaching/Visibility/Operations treatment on `/features/ai` with a hero that visually says "AI in the hands of a real coach," not stock-photo robotics.

## 1. Generate `src/assets/hero-ai-bg.jpg`

Premium tier, 1920×1280, same cinematic grade as the other three heroes (cool blue-grey shadows, warm tungsten highlights, dusk light, shallow DoF, 35mm f/2 feel).

**Subject — keep the diversity rotation going** (so far: white male × 2 / Black female; AI gets a different again):
- A **South-Asian male coach, late 20s/early 30s**, on the gym floor reviewing an AI-drafted programme on a tablet — soft orange glow from the screen lighting his face. Plate-loaded rack and a defocused client behind him.

**Composition:** coach anchored in the **right third** (matches `object-right` on lg), left two-thirds = clean negative space for the white/orange H1. Tablet held at chest height, angled so the screen casts a believable orange/amber ambient glow on his polo and jaw — the "AI is here, in the room" cue.

**REPs branding (both):**
- **"REPS"** ALL CAPS, white embroidery, small left-chest on a charcoal performance polo.
- A defocused **"REPS"** wall mark in the background (frosted vinyl or backlit signage) — same all-caps treatment.

**No on-screen UI text on the tablet** (avoid model garble). Just a warm orange glow leaking from the bezel — implies the AI without trying to render a real interface.

Upload via `lovable-assets create` → write `src/assets/hero-ai-bg.jpg.asset.json`.

## 2. Refactor `src/routes/features.ai.tsx`

Currently uses `FeatureGroupLayout` with `visual={<InsightsMockup />}` AND custom children sections. We keep the children (narrative cards, 14-item grid, mini-compare) untouched — only swap the hero.

Changes:
- Drop `InsightsMockup` import + `visual` prop.
- Add `heroImage`, `heroLead`, `heroAccent`:
  - `heroLead`: **"Not just AI features."**
  - `heroAccent`: **"An AI operating layer for your whole business."**
  - (This echoes the page's existing H2 narrative — reinforces, not duplicates.)
- Add `{ property: "og:image", content: heroAi.url }` to meta.

Press marquee renders automatically (FeatureGroupLayout already gates it on the photo-hero branch).

## 3. QA

Screenshot `/features/ai`:
- Coach visible right, copy clean left.
- Orange screen-glow reads as AI, not "guy on phone."
- "REPS" all-caps on polo + wall, both legible.
- Subject is NOT a white male and NOT a Black female (rotation working).
- Press marquee present under the hero. Narrative / grid / compare sections still intact below.

If the generated image lands wrong (head crop, screen-glow not believable, REPS mis-spelled), regenerate up to 2× with tightened prompt before falling back to a different angle.

## Out of scope

- Growth pillar (next turn).
- Narrative cards, 14-item AI grid, mini-comparison table, CTA — no copy or layout changes there.
- No changes to `FeatureGroupLayout` (already supports the photo-hero branch).

## Files touched

- `src/assets/hero-ai-bg.jpg.asset.json` — new
- `src/routes/features.ai.tsx` — hero swap + og:image, remove `InsightsMockup` import
