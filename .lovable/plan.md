
# Homepage hero — generate all four, swap the chosen one, bank the rest

You want all four hero angles produced so you can pick the homepage winner and keep the other three on the shelf for other pages (about, find-a-professional, how-it-works, etc.). The current hero structure (H1, search form, goal chips, avatar + reviews row, mobile fallback) stays exactly as-is — only the background image swaps.

## Stack-wide rules every shot will follow

- 1920×1280, premium tier, cinematic editorial.
- Cool blue-grey shadows + warm tungsten/orange highlights. Dusk light. 35mm at f/2 feel. Shallow DoF.
- Subject anchored in the **right two-thirds** of the frame so the existing left-edge dark-to-transparent wash + radial vignette keep the headline / search / avatars perfectly legible. Matches the current `translate3d(22%, 0, 0) scale(1.05)` and `object-[center_25%]` framing.
- Every visible REPs garment carries the **"REPS"** ALL-CAPS wordmark (white embroidery, left-chest or centred-chest depending on shot).
- Wherever a wall/window can carry it naturally, a defocused **"REPS"** ALL-CAPS environment mark too.
- Diversity rotation: no two heroes share the same subject demographic. (Pillars so far: white male × 2, Black female, South-Asian male, Latina female owner.)

## The four shots

**1. The transformation moment** — `hero-home-transformation.jpg`
Diverse female client (mid-race / mid-30s) finishing a heavy sled push on the gym floor at dusk — head down, jaw set, sweat glow, hands on the sled handles. A REPS-branded male coach (Black, late-20s, lean) softly defocused half a step behind her cueing the next rep. Both wear REPS polos. Background: industrial windows, warm orange spill, blurred plate stack. **Story:** "Find. Trust. Train. Transform." literally — the moment the platform exists to create.

**2. The first session** — `hero-home-first-session.jpg`
REPs coach (East-Asian female, early 30s) on the gym floor at dusk, three-quarters to camera, mid-cue gesturing toward a tablet she's holding. A new client (white male, late 30s, gym kit, listening) stands across from her. REPS wall mark behind. **Story:** "Get matched with a verified coach" — the moment you walk in for session one.

**3. The confident client** — `hero-home-confident-client.jpg`
Editorial portrait of a real-looking female client (Middle-Eastern / mid-40s, towel round neck, water bottle in hand, post-session) standing in a boutique REPs studio at dusk. Calm half-smile, direct to camera. REPS wall mark softly defocused behind. A REPS coach is barely visible, fully out of focus, in the deep background. **Story:** "This could be you." Aspirational, client-led.

**4. The crew** — `hero-home-coach-crew.jpg`
Four REPs-branded coaches (mixed ethnicity + gender — Black female, South-Asian male, white female, East-Asian male) on the gym floor at dusk, mid-conversation, holding clipboards/tablets. REPS wall mark behind. Subject group anchored slightly right so left two-thirds stays clean. **Story:** "The network of verified pros." Coach-heavy — useful for /about, /for-professionals or /find-a-professional rather than the homepage if you ask me, but generated anyway.

## Generation + delivery

1. Use `imagegen--generate_image` premium, 1920×1280, four separate calls.
2. Upload each via `lovable-assets create` → write four `.asset.json` pointers under `src/assets/`:
   - `hero-home-transformation.jpg.asset.json`
   - `hero-home-first-session.jpg.asset.json`
   - `hero-home-confident-client.jpg.asset.json`
   - `hero-home-coach-crew.jpg.asset.json`
3. Show all four back to you in chat — you pick the winner.
4. Once chosen, swap the homepage import in `src/routes/index.tsx`:
   - Replace `import heroCoaching from "@/assets/hero-coaching-moment.jpg"` with the chosen pointer (`import heroHome from "@/assets/hero-home-{chosen}.jpg.asset.json"`).
   - Use `heroHome.url` in the existing `<img src={...} />` — nothing else changes (overlay, gradient, vignette, copy, avatars, search, chips, animations all stay).
5. The other three pointers stay banked in `src/assets/` ready for /about, /find-a-professional, /how-it-works, /for-professionals later.

## Out of scope

- No changes to the H1, sub, search form, goal chips, avatar row, stats, press marquee, or any section below the hero.
- No changes to mobile (stays solid black, no image — matches today).
- No swap of `hero-coaching-moment.jpg` yet — old asset stays in repo until you confirm the winner, in case you want to A/B.
- "As featured in" press strip — you said we *can* change that but I'll handle it in a separate turn so this one stays focused.

## Files touched

- `src/assets/hero-home-transformation.jpg.asset.json` — new
- `src/assets/hero-home-first-session.jpg.asset.json` — new
- `src/assets/hero-home-confident-client.jpg.asset.json` — new
- `src/assets/hero-home-coach-crew.jpg.asset.json` — new
- `src/routes/index.tsx` — single import line + single `src` reference, AFTER you pick (handled this turn once you've chosen)
