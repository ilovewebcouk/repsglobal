Move the full verification status banner (green pill + "Your REPS credential is live" heading + subcopy + "Manage →" link) to the top of the main Dashboard page, and remove it from the sidebar.

## Changes

**`src/routes/_authenticated/_professional/dashboard.tsx`** (main dashboard page)
- Add a new `<DashboardVerificationBanner />` as the FIRST block on the page, above whatever currently renders at the top.
- Banner layout (matches the uploaded screenshot):
  - Left: `VerifiedBadge` pill (Verified · Insured · <Profession>) — uses existing `tierFromCounts` + `getTrustState` data.
  - Middle: `Your REPS credential is live` (h3) + subcopy `Identity, insurance and qualifications all verified.` — subcopy adapts to tier (e.g. "Add insurance to unlock the full credential." when partial).
  - Right: `Manage →` link styled in brand orange, routes to `/dashboard/verification`.
  - Wrapped in a `rounded-[18px] border border-emerald-400/30 bg-emerald-500/10` panel (emerald because status semantics — allowed per `mem://design/status-colors`).
  - Fully clickable as a `<Link to="/dashboard/verification">` wrapper so clicking anywhere on the row navigates.

**`src/components/dashboard/DashboardVerificationBanner.tsx`** (new)
- Self-contained component: reads session user via `useSessionUser`, calls `getTrustState` server fn with `useServerFn` + `useQuery`, computes tier via `tierFromCounts`, renders `VerifiedBadge` + copy + Manage link.
- Renders nothing (or a subtle skeleton) while loading; hides entirely for admin role.

**`src/components/dashboard/DashboardSidebar.tsx`**
- Delete the `VerificationSidebarPill` function (lines ~225–260-ish).
- Revert the render slot: `{role === "admin" ? <AdminBadgeRow /> : <VerificationSidebarPill />}` → `{role === "admin" ? <AdminBadgeRow /> : null}`.
- Remove now-unused imports (`VerifiedBadge`, `tierFromCounts`, `getTrustState`, `useServerFn`, `useSessionUser` if not used elsewhere in the file). Keep `VerifiedCountChip` only if still referenced.

No other tabs, business logic, or verification-page code changes.