## Plan

### Problem
The "See all" link next to the "Featured in {City}" rail on city pages (`/in/$location`) navigates to `/find-a-professional` with no filters. The user wants it to land on the directory with the **Featured only** filter pre-toggled.

The profession page (`/professions/$profession`) has an identical "See all" link in its Featured section with the same issue.

### Changes

1. **`src/routes/in.$location.tsx`** (lines 533-538)
   - Add `search={{ city: loc.name, featured: true }}` to the "See all" `<Link>`.

2. **`src/routes/professions.$profession.tsx`** (lines 567-572)
   - Add `search={{ profession: meta.slug, featured: true }}` to the "See all" `<Link>` in the Featured section.

The homepage "View all" link already passes `featured: true` — no change needed there.

### Out of scope
- No backend or schema changes.
- No UI redesigns — only the `search` prop on two existing `<Link>` components.