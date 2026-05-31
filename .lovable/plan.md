## Add dashboard hero background to /signup

The mockup shows a dark photo of a laptop displaying a REPs-style dashboard (orange chart accents on dark UI) behind the hero, faded into the `reps-ink` background.

### What changes

1. **Generate one new asset** — `src/assets/signup-hero-bg.jpg` (1920×1080, `standard` quality). Prompt: a dark moody photograph of an open laptop on a black desk, screen displaying a dark-themed analytics dashboard with orange line charts, KPI cards and sidebar nav; deep blacks, subtle warm orange glow from the screen, cinematic side lighting, shallow depth of field. No text legibility required — it reads as ambience.

2. **Edit `src/routes/signup.tsx` hero section only**:
   - Add the image as an absolute-positioned `<img>` inside the existing hero `<section>` (behind the grid, above the two existing orange radial swooshes).
   - Apply `object-cover`, anchored roughly to the left/center so the laptop sits behind the left value-prop column like the mockup.
   - Overlay: a horizontal gradient from `reps-ink` (left, ~85% opacity) fading to ~40% over the image, plus a stronger gradient on the right side so the white form card always sits on near-solid `reps-ink` for contrast.
   - Keep the existing orange radial glows on top of the image at low opacity for the brand wash.
   - `z-index` order: image (z-0) → gradient overlays (z-10) → orange glows (z-10) → grid content (`relative z-20`).

3. **No other changes** — header, stats strip, features, FAQ, CTA, footer untouched. No token changes.

### Out of scope
- Other routes, including `/login`.
- Replacing the image with a real screenshot of the actual REPs dashboard (we haven't built that page yet — Phase 1 placeholder image is appropriate and matches the mockup's intent).

### Verification
Screenshot `/signup` at 1469px, compare to `src/mockups/reps_fullpage_signup_login_v1.png` — confirm the laptop/dashboard reads behind the left column, the form card stays high-contrast on dark, and headline + bullets remain fully legible.
