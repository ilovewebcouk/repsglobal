## Problem

When a training provider views `/dashboard/verification`, the sidebar shows trainer-only items (Clients, Programs, Nutrition, Check-Ins, Leads, etc.) instead of the provider-scoped nav.

## Cause

`ProviderVerificationPage` in `src/components/dashboard/organisation/VerificationPage.tsx` renders:

```tsx
<DashboardShell tier={tier === "verified" ? "verified" : "pro"} ... />
```

That forces the `pro` tier, so `DashboardSidebar` picks `PRO_NAV`. The correct tier for a training provider is `"training_provider"`, which maps to the already-defined `TRAINING_PROVIDER_NAV` (Dashboard, Verification, Reviews, Support, Settings).

## Fix

One-line change in `src/components/dashboard/organisation/VerificationPage.tsx`: pass `tier="training_provider"` to `DashboardShell` (we're inside the provider-only branch of `RootVerificationPage`, so the tier is known). Remove the now-unused `useTrainerTier` call in this component.

No other files need changes — the provider nav already exists.
