## Goal

1. Rename the admin "Professionals" surface to "Members" — sidebar, page heading, and route.
2. Add "Training Provider" as a value in the existing tier filter so providers can be filtered alongside Core / Pro / Studio / Free.

## Scope

### 1. Route rename `/admin/professionals` → `/admin/members`

- Copy `src/routes/admin.professionals.tsx` (and any `admin.professionals.*.tsx` children, if present) to `admin.members.*.tsx`, updating each `createFileRoute("/admin/professionals...")` string.
- Add a redirect route at `admin.professionals.tsx` using `beforeLoad` → `redirect({ to: "/admin/members" })` so bookmarks and internal links keep working.
- Delete the old page body (replaced by the redirect shim).
- Update in-app links pointing at `/admin/professionals` to `/admin/members` (nav config, cross-links from Member Timeline, Verification, Billing, etc.). Redirect shim covers anything missed.

### 2. Label rename

- `src/components/dashboard/nav-data.ts` → `ADMIN_NAV` "Professionals" item: label `"Members"`, `to: "/admin/members"`. Keep the `Users` icon.
- Page-level heading, breadcrumbs, `<title>` / `head()` meta on the new route: "Members".
- Leave the underlying `professionals` table, server functions (`getAdminProfessionals`), KPI names, and docs untouched — this is a UI rename only.

### 3. Tier filter — add "Training Provider"

- Current tier filter reads `subscriptions.tier` (verified/pro/studio/free → Core/Pro/Studio/Free).
- Add a synthetic tier option "Training Provider" derived from `professionals.account_type = 'organisation'`.
- Server: extend `getAdminProfessionals` (or its filter input) to accept `tier: "training_provider"` and, when set, filter rows where `account_type = 'organisation'` (ignoring subscription tier). Include `account_type` in the row payload so the list can show a "Training Provider" badge in the tier column regardless of the active filter.
- Client: add "Training Provider" to the tier filter dropdown options; render "Training Provider" as the tier pill for any row with `account_type = 'organisation'` (takes precedence over the Core/Pro/Studio/Free label).

### 4. Memory update

- Update `mem://index.md` core rule: admin surface uses "Members" as the umbrella term; note this intentionally overrides the Professional vs Member distinction in `docs/admin-v2/04`.
- Add a short constraint memory recording the override so future agents don't "correct" it back.

## Out of scope

- No schema changes. No rename of the `professionals` table, columns, RPCs, or server-function names.
- No changes to KPI definitions, Member Timeline, or docs under `docs/admin-v2/` (docs still describe the underlying data model correctly).
- No changes to `/c/$slug` or `/t/$slug` public pages.

## Technical notes

- Route redirect pattern (matches existing `/c` ↔ `/t` shim already in the repo):
  ```ts
  export const Route = createFileRoute("/admin/professionals")({
    beforeLoad: () => { throw redirect({ to: "/admin/members" }); },
  });
  ```
- Tier filter: since `account_type` lives on `professionals` and tier lives on `subscriptions`, the "Training Provider" option is a filter on the base table — no join gymnastics needed, just an added `.eq("account_type", "organisation")` branch.
- Row rendering precedence for the tier pill: `account_type === 'organisation'` → "Training Provider"; else existing tier label map.

## Acceptance

- Sidebar shows "Members" under Members & Pros, linking to `/admin/members`.
- `/admin/members` renders the current professionals list unchanged (data, columns, KPIs).
- `/admin/professionals` redirects cleanly to `/admin/members` (no flash).
- Tier filter dropdown includes "Training Provider"; selecting it shows only `account_type = 'organisation'` rows (Northline, Forge, etc.).
- Provider rows display a "Training Provider" tier pill regardless of active filter.
