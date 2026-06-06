## Scope

Single occurrence across the whole codebase:

- `src/components/marketing/ReplacedStackBoard.tsx:28` — `{ name: "MyFitnessPal-style apps", job: "Nutrition", icon: Apple }`

No other file (routes, marketing components, comparison tables, copy libraries, resources, mockups) references MyFitnessPal in any form.

## Fix

Change the chip name from `"MyFitnessPal-style apps"` to `"MyFitnessPal"`. Everything else on that entry (the `Nutrition` job label, the `Apple` lucide icon fallback, the `wide` flag absence, ordering in the BEFORE grid) stays as-is.

No other edits required.