## Goal

Add a new specialism section — **Group Exercise & Fitness Instructors** — to `/specialisms`. This is the only home for **Level 2** qualifications on REPs, with scope limits made explicit so visitors don't confuse L2 instructors with L3 personal trainers.

Note: the `/specialisms` page is in the locked list (6 sections, frozen 2026-06-07). The user has explicitly requested this 7th section, so the lock is being intentionally extended — not bypassed.

## Changes

### 1. `src/routes/specialisms.tsx` — add new SPECIALISM entry

Append a 7th object to `SPECIALISMS`, inserted **after `personal-trainer`** (position 2) so the L2 → L3 conceptual ladder reads naturally in the sticky nav and in scroll order.

```ts
{
  slug: "group-exercise",
  anchor: "group-exercise",
  navLabel: "Group ex & instructors",
  icon: Users,            // import from lucide-react
  eyebrow: "Specialism 02",
  title: "Group Exercise & Fitness Instructors",
  plural: "Group ex and fitness instructors",
  intro:
    "The energy on the gym floor and in the studio. Level 2 instructors lead classes, run inductions and coach group sessions — the entry point into a career on the register.",
  does: [
    "Group classes: circuits, bootcamp, indoor cycling, exercise to music",
    "Gym floor inductions, equipment demos and supervised programmes",
    "Small-group training under a club, studio or PT's supervision",
  ],
  verifies: [
    "Government-recognised Level 2 qualification (RQF)",
    "Public liability insurance appropriate to the class type they teach",
    "Current first aid and a verified photo ID",
  ],
  rate: "£25 – £45 / session",
  count: 612,             // placeholder, same style as other sections
  quals: [
    {
      acronym: "L2 GI",
      full: "Level 2 Gym Instructor (RQF)",
      meaning: "Gym-floor inductions, supervised programmes and group circuits — not 1:1 PT.",
    },
    {
      acronym: "L2 ETM",
      full: "Level 2 Exercise to Music",
      meaning: "Choreographed studio classes — aerobics, dance fitness, step.",
    },
    {
      acronym: "L2 GT",
      full: "Level 2 Group Training",
      meaning: "Bootcamp, circuits and small-group conditioning sessions.",
    },
    {
      acronym: "REPs",
      full: "Register of Exercise Professionals",
      meaning: "L2 instructors hold full register status — same identity, qualification and insurance checks as L3+ pros.",
    },
  ],
},
```

Also: renumber the existing `eyebrow` strings ("Specialism 02" → "Specialism 03", etc.) on the five sections that follow, so they stay sequential.

### 2. Scope-limit copy

The `does` and the L2 GI `meaning` line make the boundary explicit ("not 1:1 PT") so we don't mislead consumers. No extra disclaimer block needed — it's baked into the existing card structure.

### 3. Sticky in-page nav

Picks up the new section automatically (renders from `SPECIALISMS.map`). The nav label is kept short ("Group ex & instructors") so it fits the row alongside the other 6.

### 4. Memory

Update `mem://design/locked-specialisms` to reflect 7 sections instead of 6, noting Group Exercise sits at position 2 and owns all L2 quals.

## Out of scope

- No changes to the PT section (stays L3 → L4 → REPs as is).
- No changes to the REGISTERS grid, hero, FAQ, VerifyStrip or any other section.
- No changes to `PROFESSIONS` data, find-a-pro filters, profession landing pages, or routing.
- No new images.

## Verification

- `/specialisms` shows 7 sticky-nav chips in order: PT, Group ex & instructors, Strength, Online, Nutritionist, Yoga, Pilates.
- New section renders with 4 qual tooltips, all readable on hover/tap.
- Eyebrow numbers run 01–07 sequentially.
- No console errors; build clean.
