## Add "Greater London" subline under London, UK

Single, scoped change to the Location card on the pro profile page.

### Changes

1. **Mock data** (`src/routes/pro.$slug.tsx`, pro objects): Add a `region: string` field to each pro mock (e.g. James Carter → `"Greater London"`, Sophie Taylor → her appropriate region). Since this is a mockup, values are hardcoded per pro.

2. **Location card** (around line 478): Under the `{pro.location}` line ("London, UK"), add a second line rendering `{pro.region}` styled as `text-[12px] text-reps-muted-light` (one line, no extra spacing beyond the existing `gap-2`).

### Out of scope

No other Location card changes (map, CTA button, description, grid ratio all stay as-is). No changes to Services & Pricing or Specialisms — those remain open for a later pass.
