# Separate the training-provider dashboard from the trainer dashboard

## Why

Today a training provider and a trainer render the **same files**. Only the sidebar and one branch on the dashboard home differ. If you edit `dashboard_.settings.tsx` or `dashboard_.verification.tsx` to change what a provider sees, you change what a trainer sees at the same time. That's fragile and it will bite us the moment provider-specific settings (org details, courses, staff seats) diverge from trainer settings.

The fix is a physical file split: providers get their own route tree, their own settings, their own verification, their own home — under the same `/dashboard/*` URLs the user already knows.

## What the user will see

- Same URL bar (`/dashboard`, `/dashboard/settings`, `/dashboard/verification`, `/dashboard/support`, `/dashboard/provider-website`) — nothing to relearn.
- Trainers keep exactly the pages they have today, untouched.
- Training providers get a dedicated home, settings, verification and support that we can evolve without touching trainer pages.
- Sidebar is already correct for providers (Dashboard, Verification, Support, Settings) — no visual change on this pass.

## Scope of this pass (v1)

We split the shell only. **We do not redesign** provider settings / verification / home content yet — v1 duplicates today's provider-visible content into the new files so nothing regresses. Redesigns (org-only settings fields, provider verification flow, courses & CPD dashboard, learner enquiries) come in a follow-up pass.

Out of scope for v1:
- New provider-only content sections (courses, learner enquiries, reviews-for-providers) — planned but not built here.
- Any change to trainer pages.
- Any URL change. `/dashboard/*` stays.

## Structure after the split

```text
src/routes/_authenticated/
├── _professional/                  (trainer-only, unchanged)
│   ├── route.tsx                   gate: redirects tier=training_provider away
│   ├── dashboard.tsx
│   ├── dashboard_.settings.tsx
│   ├── dashboard_.verification.tsx
│   ├── dashboard_.support.*.tsx
│   └── ...
└── _organisation/                  NEW pathless layout for providers
    ├── route.tsx                   gate: requires tier=training_provider
    ├── dashboard.tsx               provider home (isOrganisation branch moves here)
    ├── dashboard_.settings.tsx     provider settings (org name, billing contact, seats)
    ├── dashboard_.verification.tsx provider verification (org identity, insurance)
    ├── dashboard_.support.*.tsx    provider support (thin wrapper for now)
    └── dashboard_.provider-website.tsx  moves here from _professional/
```

Both pathless layouts claim the same `/dashboard/*` URL space; the gates make sure only one matches per user.

## Routing gates

- `_professional/route.tsx` — if `tier === "training_provider"`, `redirect({ to: "/dashboard" })` and let the `_organisation` gate pick it up. Otherwise behave as today.
- `_organisation/route.tsx` — mirror of `_professional/route.tsx` but only accepts `tier === "training_provider"`. Any other tier is redirected into `_professional`. Impersonation status is honoured the same way.
- Because file-based routing generates the tree at build time, we add a small tie-breaker: the trainer gate throws the redirect first when the tier is provider, so the router falls through to the organisation branch cleanly. No shared component imports across the two trees.

## Data & backend

- **No schema changes.** Provider vs trainer is already `subscriptions.tier = 'training_provider'`.
- Server functions currently used by both (e.g. `getDashboardStatus`, `getTrustState`) stay shared — they already return provider-shaped data when the caller is an org. Only the *routes* are duplicated, not the data layer.
- `syncMySubscription`, billing, impersonation — untouched.

## Files touched

New:
- `src/routes/_authenticated/_organisation/route.tsx`
- `src/routes/_authenticated/_organisation/dashboard.tsx` (extracts today's `isOrganisation` branch)
- `src/routes/_authenticated/_organisation/dashboard_.settings.tsx` (copy of trainer settings, provider-relevant tabs only)
- `src/routes/_authenticated/_organisation/dashboard_.verification.tsx` (copy, keeps existing three-step trust flow)
- `src/routes/_authenticated/_organisation/dashboard_.support.tsx` + `.index.tsx` + `.$id.tsx` + `.new.tsx` (thin re-exports for v1)
- Move `dashboard_.provider-website.tsx` into `_organisation/`.

Edited:
- `src/routes/_authenticated/_professional/route.tsx` — add "redirect provider to /dashboard" line so the organisation tree catches it.
- `src/routes/_authenticated/_professional/dashboard.tsx` — drop the `isOrganisation` branch (dead code once split lands).
- `src/routes/_authenticated/_professional/dashboard_.website.tsx` — drop its "redirect provider" line (no longer reachable).

Untouched (guaranteed): every other trainer file, `nav-data.ts`, `DashboardShell`, server functions, database, styles.

## Verification once implemented

1. Sign in as `demo-org-forge@repsuk.org` → land on `/dashboard`, see provider home, provider-only sidebar. Navigate to `/dashboard/settings` → renders the new `_organisation/dashboard_.settings.tsx`.
2. Sign in as a trainer → `/dashboard/settings` still renders the trainer file. Diff shows zero lines changed in `_professional/dashboard_.settings.tsx` or `dashboard_.verification.tsx`.
3. Impersonate the demo provider from an admin account → same result as (1).
4. Grep confirms no provider route imports a `_professional/*` file, and vice versa.

## What this unlocks next (not in this plan)

Once the trees are physically separate, we can safely design:
- Provider settings: organisation name, billing contact, staff seats, invoice email.
- Provider verification: company house / awarding-body proof, insurance for the org, primary contact ID.
- Provider home v2: courses published, learner enquiries, verified pros linked, review rating.
- Provider-only reviews / enquiries routes.

Each of those becomes an isolated edit to `_organisation/*` with zero risk to trainers.
