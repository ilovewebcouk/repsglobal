## Problem

Navigating to `/pro/james-wilson/enquire` renders the **profile page** (`James Carter`) instead of the enquiry form. The route file `src/routes/pro.$slug.enquire.tsx` exists and is registered in `routeTree.gen.ts`, but it never renders.

**Root cause:** In TanStack Router, when a route has children (here `pro.$slug.enquire`), the parent route (`pro.$slug.tsx`) becomes a layout. A layout must render `<Outlet />` for its children to appear. Today `pro.$slug.tsx` is a self-contained profile page with no `<Outlet />`, so it always wins and the enquire route is invisible.

## Fix — split `pro.$slug` into layout + index

Standard TanStack pattern: keep the parent as a pure layout, move the profile content to the `index` child.

1. **Rename** `src/routes/pro.$slug.tsx` → `src/routes/pro.$slug.index.tsx`
   - No code changes inside; only update the `createFileRoute` path string from `"/pro/$slug"` to `"/pro/$slug/"`.
   - URL stays `/pro/james-wilson` — `index` routes render at the parent path.

2. **Create** new `src/routes/pro.$slug.tsx` as a 5-line layout:
   ```tsx
   import { createFileRoute, Outlet } from "@tanstack/react-router";
   export const Route = createFileRoute("/pro/$slug")({
     component: () => <Outlet />,
   });
   ```

3. Vite plugin auto-regenerates `routeTree.gen.ts` on save — no manual edits there.

## Verification

After the change, in the browser:
- `/pro/james-wilson` → profile page (unchanged)
- `/pro/james-wilson/enquire` → 3-step enquiry form with sidebar
- "Enquire Now" / "Send Enquiry" buttons on the profile continue to land on the form

## Scope

Two files touched. No styling, no business-logic, no schema changes. Phase 1 lock is preserved — the profile page itself is byte-identical apart from its route-string suffix.
