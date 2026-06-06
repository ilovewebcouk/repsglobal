# Make "Before · your current stack" feel uniform and premium

## The problem

In `ReplacedStackBoard`, eight of nine chips render the tool name as **text with a strikethrough**, but Trainerize renders as a **monochrome SVG logo** with no strike line — so it visually breaks the row and looks like the odd one out (or worse, like a tool that isn't being replaced).

Three options were considered:

1. **Add brand logos for all nine** — requires sourcing/licensing 8 more SVGs (Wix, Calendly, Stripe, Mailchimp, Google Sheets, WhatsApp, MyFitnessPal-equivalent, "manual forms"). High risk, scope creep, and several of these aren't single-vendor concepts.
2. **Keep the Trainerize logo, overlay a strikethrough line on the chip** — works, but a strike through a logo always reads as a legal-grey-area negative attack rather than a confident "retired tool" tag.
3. **Drop the Trainerize logo on this board, render the name as text like the rest** — uniform, premium, no logo licensing risk. Trainerize keeps its logo treatment in the comparison strip directly above, which is the right place for a head-to-head.

**Recommendation: option 3** — uniformity wins. Then polish the "retired chip" treatment so it feels deliberate and world-class.

## What we'll change

### 1. `src/components/marketing/ReplacedStackBoard.tsx`

- Remove the `logo` field from the Trainerize BEFORE entry. All 9 chips now render the same way.
- Drop the `trainerize` SVG import — it's still used in `ComparisonStrip` so the asset stays.
- Refine the chip treatment for a more polished "retired tool" feel:
  - Lower chip background from `bg-reps-panel/60` to `bg-reps-panel/40` so it whispers vs the AFTER card.
  - Tighten border to `border-reps-border/70`.
  - Name: same `line-through decoration-reps-orange/60` but bump font weight from bold to semibold and color from `white/55` to `white/65` so the name remains readable through the strike.
  - Job label on the right: keep the `text-[10.5px] uppercase tracking-wider` but use `text-white/35` (slightly muter) so the name is the focal point.
  - Add `transition-colors` and a subtle hover state (border lifts to `reps-border`) so the board feels alive when you mouse over it — matches the polish on the AFTER list.

### 2. Header micro-polish (same component)

- Change the right-side counter from a flat `9 tools` to a small pill: `border border-reps-border/60 rounded-full px-2 py-0.5 text-[10.5px] uppercase tracking-wider text-white/50` reading `9 tools · 9 bills`. The "9 bills" half lands the headline argument ("one bill" appears on the AFTER side and in the strap line below) without needing more body copy.
- Keep the `BEFORE · YOUR CURRENT STACK` eyebrow exactly as-is — it sets the parallel with `AFTER` on the right card.

### 3. Optional: rebalance the 9-tool grid

The current 2-col × 5-row grid leaves a trailing empty cell because 9 is odd. Two clean fixes:

- **Recommended:** leave as-is. The asymmetry actually reads as "and there's always more tools creeping in" — the gap implies the list isn't even closed. No code change.
- **Alternative:** widen the BEFORE card and use 3 cols × 3 rows. Cleaner geometry but makes each chip narrower and may force the longer labels (`Manual check-in forms`, `MyFitnessPal-style apps`) to wrap.

Going with the recommended no-op on grid shape — the chip-uniformity fix is the only thing the user actually flagged.

## Out of scope

- No changes to the AFTER card, the headline, the arrow, or the surrounding page chrome.
- No changes to `ComparisonStrip` — Trainerize logo stays there.
- No new SVG assets or design tokens.

## Files touched

- `src/components/marketing/ReplacedStackBoard.tsx` — remove logo branch, refine chip styling, polish counter pill.

## QA after build

- Visit `/for-professionals`, scroll to "One connected platform". Confirm all 9 chips are visually identical: muted background, strike-through name on the left, muted job label on the right, hover lift.
- Confirm Trainerize logo still renders in the comparison table just above.
- Re-run REPs compliance audit — no new banned radii / hex / button shadows.
