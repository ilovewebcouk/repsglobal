## What's actually happening

Navigating to `/c/jordon-gumbley/enquire` currently re-renders the coach shop-front (H1 "Get visibly stronger in 12 weeks", no `<form>`) instead of the enquiry form. Confirmed by inspecting the live DOM.

## Why

TanStack file-based routing:

- `src/routes/c.$slug.tsx` — full shop-front page component
- `src/routes/c.$slug.enquire.tsx` — the enquiry form (route id `/c/$slug/enquire`)

Because `c.$slug.enquire.tsx` exists, the router treats `c.$slug.tsx` as a **parent/layout route** whose child is `/enquire`. TanStack only renders a child route inside its parent's `<Outlet />`. `c.$slug.tsx` never renders `<Outlet />` — it just renders the shop-front — so the URL matches, the enquire route mounts as a child, but there is nowhere for it to display. The shop-front UI is what you see.

Same class of bug the docs warn about: "Converted a leaf into a layout but kept its old body — children never mount."

## Fix (structural — no visual changes)

Split `c.$slug.tsx` into a pathless layout + an index leaf:

1. **Create `src/routes/c.$slug.route.tsx`** — a minimal layout:
   ```tsx
   import { createFileRoute, Outlet } from "@tanstack/react-router";
   export const Route = createFileRoute("/c/$slug")({
     component: () => <Outlet />,
   });
   ```
2. **Rename** `src/routes/c.$slug.tsx` → `src/routes/c.$slug.index.tsx` and update its `createFileRoute("/c/$slug")` → `createFileRoute("/c/$slug/")`. All existing shop-front code, head metadata, loaders and helpers stay exactly as they are.
3. `c.$slug.enquire.tsx` and `c.$slug.review.tsx` need no changes — they already declare `/c/$slug/enquire` and `/c/$slug/review` and will now mount inside the layout's `<Outlet />`.
4. Let the TanStack Router Vite plugin regenerate `src/routeTree.gen.ts` (never hand-edit).

## Verification

- Visit `/c/jordon-gumbley` → shop-front renders unchanged (same H1, same sections, same head metadata).
- Visit `/c/jordon-gumbley/enquire` → enquiry form page renders (H1 "Send an enquiry…" style, visible `<form>`).
- Click the "Enquire now" button on the shop-front → lands on the form, not the shop-front.
- Same check for `/c/$slug/review`.
- No visual/design change on the shop-front — the LOCKED `/c/$slug` mock-up is preserved.

## Out of scope

- No copy, layout, or styling changes on either page.
- No changes to `pro.$slug.*` redirect stubs.
- No changes to loaders, server functions, or SEO metadata.
