
# Homepage hero v2 — elevate to "film still", not "editorial scene"

## Why the first four didn't clear the bar

All four were 35mm-at-f/2 cinematic, REPS-branded, demographically rotated — but compositionally they're documentary: two people on a gym floor, both in focus enough to read. That's editorial photography. The bar you're asking for — Nike Training Club, Apple Fitness+, Whoop, Future, Tonal — is **film still**: one iconic moment, one dramatic light source, negative space doing real compositional work, the athlete reading as elite, atmosphere (haze, breath, sweat detail) visible in the frame.

## Craft upgrades applied to all four shots

These rules replace the previous "premium editorial" defaults:

- **Single-source dramatic light.** Overhead hard tungsten, or a single low rim light slicing across the subject. Kill the soft ambient fill.
- **Volumetric atmosphere.** Visible haze / dust / breath / steam — light beams have to be readable.
- **Elite athlete read.** Visible sinew, sharp jaw, real exertion. Not "fit person at gym" — "athlete mid-effort."
- **Negative space as composition.** The left two-thirds isn't just "darker depth", it's a deliberate void with a single environmental cue (light beam, window, REPS wall mark) — so the headline lands like the title card of a film.
- **One subject reads as the hero.** When the coach is in frame, they are deeply out of focus or backlit silhouette only — supporting cast, never co-lead. Solves the "two people standing around" feel.
- **Closer crops.** Move from full-body to tight three-quarter or chest-up. Intimacy.
- **REPS branding stays.** All-caps wordmark on garment (rule respected). One defocused REPS environment mark where it's natural — never two competing logos.
- **Stack-wide grade preserved.** Cool blue-grey shadows, warm tungsten/orange highlights, dusk register — same family as pillar heroes, just pushed harder.

## The four new shots

**1. The corner** — `hero-home-v2-corner.jpg`
*Reference: boxing-corner photography, Apple Fitness+ trainer cue frames.*
Extreme tight three-quarter back of a Black female client mid heavy back-squat lockout under a barbell — traps loaded, jaw set, beads of sweat catching a warm rim light. Just over her shoulder, almost in her ear, a REPS-polo coach (white male, late 30s, calm) leaning in to cue her breath, eyes locked on the bar path. Dramatic single overhead tungsten cone, volumetric haze, plates and rack edge falling into pitch-black depth. **Story:** "Someone in your corner." Intimacy of real coaching.

**2. The cold dawn** — `hero-home-v2-dawn.jpg`
*Reference: Nike "Find Your Greatness", On Running brand films.*
Cinematic wide of a single female client (East-Asian, late 20s, elite-runner build) running uphill on a wet London street at blue hour — slick tarmac, breath visible, hi-vis-free, just power and quiet. A REPS-branded coach (mixed-race male, jacket over polo, stopwatch in hand) keeps pace one stride behind her, deeply defocused. Architecture frames them: a softened Battersea / Stratford silhouette in the deep background, single warm streetlight as the only fill. Wet asphalt reflects cold sky. **Story:** "With you at the hardest hour." Aspiration without a gym.

**3. The mid-rep film still** — `hero-home-v2-mid-rep.jpg`
*Reference: Tonal launch reel, Nike commercial film stills.*
Single hero: Latina female client (early 30s, athletic) mid-deadlift lockout, hips driving through, knurling visible on the bar, chalk dust kicking off the floor catching a single hard overhead tungsten beam. The REPS coach is a silhouette only, far deep background, watching from the rack — readable as a presence, not a face. Composition is vertical and brutal: the lift, the light, the dust. Cool blue gym depth, warm overhead spear. **Story:** "Train like you mean it." Pure performance.

**4. The exhale** — `hero-home-v2-exhale.jpg`
*Reference: Future app brand films, Whoop intimate portraiture.*
Tight, intimate: Middle-Eastern female client sitting on a bench between sets, elbows on knees, head down, chest still rising, sweat in her hair, towel hanging. The REPS coach (South-Asian female, late 20s, polo, calm) is kneeling in front of her at the same eye level, palm out, coaching her breath through the rest interval. The coach is softly out of focus, the client is sharp. Single warm low side light. The least-photographed moment in fitness and the one that sells the brand. **Story:** "The human bit no algorithm can replace." Trust.

## Generation + delivery

1. `imagegen--generate_image` premium, 1920×1280, four parallel calls with the prompts above (each prompt explicitly specifies single-source lighting, volumetric haze, subject hierarchy, and REPS wordmark placement — no ambiguity).
2. Upload each via `lovable-assets create` → four new `.asset.json` pointers under `src/assets/`:
   - `hero-home-v2-corner.jpg.asset.json`
   - `hero-home-v2-dawn.jpg.asset.json`
   - `hero-home-v2-mid-rep.jpg.asset.json`
   - `hero-home-v2-exhale.jpg.asset.json`
3. Show all four back to you in chat. You pick the winner.
4. After your pick, swap the import in `src/routes/index.tsx` (one line) and reference `chosen.url` in the existing `<img src={...} />`. Nothing else in the hero changes.
5. The first batch of four (`hero-home-transformation`, `-first-session`, `-confident-client`, `-coach-crew`) stays banked — they're solid editorial fits for /about, /find-a-professional, /how-it-works, /for-professionals. If you'd rather I delete them to clean up the bench, say the word.

## Out of scope

- No changes to H1, sub-headline, search form, goal chips, avatar/reviews row, press marquee, or anything below the hero.
- No mobile changes (mobile stays solid black).
- No "as featured in" press strip changes this turn.

## Files touched

- `src/assets/hero-home-v2-corner.jpg.asset.json` — new
- `src/assets/hero-home-v2-dawn.jpg.asset.json` — new
- `src/assets/hero-home-v2-mid-rep.jpg.asset.json` — new
- `src/assets/hero-home-v2-exhale.jpg.asset.json` — new
- `src/routes/index.tsx` — single import line + single `src` reference, AFTER you pick the winner
