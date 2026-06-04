## Honest critique — section seams blur together

You're right to be uneasy. Looking at the hero → proof band → Act 1 transitions, three things are true:

### 1. The proof band is structurally inside the hero
In the code, the proof band lives **inside** the `<section>` that wraps the hero. That section has the orange radial gradient and the trainer photo overlay, both of which bleed up through the proof band's `bg-reps-ink/70` (70% opacity → 30% see-through). So the proof band's "frame" is tinted with the hero's orange wash. It reads as "hero, continued" rather than its own chapter.

### 2. Three near-identical dark surfaces stacked
- Hero floor: `reps-ink` + orange radial + image overlay
- Proof band wrapper: `bg-reps-ink/70 backdrop-blur` (slightly different from hero only because of the blur)
- Act 1: `bg-reps-panel/20` (so close to `reps-ink` you cannot tell them apart on a calibrated screen)

The only thing separating them is a `border-reps-border/60` hairline. At 1px and 60% opacity on dark-on-dark, it's basically invisible. Three sections, one apparent surface.

### 3. The proof-band inner panel floats nicely, but its outer wrapper undoes the lift
The `rounded-[22px] bg-reps-panel/40 ring-1 ring-reps-border/60` panel is good — that's the world-class part. But it's sitting on a wrapper that is barely distinguishable from the hero above and the Act 1 section below, so the lift it earns gets cancelled.

## What top SaaS landing pages do here
- Linear, Vercel, Stripe: alternate "stage" and "floor" — every section sits on a distinctly toned surface, even in dark mode. The eye gets a rhythm: dark → slightly-lifted → dark → slightly-lifted. Never three of the same in a row.
- A trust band is almost always its **own** stage, not stuck to the hero's footer. It gets its own padding, its own ground.
- Borders are used sparingly — surface contrast does the chapter work, borders just polish the edge.

## Proposed fix (small, surgical — no redesign)

**A. Lift the proof band out of the hero section.**
- Move the proof band `<div>` from inside the hero `<section>` to its own `<section>`.
- This kills the orange-radial bleed-through immediately and lets the proof band stand as its own chapter.

**B. Seal the hero floor.**
- Add a thin `bg-gradient-to-b from-transparent to-reps-ink` at the bottom 96px of the hero so the hero ends decisively before the proof band begins.
- Remove the orange radial bleed in the lower 25% of the hero (clip the radial so it doesn't reach the seam).

**C. Give the three surfaces real, distinguishable tones.**
- Hero: keep as is (dark + orange wash + trainer photo)
- Proof band section: bump to a subtly lifted surface — e.g. `bg-[oklch(0.18_0.01_50)]` (or whatever the next step up from `reps-ink` is in tokens) so it reads as "lifted floor" without becoming light
- Act 1: drop back to pure `bg-reps-ink` (remove the `bg-reps-panel/20` which adds nothing)

This gives a dark → lifted → dark rhythm. Eye reads: hero, then trust beat, then Act 1.

**D. Replace the hairline borders with the surface change.**
- Remove `border-t border-reps-border/60` between hero and proof band
- Remove `border-b border-reps-border` between proof band and Act 1
- The 1-step tonal change is the divider; the border is redundant and competes with the rounded panel inside

**E. Optional chapter rule before Act 1 (only if surface change feels too quiet).**
- A 1px horizontal `bg-gradient-to-r from-transparent via-reps-orange/25 to-transparent` at the very top of Act 1, max-width 120px, centred. Reads as a quiet "new chapter" signal without shouting.

## What I am NOT touching
- The hero copy and the right-side device cluster
- The proof band's inner heritage anchor + press wordmark structure (we just approved that)
- Act 1's content, cards, copy, "The Verified Credential" footer band
- Header, footer, nav, routes, pricing, backend
- Any other section's spacing or rhythm — only the hero → proof → Act 1 seams

## Token discipline
- Background tones added via `src/styles.css` if a new step is needed (I'd add at most one new `--reps-surface-1` token between `--reps-ink` and `--reps-panel`). No hex in components.
- Keep radius (22px panel) and the proof band's existing structure intact.

## Question for you

Two-part:
1. Are you happy for me to add **one** new background token (e.g. `--reps-surface-1`) to `styles.css` to give the proof band a distinct lifted-floor tone? Or would you prefer I work with the existing `--reps-ink` / `--reps-panel` pair only and use opacity tricks?
2. Do you want the optional **orange chapter rule** before Act 1 (step E), or keep the divider work purely tonal?

Once you answer, I'll implement A–D (plus E if you want it) in one pass and re-verify at desktop / tablet / mobile.
