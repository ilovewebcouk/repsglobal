
# Coaching pillar — match Operations/Visibility photo hero

Mirror the treatment we just shipped on `/features/operations` and `/features/visibility`, with a fresh subject so the heroes stop reading as "middle-aged white guys, three in a row."

## 1. Generate `src/assets/hero-coaching-bg.jpg`

Premium tier, 1920×1280, same cinematic grade as the other two heroes (cool blue-grey shadows, warm tungsten highlights, dusk / golden-hour light, shallow DoF).

**Subject — explicit diversity brief** (pick the strongest in generation; we'll regenerate if needed):
- A Black female coach, mid-30s, demoing a kettlebell or TRX cue to a client — OR
- A South-Asian male coach checking a client's tablet-based programme on the gym floor — OR
- An East-Asian female strength coach spotting a barbell lift.

**Composition:** coach anchored in the **right third** (so left two-thirds keep clean negative space for the white/orange H1 + sub + CTAs). Client(s) optional, slightly out of focus.

**REPs branding in-shot (both, where it reads naturally):**
- **"REPS"** wordmark (ALL CAPS, matching the site logo) on the coach's polo/T-shirt — small left-chest for this editorial framing.
- A **"REPS"** wall mark in the gym background (frosted vinyl on glass, painted concrete, or backlit sign) — same all-caps logo, softly defocused. This is the "REPs gym" cue the user asked for, like the operations shot.

Upload via `lovable-assets create` → write `src/assets/hero-coaching-bg.jpg.asset.json`.

## 2. Rewrite `src/routes/features.coaching.tsx`

Drop `ProgrammesMockup` / `visual` prop. Switch to the photo-hero branch of `FeatureGroupLayout`:

- `heroLead`: **"Not just programmes."**
- `heroAccent`: **"The coaching stack your clients actually stick to."**
- `heroImage`: `{ src: heroCoaching.url, alt: "REPs-verified coach delivering a session on the gym floor" }`

(Alternates if the user prefers a different angle — pick one in build mode:
- "Not just workouts." / "A coaching system that keeps clients showing up."
- "Not just an app." / "Programmes, nutrition and check-ins, wired to the client.")

Press marquee comes for free — `FeatureGroupLayout` already renders `<PressMarquee />` whenever the photo-hero branch is active.

## 3. QA

Screenshot `/features/coaching`:
- Coach visible to the right, copy column clean on the left.
- "REPS" (all-caps) legible on the garment AND in the background.
- Subject reads as **not** another white male — if generation drifts, regenerate (up to 2 retries) with a tighter ethnicity/gender prompt.
- Hero grade matches operations + visibility.

## Out of scope

- AI and Growth pillars (separate turns).
- Any layout, feature-grid, CTA, or cross-link changes — only the hero swap on coaching.
- No copy changes elsewhere on the page.

## Files touched

- `src/assets/hero-coaching-bg.jpg.asset.json` — new
- `src/routes/features.coaching.tsx` — rewritten hero block, removes `ProgrammesMockup` import
