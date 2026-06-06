## Goal

Bulk up the BEFORE "your current stack" board on `/for-professionals` from 9 chips to 17 so the visual contrast against the orderly AFTER column lands harder, and kill the trailing dead space in the grid.

## Add these 8 tools

| Tool | Job |
| --- | --- |
| HubSpot | CRM |
| ClickFunnels | Funnels |
| GoHighLevel | Automation |
| Typeform | Lead forms |
| Kajabi | Courses |
| Thinkific | Courses |
| Skool | Community |
| DocuSign | Contracts |

Final BEFORE list = 17 entries (the existing 9 + these 8). Order in the array: group by adjacency of job so the wall scans naturally (website → courses → funnels → bookings → payments → contracts → email → CRM → automation → forms → community → comms → nutrition → check-ins).

## Layout changes (`src/components/marketing/ReplacedStackBoard.tsx`)

1. Change the BEFORE grid from `grid-cols-2` to `grid-cols-2 sm:grid-cols-3` so it reads as a dense wall on desktop and stacks gracefully on mobile.
2. Inside each chip, drop the right-aligned uppercase job label. At 3-col widths it crowds the name; with 17 named tools the brands carry the meaning on their own. Keep the logo slot + strikethrough name only.
3. Trainerize entry keeps its existing `wide: true` flag and wordmark treatment.
4. Update the counter pill copy from `9 tools · 9 bills` → `17 tools · 17 bills`.
5. Leave the AFTER card, arrow, headline, eyebrow, sub-copy and outer panel completely unchanged.

## Logos

Source all 8 logos from Simple Icons CDN as monochrome white SVGs (same flow as the previous 7), upload via `lovable-assets create`, and write `.asset.json` pointers under `src/assets/logos/`:

- `hubspot.svg`
- `clickfunnels.svg`
- `gohighlevel.svg`
- `typeform.svg`
- `kajabi.svg`
- `thinkific.svg`
- `skool.svg`
- `docusign.svg`

For any slug that 404s from Simple Icons, fall back to a neutral lucide icon rendered at the same `opacity-60` / white treatment (identical pattern to the existing MyFitnessPal `Apple` fallback). Likely candidates needing fallback: GoHighLevel, Skool, ClickFunnels. Fallback choices:
- GoHighLevel → `Zap`
- Skool → `Users`
- ClickFunnels → `Filter`

Every logo `<img>` keeps the existing `brightness-0 invert` filter so colored assets render as flat white.

## Out of scope

- No changes to ComparisonStrip, ProductBlock, /for-professionals route file, or any other component.
- No new design tokens, no radius/colour changes.
- No copy changes elsewhere on the page.