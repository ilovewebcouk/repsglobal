Replace the homepage "Explore by Specialism" grid with the 6 canonical REPs professions. Content-only change — locked layout and styling stay the same.

Changes (`src/routes/index.tsx`)
--------------------------------
1. Replace the `specialisms` array with the 6 canonical primary professions:
   - Personal Trainer → `profession: "personal-trainer"` (Dumbbell)
   - Strength Coach → `profession: "strength-coach"` (Target)
   - Pilates → `profession: "pilates-instructor"` (Activity)
   - Nutritionist → `profession: "nutritionist"` (Apple)
   - Yoga Teacher → `profession: "yoga-teacher"` (Sparkles)
   - Fitness Instructor → `profession: "fitness-instructor"` (Users)

2. Adjust the grid wrapper so 6 tiles sit evenly: `grid-cols-3 lg:grid-cols-6` (instead of `grid-cols-4 lg:grid-cols-8`). Tile size and styling unchanged.

3. Rename section H2 from "Specialism" to "Profession" to match the new content taxonomy. Eyebrow and CTA stay as-is.

4. Remove now-unused Lucide imports (`Laptop`, `Heart`, `Stethoscope`) from the file's import block.

QA
--
- Build/typecheck passes.
- Preview `/` on mobile, tablet, and desktop to confirm the 6 tiles render evenly, hover lift still works, and each tile links to `/find-a-professional?profession=<slug>`.

Out of scope
------------
- No changes to hero, goal chips, featured pros, or any other homepage section.
- No restyling of the tile or section chrome.