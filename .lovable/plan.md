## Goal

The three cards (About, Specialisms, Location) keep equal widths, but each one currently runs out of content well before the column ends. Specialisms has ~60% empty space below the chips, Location wastes the area under the square map, and About ends with two thin stat rows. The fix is to make each card *earn* its column with more substance — not to squeeze the grid asymmetrically (we already rejected that).

## Approach

Keep `lg:grid-cols-3` with `gap-5` and the locked `rounded-[22px]` panel radius. Enrich each card so the visual weight balances naturally.

### About card
Add a compact credentials strip below the existing bio + stats:
- Stats become a 2-column mini-grid: `8+ yrs experience`, `100+ clients`, `4.9 rating · 87 reviews`, `Replies in ~2 hrs` (each with a small icon + label/value stack, not a single inline row).
- Below the strip: a short "Training style" line — 3 small outlined pills (e.g. *Evidence-based*, *Supportive*, *Goal-led*) that reinforce tone and add visual texture.

### Specialisms card
- Keep the chip cloud, but split into two labelled groups so the card has structure instead of a single shapeless cluster:
  - **Specialisms** (existing tags)
  - **Works with** — small sub-list of client types (Beginners, Returning to training, Post-injury, Athletes) as lighter chips.
- Add a one-line footer: `Sessions tailored per client.` in muted text — anchors the bottom of the card.

### Location card
- Promote the map: full-card-width `aspect-[16/9]` map at the top instead of the cramped square left column.
- Below the map, a clean 2-column key/value list:
  - Area: Clerkenwell, EC1
  - Region: Greater London
  - Format: In-person · private studio or local gym
  - Travel: Up to 3 miles
- Footer row: `View on map` button + `Get directions` text link, both aligned.

### Out of scope
- No changes to grid template, max-width, page chrome, Services band, hero, sub-nav, reviews, FAQ, footer, or tokens.
- No new routes, no data-model changes — new fields (`rating`, `reviews`, `responseTime`, `worksWith`, `travelRadius`, `trainingStyle`) are added as static values on the same `pro` mock object used today.
- Radii stay locked (panel 22, chips full, buttons 10, map 12).

## Verify
Screenshot `/pro/sophie-taylor` and `/pro/james-carter` at 1469 viewport; confirm all three cards reach roughly the same height and no card has a large empty tail.
