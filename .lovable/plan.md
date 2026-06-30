## Goal
Remove the "Services" page and sidebar item. Move its two still-needed controls (specialism chips + In-person/Online delivery) into the Website editor so directory cards, search filters, and the enquire form keep working.

## Changes

1. **Website editor (`dashboard/website`)**
   - Add a new "Specialisms & delivery" section at the top of the editor (above Hero) wrapping the existing `SpecialismsPicker` and the two In-person/Online toggle cards, with the same copy/limits as today.
   - Wire to the same `getMyDashboardProfile` / `updateMyDashboardProfile` server fns, with the same dirty-state + save behaviour the editor already uses.
   - Keep the right-hand "Directory card preview / Where else this shows" panel for this section so trainers still see the impact.

2. **Sidebar (`src/components/dashboard/nav-data.ts`)**
   - Remove the "Services" nav entry (under DELIVER).

3. **Route removal**
   - Delete `src/routes/_authenticated/_professional/dashboard_.services.tsx`.
   - Add a tiny redirect route `src/routes/dashboard_.services.tsx` (or extend the legacy redirects table) that 301s `/dashboard/services` → `/dashboard/website#specialisms` so stale bookmarks/links don't 404.

4. **Internal links sweep**
   - Update references in `src/routes/_authenticated/_professional/dashboard_.profile.tsx`, `src/components/dashboard/hub/index.tsx`, `src/content/help/articles/profile-service-locations.tsx`, and any "Go to Services" CTAs to point at `/dashboard/website#specialisms` instead.
   - Re-word copy that says "Services page" → "Website editor".

5. **QA**
   - Verify directory cards still render specialism chips, search filters still respect In-person/Online, and the enquire form still loads "What kind of coaching" options (no schema change — same DB fields, just a relocated UI).
   - `bun run build:dev` clean.

## Out of scope
No database/schema changes. Specialism + delivery-mode columns stay where they are; this is purely a UI relocation and nav cleanup.
