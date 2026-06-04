
# Growth pillar — photo hero, fresh subject

Final pillar in the set. Match Coaching/AI/Visibility/Operations.

## 1. Generate `src/assets/hero-growth-bg.jpg`

Premium tier, 1920×1280, same cinematic grade (cool blue-grey shadows, warm tungsten highlights, dusk light, shallow DoF, 35mm f/2).

**Subject — keep the diversity rotation** (so far: white male, white male, Black female, South-Asian male):
- A **mixed-race / Latina female studio owner, early 30s**, standing confidently in the doorway of her boutique studio at dusk, arms loosely folded or one hand on the doorframe. Reads as the "owner who just had her best month" — calm, in command, mid-conversation pause.

**Composition:** subject anchored in the **right third**, left two-thirds = quiet street-at-dusk depth (warm shop-window glow behind her, soft bokeh of city lights, clean negative space for headline text).

**REPs branding (both):**
- **"REPS"** ALL CAPS, white embroidery, small left-chest on a charcoal performance polo or zip-up.
- A defocused **"REPS"** wall mark / window decal on the studio glass behind her — frosted vinyl, ALL CAPS, softly out of focus.

**Narrative cue:** a faint warm orange spill from the studio interior (suggests "lights on, business open, momentum") — but no on-screen UI, no chart props, no phone-in-hand. Owner, not operator.

Upload via `lovable-assets create` → write `src/assets/hero-growth-bg.jpg.asset.json`.

## 2. Rewrite `src/routes/features.growth.tsx`

- Drop `InsightsMockup` import + `visual` prop.
- Add `heroLead`, `heroAccent`, `heroImage`, `og:image`:
  - `heroLead`: **"Not just a dashboard."**
  - `heroAccent`: **"The single move to grow your business this month."**
  - (Echoes the page's existing positioning — "Monday-morning card, not a dashboard you have to read.")

Press marquee renders automatically via `FeatureGroupLayout`.

## 3. QA

Screenshot `/features/growth`:
- Subject visible right, copy clean left.
- "REPS" ALL CAPS on polo + window/wall, both legible.
- Subject is NOT a white male, Black female, or South-Asian male — rotation completes.
- Hero grade matches the other four heroes.
- Press marquee renders.

Up to 2× regenerate if framing/REPS spelling drifts.

## Out of scope

- Any layout, copy, feature-grid, or CTA changes below the hero.
- Other pillars (already done).

## Files touched

- `src/assets/hero-growth-bg.jpg.asset.json` — new
- `src/routes/features.growth.tsx` — hero swap + og:image, remove `InsightsMockup` import
