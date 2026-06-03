## What we throw away

Bin the existing 6 PNGs in `src/assets/compare/` and the previous compositor. Start from a blank canvas with a new prompt set, a new layout, and the premium image model used for the homepage hero work.

## Engine

- **Backdrop AI**: `openai/gpt-image-2` at `quality: "high"` (same family that produced the strong homepage hero shots — `hero-gym-bg.jpg`, `hero-coaching-moment.jpg`, etc.). Each of the 6 outputs gets its own bespoke prompt — no shared scaffolding, no re-runs of the previous prompts.
- **Compositor**: Python + Pillow (no librsvg dependency on bezels). Used only to lay real assets on top of the AI photo. Zero AI text anywhere in the final frame.

## What the AI generates (backdrop only)

Cinematic, editorial gym/PT photography. Dark, warm, REPs-orange rim accent. Shot like a YouTube creator's A-roll thumbnail: dramatic lighting, shallow DoF, one strong subject, big negative space on one side for the headline. Different scene per competitor and a different composition for cover vs thumbnail (6 unique backdrops, not 3 + crops).

Hard prompt bans: any text, any letters, any logos, any UI, any screens, any holograms, sci-fi/neon, cartoonish styling, fake brand marks, watermarks.

## What we composite on top (real assets only)

1. **Real REPs wordmark** — pulled from `src/components/brand/RepsWordmark.tsx` (rendered to PNG at high res). Stays **white**, never recoloured.
2. **Real competitor logo** — the existing CDN SVGs in `src/assets/logos/` (Trainerize, MyPTHub, PT Distinction), rasterised at high DPI. Use each brand's own correct colour — verified against the source SVG before compositing. No AI-generated logo, ever.
3. **Real platform mockups inside device bezels**:
   - REPs side: a real frame from `src/mockups/` (e.g. `reps_fullpage_professional_profile_v1.png` or `reps_fullpage_directory_search_results_v1.png`) — so the REPs logo visible *inside* the mockup is the real one, not AI.
   - Competitor side: one clean screenshot of the competitor's public marketing/product page captured headlessly at retina. Captured once per competitor, saved to `/tmp/`, then composited. If a clean capture isn't possible we fall back to the vendor's public hero image — never an AI-generated UI.
   - Both mockups tilted into the scene with matching angle + drop shadow so they read as a fair head-to-head.
4. **Headline only** — short, bold, set in Anton/Inter (downloaded font, not AI). No URLs, no "last checked" pill, no chips, no evidence bar, no subline link, no methodology footer. Just the headline.

## Layouts (deliberately different per format)

| Asset | Size | Composition |
|---|---|---|
| OG cover | 1200×630 | Editorial wide: subject (coach/barbell/kettlebell) anchored on one third, two tilted device mockups stacked on the other third, REPs wordmark + competitor logo floating above their respective mockups, headline along the bottom over a soft dark scrim. |
| YouTube thumbnail | 1280×720 | Bolder: two mockups front-and-centre and larger, oversized headline across the top, real logos sitting on each mockup, designed to read at 320px wide. |

## Per-competitor scene + headline

| Competitor | Backdrop scene | Headline |
|---|---|---|
| Trainerize | UK gym floor, barbell on a rack, warm tungsten rim light, shallow DoF | TRAINERIZE vs REPs |
| MyPTHub | Coach beside a client, dumbbells racked behind, warm spotlight | MY PT HUB vs REPs |
| PT Distinction | Hands on a phone mid-session, kettlebells out of focus | PT DISTINCTION vs REPs |

Shared palette: dark warm tones, single brand-orange accent (rim light / wall glow), no recognisable faces in focus.

## Logo verification gate (mandatory before save)

Before any final PNG is written, the compositor checks: REPs wordmark file is the white in-project SVG, competitor logo file path matches one of the three approved `src/assets/logos/*.svg` entries, and the mockup PNG used is from `src/mockups/` (REPs side) or the captured `/tmp/competitor-*.png` (competitor side). If any source doesn't match, the run aborts.

## QA gate (mandatory before delivery)

For each of the 6 PNGs:
1. Inspect full-size and at 320px wide.
2. Confirm: no AI text anywhere, no fake logos, no garbled mockup UI, no sci-fi tone, scene reads as gym/PT.
3. Confirm: REPs wordmark is white, competitor logo is correct brand colour and not stretched, both mockups crisp.
4. Confirm: headline legible at 320px, fully on-canvas.
5. Confirm: cover and thumbnail are visibly different compositions, not crops.
6. If any asset fails — re-prompt the backdrop or recomposite, do not ship.

## Files written

Overwrite the 6 existing PNGs at the same paths so the route metadata (`og:image` / `twitter:image`) keeps working without code changes:

- `src/assets/compare/reps-vs-trainerize-cover.png` (1200×630)
- `src/assets/compare/reps-vs-trainerize-thumbnail.png` (1280×720)
- `src/assets/compare/reps-vs-mypthub-cover.png` (1200×630)
- `src/assets/compare/reps-vs-mypthub-thumbnail.png` (1280×720)
- `src/assets/compare/reps-vs-pt-distinction-cover.png` (1200×630)
- `src/assets/compare/reps-vs-pt-distinction-thumbnail.png` (1280×720)

## Out of scope (do not touch)

`VsHeroCard.tsx`, `HeadToHead.tsx`, `competitor-data.ts`, routes, tokens, radius, navigation, backend, auth, pricing. No metadata wiring changes needed.
