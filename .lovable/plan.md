# Fix: head-to-head routes nested under `/compare`, parent has no Outlet

## Diagnosis

The three head-to-head pages exist and the components are correct, but they render the wrong content because of a file-based routing collision:

- `src/routes/compare.tsx` declares `/compare` with `component: ComparePage` (no `<Outlet/>`).
- `src/routes/compare.reps-vs-mypthub.tsx` declares `/compare/reps-vs-mypthub`, which TanStack treats as a **child** of `/compare`.
- When you visit `/compare/reps-vs-mypthub`, both routes match. The parent has no Outlet, so the child has nowhere to render — the parent `ComparePage` is what you see. That's why it looks identical to `/compare`.

The rest of the project already uses the correct convention for this pattern: a trailing underscore on the parent segment (`dashboard_.bookings.tsx`, `pro.$slug.enquire.tsx` works because pro has explicit children too). For `compare`, the parent is a leaf page, so the three head-to-heads need to be siblings, not children.

## Fix

Rename the three head-to-head route files to break the nesting:

- `src/routes/compare.reps-vs-trainerize.tsx` → `src/routes/compare_.reps-vs-trainerize.tsx`
- `src/routes/compare.reps-vs-mypthub.tsx` → `src/routes/compare_.reps-vs-mypthub.tsx`
- `src/routes/compare.reps-vs-pt-distinction.tsx` → `src/routes/compare_.reps-vs-pt-distinction.tsx`

The `createFileRoute("/compare/reps-vs-…")` strings stay the same — the underscore is stripped from the URL but breaks the parent-child relationship in the route tree. URLs, links, and SEO metadata are unchanged.

`src/routeTree.gen.ts` regenerates automatically on next dev/build, so no manual edit there.

## Verification

After the rename:
1. Navigating `/compare/reps-vs-mypthub` renders the long-form deep dive (hero with 30-second verdict, intro prose, cost calculator, day-in-the-life table, etc.), not the `/compare` hub.
2. The three "Read comparison" cards on `/compare` work.
3. Cross-links between head-to-head pages work.

## Out of scope

No content or component changes. No nav, footer, or other route changes.
