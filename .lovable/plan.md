## Goal

Rebuild the existing Nutrition section on `/features/coaching` (not a new page) as the honest beta product: **REPs Nutrition Library + meal plan templates + in-house client food log + optional external food diary link**. Strip every overpromise (food database, barcode scan, AI photo recognition, MyFitnessPal/Cronometer "sync") from the page and the mock.

## Why on `/features/coaching`

Coaching pillar already owns Programmes / Nutrition / Habits / Check-ins / Client View / Templates as one continuous workspace. Splitting nutrition off would break that narrative and force a near-duplicate page. Keep one pillar, rewrite the one section.

## Files touched

1. **`src/routes/features.coaching.tsx`** — rewrite `NutritionSection` only. Update copy on a handful of surrounding strings (hero subhead, problem strip, FAQ "Does it replace MyFitnessPal?", Verified-vs-Pro matrix row, related Pro/Verified copy) to match the new honest framing. Leave the rest of the page (Programmes, Habits, Check-ins, Client View, Templates, Use cases, Tier matrix, FAQ frame) untouched.
2. **`src/components/marketing/coaching/InteractiveMocks.tsx`** — replace `NutritionMock` and its `NUTRITION_STATES`/`NUTRITION_BULLETS` with the new beta-honest version. Remove the `Barcode` chip, the "database recalculates macros automatically" line, and the "Photo meal · AI-identified · Estimate" tab entirely.
3. **No new files, no new route, no nav change.**

## New section structure (single `NutritionSection`, ~2× current height)

Eyebrow: `Nutrition coaching` (unchanged)
Heading: **"Nutrition coaching built around your own library."**
Lede: "Create recipes, build meal plan templates, assign recipe books, review client food logs, and keep nutrition feedback connected to check-ins, progress and accountability."

Then a **3-column "three core parts"** card row directly under the lede — short, scannable, sets the architecture:

- **1 · REPs Nutrition Library** — Ingredients, recipes, meals, recipe books and meal plan templates. Use the REPs library or build your own.
- **2 · Meal plan templates** — 7-day fat loss, high-protein meal prep, vegan muscle gain, athlete fuelling, family low-prep, shift-worker, maintenance. Assign and adapt.
- **3 · Client food log + external diary** — Clients log meals, photos, water and notes in REPs — or attach a public MyFitnessPal / Cronometer link for review.

Then the existing 60/40 mock + bullet column, but the mock now has **4 new tabs** matching the architecture:

`Library` · `Plan template` · `Client log` · `External diary`

### Mock content per tab (rebuild in `InteractiveMocks.tsx`)

- **Library** — Grid of recipe cards (High-protein chicken rice bowl · Tofu peanut noodles · Overnight oats · Salmon traybake). Each card: macros chip, dietary tag (HP / V / GF), "12 ingredients". Top filter chips: Recipes / Ingredients / Meals / Recipe books / Templates. Footer line: "Use the REPs library or save your own."
- **Plan template** — "7-day fat loss · 1,800 kcal · 150 P / 170 C / 55 F". Day-strip Mon–Sun, expanded Wed showing 4 meals (Breakfast / Lunch / Snack / Dinner) with portion + kcal. Side panel: substitutions, shopping list link, coach-only notes, client instructions. Footer chip: "Assign to client".
- **Client log** — Today view: assigned meals checklist (Breakfast ✓, Lunch ✓, Snack —, Dinner —), water 6/8 glasses, photo thumbnail of lunch, hunger 3/5, energy 4/5, adherence note. Manual-add row "Log a meal" with mini fields (name + kcal). No barcode chip. No AI identify.
- **External diary** — Card list of attached sources: MyFitnessPal public diary link (URL preview), Cronometer report link, "Week 6 export.csv" file, screenshot thumbnail, free-text client note. Tiny status pill: "Read-only · opens in new tab". Helper line: "Connect an external food diary link — automatic imports planned for later releases."

### Right-column bullets (replaces NUTRITION_BULLETS)

- Build recipes from ingredients with portion, macros and prep notes — save once, reuse forever
- Meal plan templates for fat loss, hypertrophy, vegan, athlete, family and shift-worker scenarios
- Assign a plan, swap meals per client, send a shopping list
- Recipe books give clients structured options without you writing a new plan every week
- Clients log meals, photos, water, hunger and energy inside REPs
- Attach a MyFitnessPal or Cronometer public link, screenshot or CSV export for review
- Every nutrition action lands on the client record, next to programmes, check-ins and progress
- Deeper tracker imports, barcode scan and AI meal recognition are on the later roadmap

### "Coming later" caption strip

A single small line under the section (muted, white/55): *"On the nutrition roadmap: barcode scan, food database search, AI meal recognition and deeper tracker imports."* — sets honest expectations without burying the value.

## Copy edits elsewhere on the page (surgical, same file)

- **Problem strip** (line ~67): change `{ icon: Utensils, label: "Nutrition in MyFitnessPal" }` → `{ icon: Utensils, label: "Nutrition in PDFs and screenshots" }`.
- **Problem strip lede** (line ~370): replace `"nutrition in MyFitnessPal"` with `"nutrition in PDFs, screenshots and WhatsApp"`.
- **FAQ "Does it actually replace MyFitnessPal for nutrition?"** (line ~177): rewrite answer to: *"For coach-led nutrition — yes. You build a library of recipes, ingredients, meals and meal plan templates, assign them to clients, and review their food log, photos and weekly check-in in one place. Clients can also attach a public MyFitnessPal, Cronometer or other tracker link if they prefer to log there — REPs treats it as evidence on the client record. Barcode scan, a food database and AI meal recognition are on the roadmap, not the beta."*
- **FAQ "Is REPs really one workspace?"** (line ~174): drop "nutrition with a food database" → "nutrition library and food log".
- **Verified-vs-Pro matrix row** (line ~158): rename `"Nutrition: macros, food log, meal plans"` → `"Nutrition library, meal plan templates, client food log"`.
- **`NUTRITION_FEATURES`** card (line ~139): keep the tile but change body to *"Build a library of recipes, meals and templates. Assign in one click. Review the client's log on the same record."*

## Out of scope (do NOT add this turn)

- No new route `/features/nutrition`
- No "Founder Access" banner inside this section (founder messaging stays on `/founder-access`)
- No DB/migration, no real MFP/Cronometer parsing, no AI scanning
- No changes to `/dashboard_.nutrition.tsx` or `/portal_.nutrition.tsx` (separate mockups, separate scope)
- No nav changes
- No new shared component — the 3-column "three parts" row is plain markup inside `NutritionSection`

## Locked phrase

> **Build your own nutrition library, assign meal plans, review food logs, and keep every nutrition decision connected to the client record.**

Used as the section lede or as a closing line above the bullets — exact wording.
