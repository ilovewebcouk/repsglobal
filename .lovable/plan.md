## Problem

`/dashboard/services` still treats Shop-front and the "Most popular" highlight as **Pro-only**, but our current policy (per recent work on `/c/$slug`) is that Verified/Core members get a shop-front too. So the "Unlock your Shop-front" upsell card and the "Pro-only" copy on the Add-service form are stale and misleading.

## Scope

Frontend-only edit to `src/routes/_authenticated/_professional/dashboard_.services.tsx`. No backend, no schema, no other surfaces.

## Changes

1. **Remove the upsell block** (lines ~191–217): delete the entire `{tier === "verified" ? (...) : null}` "Unlock your Shop-front / See the Shop-front · Compare plans" card. Every tier already has a shop-front, so the upsell is wrong.

2. **Remove the Pro-only gate on "Most popular" highlight** in the Add-service form:
   - Drop the `isPro` check around the checkbox so all tiers can mark a card as Most popular.
   - Replace the placeholder `"Most popular" highlight is Pro-only` with neutral copy (e.g. `Mark one card as "Most popular"` or remove the placeholder line).
   - Update the existing card render so `s.is_featured` displays regardless of tier (drop `&& isPro` on line 486).
   - In the save handler (line 429), persist `is_featured` for all tiers (drop the `isPro ? ... : false` ternary).

3. **Out of scope**: the `tier` prop / `useTrainerTier()` hook stays — it may still be useful for future differentiation. We're only removing the stale Shop-front upsell and Most-popular gate. No changes to `/c/$slug`, marketing pages, pricing, or `useTrainerTier` itself.

## Verification

- View the page as Katie Gibbs (Core tier): the "Unlock your Shop-front" card is gone, and the "Most popular" highlight is available in the Add-service form.
- View as a Pro tier user: nothing changes (they already had access).
- No TS errors from the removed `isPro` references.

## Out of scope (flag, don't touch)

- Marketing pages still frame Shop-front as a Pro/Studio differentiator (`/features/shop-front`, `/pricing`, comparison matrices). Those are locked pages and need a separate, explicit pass to re-tier Shop-front as a Core+ feature across marketing. Want me to queue that as the next task?