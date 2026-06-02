## World-class polish for nav + hero

### Header changes

1. **Hide location pill on `/` at rest** — show only when scrolled OR on subpages (paired with the compact search pill, since that's when location context is needed). One line guard in `PublicHeader.tsx` using existing `expanded` flag.
2. **Promote "All pros verified" pill** — change from `2xl:inline-flex` (≥1536px) to `lg:inline-flex` (≥1024px) so it's visible on every laptop, not just monitors.
3. **Promote "Become a Pro"** — change from `xl:inline-flex` to `lg:inline-flex` so the supply-side CTA never collapses before the hamburger does.
4. **Surface ⌘K as a real chip in the compact search pill** — replace `⌘K` text with a styled `<kbd>⌘K</kbd>` badge inside the pill (Linear/Vercel pattern).

### Hero changes

1. **Fix the right side properly** — adjust the image positioning and gradient so the coaching portrait is clearly visible from `lg` upwards at all widths up to 1920. Two specific fixes:
   - Drop `translate-x-[18%]` (pushes image off-screen on wider viewports), use `object-position` instead.
   - Soften the desktop gradient: dark from 0–30% (behind copy), fully transparent by 55% (current 75% kills the image).
   - Add a slow Ken Burns: `animate-[hero-kenburns_18s_ease-in-out_infinite_alternate]` (new keyframe in `styles.css` — subtle 5% scale + slight translate).
2. **Collapse 5 text layers → 3**:
   - Headline + sub (keep)
   - Two-field search (keep, with example-led placeholder: *"Try 'pilates near me' or 'strength coach London'"*)
   - **One row** of 6 intent pills (merge "goal chips" + "Popular:" — kill the duplicate row entirely)
   - **One bold trust line** (replace 4-item strip): `★ 4.9 from 50,000 reviews · 25,000 verified pros worldwide` — 14px, semibold numbers, white/85, no tiny dividers.
3. **CTA copy** — "Find Professionals" → "Find my coach" (directive, marketplace tone).

### Out of scope
- Hero image swap (keeping current `heroCoaching` asset)
- Activity ticker or floating pro card (rejected this turn)
- Header avatar/logged-in flows (no change)
- Below-the-fold sections

### Acceptance
- `/` at rest, 1280–1920px: hero portrait is clearly visible on the right with slow Ken Burns; no location pill in header; Verified pill + Become a Pro both visible.
- Hero shows exactly 3 text layers under the headline pair (search · 6 intent pills · single trust line).
- Scrolled past 96px: header collapses to solid, compact search pill appears with styled `⌘K` chip, location pill reappears next to logo.
- Mobile (375px): unchanged layout, just inherits the merged single intent-pill row and single trust line.
- Audit script (`reps-build-compliance`) exits 0.