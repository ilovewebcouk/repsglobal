# Unlock training-provider dashboard + Website tab

## Confirmation: does the plan exist?

Yes. `subscriptions.tier` enum already includes `training_provider`, `src/lib/billing.ts` defines `ORG_TIERS.training_provider` (£499/yr, `stripePriceLookupKey: "training_provider_annual"`, `stripeProductId: "training_provider"`), and admin surfaces (`admin_.members.tsx`, `metrics-definitions.ts`, `professionals.functions.ts`) already recognise the plan. What's missing is the front-of-app pricing page and the trainer-side unlock — this plan handles the unlock. Pricing page is out of scope.

## What's blocking training providers today

`src/routes/_authenticated/_professional/route.tsx` gates access with `PAID_TIERS = ["verified", "pro", "studio"]` and redirects everything else to `/pricing`. A training provider with an active `training_provider` subscription can therefore never reach `/dashboard`. Downstream, `Tier` (`DashboardShell.types.ts`) and `useTrainerTier` are typed to the same three values, and `nav-data.ts` only ships `VERIFIED_NAV` / `PRO_NAV`.

## Changes

### 1. Let training providers through the auth gate
- `src/routes/_authenticated/_professional/route.tsx`
  - Add `"training_provider"` to `PAID_TIERS`.
  - Widen the `trainerTier` cast to `"verified" | "pro" | "studio" | "training_provider"`.

### 2. Extend the tier type
- `src/components/dashboard/DashboardShell.types.ts`: `export type Tier = "verified" | "pro" | "studio" | "training_provider"`.
- `src/lib/dashboard/useTrainerTier.ts`: return the widened type.
- Audit consumers surfaced by tsc (shell role logic, upsell strips, guards). Where existing branches only care about verified/pro/studio, add an explicit `training_provider` branch that falls back to the Verified-style layout to keep behaviour predictable.

### 3. Sidebar for training providers
- `src/components/dashboard/nav-data.ts`: add `TRAINING_PROVIDER_NAV` — Account (Dashboard, Verification, Settings), Deliver (**Website**, Support). No Reviews / Enquiries / CPD / Pro-only sections. Extend `TrainerActive` to union in the new labels.
- `src/components/dashboard/DashboardShell.tsx` (and `DashboardSidebar.tsx` if it picks a nav set): when `tier === "training_provider"`, use `TRAINING_PROVIDER_NAV`.

### 4. Dashboard hub content for training providers
- `src/routes/_authenticated/_professional/dashboard.tsx`: when `isOrganisation` (already computed) or `tier === "training_provider"`, hide coach-only KPI/hub sections (enquiries, reviews snapshot, CPD mini, Pro upsell, verification banner tuned for coaches) and render a lean provider hub: welcome banner + a placeholder "Provider overview" panel + Website completeness. Keep the existing "Training provider" pill (already added).
- Leave `getDashboardStatus` alone; it already returns `accountType`.

### 5. Website tab → new provider editor
- New route `src/routes/_authenticated/_professional/dashboard_.provider-website.tsx` — provider-specific editor scaffold with sections: Basics (provider name, tagline, about), Accreditations, Courses (placeholder list), Tutors (placeholder list), Publish. Uses `DashboardShell` with `active="Website"`.
- The sidebar "Website" entry in `TRAINING_PROVIDER_NAV` points to `/dashboard/provider-website` so coach and provider editors stay fully separate.
- Data layer: new `src/lib/provider-website/provider-website.functions.ts` with `getMyProviderWebsite` / `upsertMyProviderWebsite` server functions. First pass reads/writes `professionals` + a new `provider_websites` table via a follow-up migration — this plan wires the UI to server functions that return empty scaffolds so the editor renders end-to-end without the migration. Real persistence is a follow-up.
- `/t/$slug` (public) is untouched in this plan; once persistence lands it will read from `provider_websites`.

### 6. Guardrails
- `dashboard_.website.tsx` (coach editor): if `tier === "training_provider"`, redirect to `/dashboard/provider-website` so a stray link never lands them in the coach editor.
- `_pro/route.tsx` (Pro-only subtree) already gates on Pro/Studio — training providers won't reach it. Add an explicit reject just in case.

## Out of scope
- Public pricing page for the training-provider plan.
- Persistence schema (`provider_websites` table + RLS + GRANTs) — tracked as a follow-up migration.
- Any change to `/t/$slug` public page.
- Coach-side website editor.
