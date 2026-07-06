
## Goal

Bring `/admin/training-providers` up to the same bar as `/admin/professionals` and the Member 360 workbench at `/admin/members/$userId`. Same primitives, same header pattern, same tab shape, reviews live inside the provider — not a separate top-level tab.

Reference points I'll match:
- List: `src/routes/admin_.professionals.tsx` (segmented tabs, sort dropdown, filters, avatar + name + `@slug`, dense table, `…` row actions).
- Detail: `src/routes/admin_.members.$userId.tsx` (`StickyHeader` with actions row: **View website**, **Edit**, **Login as owner**, **Send email**, then `Tabs` with **Overview → Subscription → Courses → Reviews → Activity → Notes**).

## Plan

### 1. List page — `admin_.training-providers.index.tsx`
Replace the current table with the professionals-style shell:
- Segmented tabs: **All · Active · Draft · Suspended · Cancelled**.
- Sort dropdown (Joined / Name / Plan value / Renewal date / Courses / Reviews) with asc/desc toggle.
- Filter sheet: tier, published state, has-courses, has-reviews, city, country, has-Stripe.
- Row shape mirrors the professional row: circular logo (fallback initials via `initialsFromName`), **Name** as link + `@slug` underneath, columns for Location, Plan (tier badge), Status, Lifetime value, Renewal date, Plan MRR, Joined, then a `…` `DropdownMenu` (View website, Edit, Login as owner, Send email, Publish/Unpublish, Suspend, Delete).
- Reuse `PCard`, `DashboardShell`, `NameWithIdTooltip`-equivalent tooltip showing `org.id`.
- Remove the "Reviews queue" pill from the header — reviews live on each provider.

### 2. Detail page — `admin_.training-providers.$id.tsx`
Rebuild as a Member-360-shaped workbench:

**Sticky header** (matches `StickyHeader` in `admin_.members.$userId.tsx`):
- Left: avatar/logo, provider name, `@slug`, status pill, tier chip, membership # chip.
- Right actions (blue buttons, in this order): **View website**, **Edit details**, **Login as owner** (impersonate primary contact), **Send email** (to primary contact).
- Below actions: quick ID row (Org ID, Stripe customer id, Slug) with copy-on-click chips like `IdRow`.

**Tabs** (default `overview`):
1. **Overview** — KPI grid (Courses, Reviews avg + count, Enquiries 30d, Lifetime value, MRR, Renewal date, Join date), Contact Information card (name, email, phone, address), Membership Information card (plan, join date, last activity), recent reviews (last 3), recent courses (last 3), activity feed teaser.
2. **Subscription** — full Stripe panel: current sub, tier, status, price, next renewal, coupon, invoice history table with "View in Stripe" links. Mirrors `BillingPane`.
3. **Courses** — existing add/edit/delete UI, cleaned up to use Member-360 panel styling.
4. **Reviews** — moved from the top-level `admin_.training-providers.reviews.tsx` into this tab, scoped to this provider only, with the same Published / Flagged / Evidence-requested / Pending / Removed sub-tabs and moderation actions.
5. **Activity** — audit trail (publish/unpublish, course changes, review moderations, subscription events).
6. **Notes** — admin-only internal notes (same primitive as Member 360 notes).

**Global reviews queue** stays reachable, but demoted:
- Keep `admin_.training-providers.reviews.tsx` as a cross-provider moderation queue linked from the admin sidebar under "Content & Discovery → Provider reviews" for triage across all orgs.
- Remove the "Reviews queue" chip from the training-providers list header (it's now per-provider inside the Reviews tab).

### 3. Server functions — `src/lib/training-providers.functions.ts`
Add / extend:
- `getOrganisation` returns the fuller shape needed by Overview (contact block, membership block, KPIs, recent reviews, recent courses).
- `listOrganisationReviews({ orgId, status })` for the per-provider Reviews tab (reuse existing moderation fn for actions).
- `getOrganisationActivity({ orgId })` for the Activity tab.
- `sendOrganisationOwnerEmail`, `impersonateOrganisationOwner` (thin wrappers over the existing member impersonation flow, targeting the linked user if one exists — otherwise the action is disabled with a tooltip).

### 4. Nav
Update `src/components/dashboard/nav-data.ts`:
- Keep "Training Providers" as the primary link.
- Rename the standalone "Provider Reviews" entry to **"Provider reviews queue"** and move it directly under Training Providers as a secondary link (still available for cross-provider triage, but no longer the primary reviews surface).

### 5. QA checklist (done at end)
- Row click and Name click both open the detail page (matches professionals).
- Sticky header, tab bar, and panel radii/tokens match Member 360 exactly (no ad-hoc rounded-xl / bespoke borders).
- Every action button (View website, Edit, Login as owner, Send email) is visible without opening a menu, matching the screenshots.
- Reviews tab loads inside the provider — no navigation away.
- Typecheck clean; visit `/admin/training-providers` and `/admin/training-providers/$id` in the preview and screenshot both to confirm parity with `/admin/professionals` and `/admin/members/$userId`.

## Notes / call-outs

- I'll use a subagent to do the parallel implementation of (a) list rebuild and (b) detail rebuild, since they touch different files, then reconcile shared server-fn additions.
- No visual changes to the public `/providers/$slug` website in this pass — this is admin-only.
- No schema migration is required for the reshape; only server-fn return shapes grow.
