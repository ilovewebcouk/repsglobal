# PressMarquee — swap typographic credits for real publisher logos

Replace the 6 hand-set typographic wordmarks in `src/components/marketing/PressWordmarks.tsx` with the 8 real publisher SVG marks the user uploaded. Track gets the same uniform-tint treatment so the strip still reads as a single editorial credit row, not a collage of brand colours.

Files touched: **only** `src/components/marketing/PressWordmarks.tsx`. PressMarquee.tsx and every consumer route stay untouched — same import surface, same tint mechanism.

## New mark roster (8, in scroll order)

```
The Times · BBC Sport · Sky News · The Independent · GQ · Men's Health · Women's Fitness · Runner's World
```

Adds Sky News + The Independent over the current 6.

## How each upload is integrated

| File | Source | How it lands in the component |
|---|---|---|
| `the_times.svg` | uploaded | Inline `<svg>`, all `fill`s rewritten to `currentColor`. |
| `bbc_sport.svg` | uploaded | Inline `<svg>`, `currentColor`. |
| `sky_news.svg` | uploaded | Inline `<svg>`, **gradient stripped** (red→white gradient replaced with single `currentColor` fill on the background tile + paths). Without this it'd render as a coloured red badge in a row of greys. |
| `the_independent.svg` | uploaded | Inline `<svg>`, `currentColor`. |
| `gq.svg` | uploaded | Inline `<svg>`, `currentColor`. |
| `mens_health.svg` | uploaded | Inline `<svg>`, baked `--primary: #D2232E` and red fills rewritten to `currentColor`. |
| `runners_world.svg` | uploaded | Inline `<svg>`, baked `--primary: #000000` and black fills rewritten to `currentColor`. |
| `womens_fitness.webp` | uploaded | **Raster** — can't be `currentColor`-tinted. Two options below; I recommend (a). |

### Women's Fitness — raster handling

(a) **Recommended.** Re-create as a simple inline `<svg>` typographic wordmark in the same Cooper Black-ish style as the source webp, fill `currentColor`. Matches the strip exactly, ~1 KB. (~10 mins of path tracing for a 13-letter mark.)

(b) Upload the webp via Lovable Assets and render `<img>` with `filter: brightness(0) invert(1) opacity(0.55)` to fake the tint. Works, but ~14 KB raster in a row of vector marks and the filter trick breaks if the strip ever changes colour.

I'll go with **(a)** unless you say otherwise.

## Visual normalisation rules applied to every mark

1. Strip `width`/`height` attributes — keep `viewBox` only, so `widthClass`/`h-*` in PressMarquee controls size.
2. Remove embedded `<style>` blocks and CSS custom properties (`--primary`, etc.).
3. Replace every `fill="#xxxxxx"` and `style="fill:..."` with `fill="currentColor"`.
4. Remove `<linearGradient>`/`<radialGradient>` defs and any `fill="url(#...)"`. Replace with solid `currentColor`.
5. Keep `<title>`/`<desc>` for a11y where present.

This is exactly what the file's docstring already promised — "rendered as inline SVG using `currentColor`, so the track's text color tints every mark uniformly." We're just adding 8 new marks that follow the same rule.

## widthClass tuning

`h-6 sm:h-7 lg:h-8` (24/28/32 px) stays fixed for vertical rhythm. Each mark's `widthClass` is set so the visual mass reads consistently next to its neighbours — taller-than-square marks (BBC Sport, Sky News, Independent) get wider boxes; tight marks (GQ, Times) get narrower. Rough targets at desktop `h-8`:

| Mark | widthClass |
|---|---|
| The Times | `w-[120px]` |
| BBC Sport | `w-[58px]` *(square stack)* |
| Sky News | `w-[130px]` |
| The Independent | `w-[164px]` |
| GQ | `w-[60px]` |
| Men's Health | `w-[150px]` |
| Women's Fitness | `w-[156px]` |
| Runner's World | `w-[176px]` |

Will eyeball-tune after first render — easy to nudge by ±10 px.

## Out of scope

- No change to `PressMarquee.tsx` (animation, mask, "As featured in" label all stay).
- No new memory rule — the existing `marketing-hero-template` memory already says "PressMarquee with editorial wordmark SVGs"; real-publisher SVGs still fit that description.
- No layout, colour-token, or animation tweaks.
- No edits to the 7 consuming routes/components.

## Verification

After the edit:
1. `bun` will compile — visit `/cpd`, `/`, `/for-professionals`, `/specialisms` and confirm the strip renders as 8 uniform white/55-tinted marks, no coloured outliers, no jumpy heights.
2. Screenshot the strip at desktop + mobile widths.
3. Confirm the marquee still loops seamlessly (8 marks duplicated = 16; gap rhythm preserved).
4. `rg -n "fill=\"#" src/components/marketing/PressWordmarks.tsx` → must return zero (all fills should be `currentColor`).

## One last call-out before I build

You said you have permission for all 8. Worth confirming you have it in writing for each — **The Times** and **BBC** in particular almost always tie logo use to a specific press placement or partnership and revoke at will. If permission is verbal/informal, I'd at minimum keep this strip off any page that's indexed for SEO comparison ranking (it's currently on `/cpd`, `/`, `/for-professionals`, `/specialisms`, `PillarPage`, `FeatureGroupLayout`, `VenueStrip` — so basically the whole public site). Your call.
