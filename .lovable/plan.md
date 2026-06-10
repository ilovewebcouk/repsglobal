## Change

On `/features/coaching` (`src/routes/features.coaching.tsx`):

1. Delete the **Wearables & Habits** section component (the `WearablesSection` / habits block) and its render call in the page composition.
2. Remove any now-unused imports, constants, and lucide icons that were only referenced by that section.
3. Leave the new `NutritionSection` untouched.
4. Leave every other section, order, and the FinalCta untouched.

## Out of scope

- No copy changes to NutritionSection.
- No marketing nav / pricing / dashboard changes.
- No new routes, no backend, no AI wiring.
- No memory updates (nothing is being locked or unlocked).

## Verification

- Read the file after the edit to confirm no orphaned imports and that section order still flows cleanly into FinalCta.
- Visually check `/features/coaching` in preview.
