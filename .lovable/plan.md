# Fix: Verification pill shows `0/3` on organisation accounts

## Diagnosis

`VerificationCountBadge` in `src/components/dashboard/DashboardSidebar.tsx` chooses which pill to render (`x/2` for orgs, `x/3` for individuals) based on `useIsOrganisation()`. That hook is a `useQuery` around `getMyAccountType` and returns `false` until the request resolves (`data?.accountType === "organisation"`).

Result: while the account-type query is still in-flight (or if it ever fails / returns undefined), the badge falls through to the **individual** branch and renders `0/3` — even for organisation accounts. Once the query resolves it should flip to `x/2`, but the initial paint is wrong on every dashboard navigation, and if the query hasn't resolved before the sidebar unmounts (fast route change, offline, RLS hiccup) the org will keep seeing `0/3`.

Confirmed in DB: `demo-org-northline@repsuk.org` and `demo-org-forge@repsuk.org` are correctly stored as `account_type = 'organisation'`, so the data is right — this is purely a client-side loading-state bug.

## Fix

Update `VerificationCountBadge` (`src/components/dashboard/DashboardSidebar.tsx`, ~lines 101–136) so it:

1. Also reads the `useQuery` **status** (not just `data`) from the account-type lookup.
2. While account type is still loading (or errored/unknown), renders nothing (`return null`) instead of defaulting to the individual `/3` chip. The chip is a soft badge; hiding it briefly is preferable to flashing the wrong denominator.
3. Only after `accountType` is known:
   - `"organisation"` → render `x/2` chip as today (identity + domain).
   - anything else → render `x/3` chip as today (identity + qualifications + insurance).

Concretely: split the account-type query out of the `useIsOrganisation` boolean helper (or inline the query inside `VerificationCountBadge`) so the badge has access to `isPending` / `data`, and gate the render on `data !== undefined`.

No other call site of `useIsOrganisation` needs to change — the loading-state bug only produces a visible wrong value here.

## Verification

- Sign in as `demo-org-northline@repsuk.org` → sidebar shows `x/2` (no `/3` flash).
- Sign in as an individual account → still shows `x/3` as before.
- Hard refresh on `/dashboard/profile` → no initial `0/3` flash for orgs.

## Out of scope

- Changing what counts toward the org pill (still identity + domain).
- Redesigning `VerifiedCountChip`.
- Any DB / migration changes — data is correct.
