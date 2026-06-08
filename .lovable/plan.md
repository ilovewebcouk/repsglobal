Remove the sticky in-page section nav from `/cpd`.

## Change
In `src/routes/cpd.tsx`:
- Delete the sticky nav JSX block (the `<nav>` with anchor chips like "What CPD is / How REPs runs CPD / Qualifications / …").
- Remove any related imports/refs only used by it (icon imports, NAV_ITEMS array, scroll-spy state if present) — only if they have no other usage in the file.
- Leave all section `id="..."` anchors in place — they're still useful for direct deep-links.
- Do not touch the global site header, hero, or any other section.

## Out of scope
- No copy or layout changes to the rest of the page.
- No changes to other routes or shared components.
