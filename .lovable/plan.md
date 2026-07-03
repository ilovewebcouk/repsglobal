## Brutal-honest read

You're right — Coaching plans reads cleanly because each plan is a self-contained card with a clear header (name, price, one description). Foundation Method is currently a **flat vertical stack of 8 inputs**: Method name, Intro, then Pillar 1 (title + body), Pillar 2 (title + body), Pillar 3 (title + body). The three pillars look identical, there's no visual grouping, and the placeholders ("Pillar title", "Pillar description") don't hint at what a good answer looks like. It scans as a form dump, not as "the thing that renders as the neat 01/02/03 cards on my public page."

Two problems worth fixing:
1. The editor doesn't mirror the frontend structure, so it's hard to picture the output while filling it in.
2. Placeholder text is generic, so trainers stare at blank inputs.

## Plan

**1. Restructure the Foundation Method panel into two visual groups inside the same `PPanel`:**

- **Method overview** (top): Method name + Intro, kept as-is.
- **Three pillars** (below, under a small divider + subheading "The three pillars"): each pillar wrapped in its own bordered mini-card matching the public site's look — a numbered chip (`01`, `02`, `03`) in orange on the left, title input + body textarea stacked on the right. This mirrors the screenshot the user shared (numbered orange squares next to title + description), so the dashboard visually previews what the public page will render.

**2. Wire the reference copy as placeholder text** (not as default values — they only appear when the field is empty, so existing content isn't overwritten):

- Method name placeholder: `The Foundation Method`
- Intro placeholder: `A three-phase system I've refined over 100+ clients. Same shape every time, written from scratch for every person.`
- Pillar 1 title / body: `Build the base` / `Two weeks fixing technique on the four lifts that matter. No ego, no fluff.`
- Pillar 2 title / body: `Train the plan` / `Eight weeks of progressive, measurable work — written around your schedule, not a template.`
- Pillar 3 title / body: `Make it stick` / `Habits, nutrition rails and recovery so the result still holds 12 months later.`

**3. Keep everything else identical** — same state, same save handler, same AI draft button, same character limits, same submit flow. Zero backend or logic change.

## Scope
- Single file: `src/routes/_authenticated/_professional/dashboard_.website.tsx` (lines ~1281–1341)
- No new components, no new props, no schema change
- Numbered chips use existing `reps-orange` token — no new colors