## What's broken

Clicking any of the three "Apply to become a provider" CTAs on `/training-providers` navigates to `/training-providers/apply`, but the page never renders the apply form — the browser stays on the marketing page (with just its title swapped).

## Root cause

TanStack Router file-based routing treats `src/routes/training-providers.tsx` as the **parent layout** of `src/routes/training-providers.apply.tsx` (child path `/training-providers/apply`). A parent that has children MUST render `<Outlet />` for the child to mount.

`training-providers.tsx` renders `<TrainingProvidersPage />` — the full marketing page, no `<Outlet />`. So the router matches `/training-providers/apply`, mounts the parent (marketing page), and silently drops the child (apply form).

This is exactly the pattern the `tanstack-route-architecture` card warns about: "the page is empty after navigation but the URL is correct — the route matched, but the parent layout has nowhere to render the child."

Everything downstream (`startOrgCheckoutRedirect` → `createOrgCheckoutSession` → Stripe hosted checkout) is wired correctly and never gets a chance to run.

## Fix

Promote `/training-providers` from a leaf into a pathless layout wrapper by renaming files.

### Rename

- `src/routes/training-providers.tsx` → `src/routes/training-providers.index.tsx` (marketing page becomes the `/training-providers` leaf, unchanged).
- Add a new tiny `src/routes/training-providers.tsx` that is the layout:
  ```tsx
  import { createFileRoute, Outlet } from "@tanstack/react-router";
  export const Route = createFileRoute("/training-providers")({
    component: () => <Outlet />,
  });
  ```

### Update the index route

In the renamed `training-providers.index.tsx`, change:
```tsx
createFileRoute("/training-providers")({ ... })
```
to:
```tsx
createFileRoute("/training-providers/")({ ... })
```
(TanStack generates the trailing-slash route ID for `*.index.tsx`.) Head/meta/component stay identical.

### Leave everything else alone

- `training-providers.apply.tsx` — no change.
- `startOrgCheckout.ts`, `org-checkout.functions.ts`, `billing.ts`, `ApplyProviderButton.tsx` — all confirmed correct in this audit, no change.
- No visual change to any locked page.

## QA verification after the fix

1. Load `/training-providers` — marketing page renders exactly as today.
2. Click each of the three "Apply to become a provider" CTAs — each navigates to `/training-providers/apply` and the apply gateway renders (signed-out → signup form; signed-in → "Taking you to Stripe…" then Stripe hosted checkout).
3. Cancel from Stripe → returns to `/training-providers?checkout=canceled` (unchanged behaviour, still valid because the marketing route still exists).
4. Successful test payment → `/checkout/return?session_id=…` handles the redirect.

## Out of scope

Everything the earlier audit already confirmed as wired: Stripe lookup key `training_provider_annual`, auth middleware on the server fn, `attachSupabaseAuth` bearer middleware, webhook handling. No changes there.
