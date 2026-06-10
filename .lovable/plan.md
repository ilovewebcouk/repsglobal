## Goal

Replace the existing "Nutrition coaching" section on `/features/coaching` (the `NutritionSection` at lines 498–519 of `src/routes/features.coaching.tsx`) with the new meal-planning layout you pasted: a "Following Sarah K." pill, eyebrow + heading + lede, three option cards (Manual / Templates / AI draft), and a quote card with a 5-step pipeline (Client intake → AI draft → Trainer edits → Trainer approves → Client sees plan).

## What changes

**`src/routes/features.coaching.tsx`**
- Rewrite `NutritionSection()` to render the new layout exactly as shown:
  - Top "Following Sarah K." chip (orange-soft avatar circle, "12-week fat-loss client · 3×/week · 145g protein target" detail hidden under `sm`).
  - Eyebrow `Meal planning + nutrition support`, H2 "Meal planning, built into coaching — not bolted on.", lede about manual / templates / AI-assisted drafts with trainer approval.
  - 3-column card grid (`lg:grid-cols-3`) — Manual (UtensilsCrossed), Templates (Layers), AI draft (Sparkles, highlighted with `border-reps-orange-border` + `bg-reps-panel/70`). Each card: pill label, icon, title, body, 3 check bullets.
  - Quote/pipeline card at the bottom: pull-quote ("AI should speed up meal planning, not replace professional judgement.") plus the 5-step chip row with `ArrowRight` separators, "Trainer approves" using the emerald status token, mobile-wraps cleanly.
- Drop the now-unused `NutritionMock` import and the `NUTRITION_BULLETS` constant from this route (still exported elsewhere but no other consumer, so leave the component definition in `InteractiveMocks.tsx` untouched).
- Keep section chrome consistent: `border-b border-reps-border bg-reps-panel/15` + locked rhythm `py-20 lg:py-28`.

## Technical notes

- Use existing tokens only (`reps-border`, `reps-panel`, `reps-orange`, `reps-orange-soft`, `reps-orange-border`, `reps-ink`, `emerald-400/30 bg-emerald-500/15 text-emerald-300`).
- Radius: 22px on the three option cards and the quote panel (matches the pasted markup and the locked radius scale for large panels).
- Heading uses raw `font-display text-[30px] lg:text-[40px]` to match the pasted markup; this is an exception to the `SectionHeading` rule because the section needs the "Following" chip above the eyebrow. If you'd rather keep the shared primitive, say so and I'll restructure with `SectionHeader` + the chip rendered above it.
- Icons via `lucide-react` (`UtensilsCrossed`, `Layers`, `Sparkles`, `Check`, `ClipboardList`, `NotebookPen`, `CircleCheck`, `Smartphone`, `ArrowRight`).
- No new dependencies, no backend changes, no other sections touched.

## Out of scope

- No edits to `NutritionMock` or any other section on the page.
- No memory/lock updates.
