# Nutrition section — full visual rework

Scope: `/features/coaching` Nutrition section only. No other section touched. No shared primitives changed (BulletColumn stays as-is — 9 other sections use it).

## What's wrong today

1. **Mock has a huge dead zone.** The shared `MockShell` lets each state size itself, so the Library state (4 small recipe cards + filter row) leaves ~60% of the laptop frame black. The Draft/Approve/Assigned states fill it; Library doesn't.
2. **Right column is a tower of 8 bordered pills.** Each `NUTRITION_BULLETS` item renders as its own card via `BulletColumn`. The column ends up ~2× the height of the mock — the block reads as "half-empty laptop next to a wall of pills."
3. **Workflow strip + tabs + bullets all repeat the same story** — `Build library → AI drafts → Approve` lives in the 3-card strip, in the 4 mock tabs, AND in the bullets. Triple-stated.
4. **Tab labels still showed old "Library / Plan / Client log / Diary"** in the screenshot — code is already updated to Library/Draft/Approve/Assigned, so this is a stale-build artifact. New layout will make the change unmistakable.

## New layout

```text
┌─────────────────────────────────────────────────────────┐
│  EYEBROW                                                 │
│  AI drafts the meal plan.                                │
│  You approve the coaching decision.                      │
│  [lede]                                                  │
├─────────────────────────────────────────────────────────┤
│                                                          │
│     ┌──────────────────────────────────────────┐         │
│     │  ● ● ●   Nutrition · James Carter        │         │
│     │  [ Library ] [ Draft ] [ Approve ] [Assigned]      │
│     │                                          │         │
│     │     full-bleed mock content              │         │
│     │     (fixed min-height, every state       │         │
│     │      pads up to match the tallest)       │         │
│     │                                          │         │
│     └──────────────────────────────────────────┘         │
│                                                          │
│  ── Build ──────→  Draft ──────→  Approve ──────→  ──    │
│  Library you trust   AI assembles   You sign off          │
│  Recipes, meals,     Pulls from your  Swap, edit, note,   │
│  templates you've    library only —   approve. Logged     │
│  approved.           never a random   on the record.      │
│                      food database.                       │
└─────────────────────────────────────────────────────────┘
```

Concretely:

1. **Replace the `lg:grid-cols-[1.15fr_0.85fr]` mock+bullets row** with a single centered `NutritionMock` capped at `max-w-[920px]` with `mx-auto`. The mock becomes the section's hero, not a sidekick.
2. **Move the existing 3-step workflow strip (`NUTRITION_PARTS`)** to sit *under* the mock instead of above it — it becomes the "what just happened" recap of the 4 tab states, not a prelude. Keep the arrow connectors but lighten visual weight (smaller card padding, no border, just dim divider lines).
3. **Delete the `BulletColumn` + `NUTRITION_BULLETS` block from this section entirely.** Those 8 lines are absorbed into:
   - The mock states (which already show pick-target / AI-suggests / swap-edit / sign-off / audit-trail visually)
   - The 3 workflow recap cards (which already cover library / draft / approve)
   - Two of the most important lines ("never random food database results", "every decision is logged") move into the workflow card bodies if not already there.
4. **Fix the mock frame.** Inside `NutritionMock`, add `min-h-[320px]` (or equivalent) to the inner content wrapper so the Library state pads to match Draft/Approve height. Library state gets an unobtrusive footer note that fills the slack — e.g. an "Approved by you · 248" callout already exists; expand it to a 1-line summary strip at the bottom of the Library state so the frame is balanced.
5. **Default mock state**: switch from `"draft"` to `"library"` so the narrative arc on first view matches the section header ("build your library once, *then* let REPs assemble plans").

## Files touched

- `src/routes/features.coaching.tsx`
  - `NutritionSection()` (lines 521-578): restructure JSX — header → centered mock → workflow recap strip. Remove the `BulletColumn` call and the `lg:grid-cols-[1.15fr_0.85fr]` grid.
  - `NUTRITION_BULLETS` (lines 92-101): delete (no longer referenced).
  - `NUTRITION_PARTS` copy: light edit so "never random food database" + "every decision is logged" land in the right cards.

- `src/components/marketing/coaching/InteractiveMocks.tsx`
  - `NutritionMock()` (lines 472-685): wrap inner content area in a `min-h-[320px]` container; default `useState` to `"library"`; add a balanced footer block to the Library state so it stops looking empty.

## Out of scope

- No changes to `BulletColumn`, `SectionHeader`, `MockShell`, or any other section.
- No new components, no shared primitives.
- No copy rewrite on the locked phrase or lede.
- The stale "old tabs" rendering in the screenshot is a refresh artifact; no code action needed beyond the rework above.

## Acceptance check

After the change, viewing `/features/coaching` at desktop width:
- Nutrition section is visibly centered, not lopsided.
- Mock frame has no large black dead zone in any of the 4 tab states.
- No tower of 8 stacked pills. The right column doesn't exist.
- The story reads: header → live mock you can tab through → 3 short recap cards. Three beats, not three repetitions.
