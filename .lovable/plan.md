# Swap PressMarquee → VenueStrip everywhere, with real gym logos

Replace the dark "As featured in" press strip with the warmer "Where you'll find our trainers" venue strip on every page that currently uses it, and upgrade the venue marks from typographic stand-ins to the **11 real gym SVGs** the user uploaded — using the same `currentColor` normalisation trick as the recent press swap so the row stays one uniform charcoal/70 band on ivory.

## Why this is a better strip than press

- `VenueStrip` already exists, already links each logo to `/find-a-professional?venue={slug}` — it's a search funnel, not decoration.
- Verifiable: any open register has members training at named chains. No press-permission risk.
- Legal hygiene line ("Independent REPs-verified professionals — not affiliated with the gyms shown") is already shipping in `VenueStrip` and stays untouched.

## Roster: 11 real gym SVGs (Bannatyne kept)

| # | Brand | Source file | Slug |
|---|---|---|---|
| 1 | PureGym | `puregym.svg` | `puregym` |
| 2 | The Gym Group | `the_gym_group.svg` | `gym-group` |
| 3 | Virgin Active | `virgin_active.svg` | `virgin-active` |
| 4 | David Lloyd | `david_lloyd.svg` | `david-lloyd` |
| 5 | Nuffield Health | `nuffield_health.svg` | `nuffield-health` |
| 6 | Third Space | `third_space.svg` | `third-space` |
| 7 | Anytime Fitness | `anytime_fitness.svg` | `anytime-fitness` |
| 8 | Fitness First | `fitness_first.svg` | `fitness-first` *(new slug)* |
| 9 | Everyone Active | `everyone_active.svg` | `everyone-active` *(new slug)* |
| 10 | énergie Fitness | `energie_fitness.svg` | `energie-fitness` *(new slug)* |
| 11 | Bannatyne | `bannatyne.svg` | `bannatyne` |

## Files touched

1. **`src/components/marketing/VenueWordmarks.tsx`** — rewrite. Same `?raw` import + normaliser pattern as `PressWordmarks.tsx`: strip width/height, flatten gradients and embedded `<style>`, replace every fill with `currentColor`, inject via `dangerouslySetInnerHTML`. Update `VENUES` roster to the 11 above. New `widthClass` values tuned per mark for uniform visual mass at `h-7 lg:h-8`.

2. **`src/assets/venues/`** — copy the 11 uploaded SVGs here (mirroring the press setup). User-uploaded SVGs only; no asset-CDN round-trip since they're inlined.

3. **6 call sites** — one-line swap each, `PressMarquee` → `VenueStrip`:
   - `src/routes/index.tsx:35,542`
   - `src/routes/cpd.tsx:38,464`
   - `src/routes/specialisms.tsx:34,519`
   - `src/routes/for-professionals.tsx:30,205`
   - `src/components/features/PillarPage.tsx:9,173`
   - `src/components/features/FeatureGroupLayout.tsx:7,156`

4. **PressMarquee.tsx + PressWordmarks.tsx + `src/assets/press/`** — banked, not deleted. Per the user: "We could always bank this as featured in." Files stay in the repo with zero imports.

5. **Memory `mem://design/marketing-hero-template`** — update the line "PressMarquee with editorial wordmark SVGs" to "VenueStrip with real gym SVGs" once the build is green.

## Out of scope

- No change to `VenueStrip.tsx` (copy, layout, link behaviour, animation all stay).
- No `pro.venues[]` data backfill — that's a content task.
- No `/find-a-professional` filter wiring (already accepts `?venue=` slug).

## Visual call-out

`VenueStrip` lives on `bg-reps-warm-white` (ivory), not the dark ink the press strip lives on. Every page that currently ends its hero on a dark strip will now have a warm ivory band there instead — deliberate move (supply/proximity reads warm). If the seam between any hero's dark gradient and the new ivory band looks abrupt, I'll flag it after first render rather than pre-emptively edit hero gradients.

## Verification

1. `bun` build green.
2. Visit `/`, `/cpd`, `/specialisms`, `/for-professionals`, one `PillarPage` route, one `FeatureGroupLayout` route — each shows the ivory venue strip with all 11 marks rendering uniformly tonal.
3. `rg -n 'PressMarquee' src/routes src/components/features` → zero matches.
4. `rg -c 'fill="#' src/components/marketing/VenueWordmarks.tsx` → zero.
5. Click PureGym in the strip → lands on `/find-a-professional?venue=puregym`.
