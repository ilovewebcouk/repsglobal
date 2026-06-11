# Real Verified dashboard foundation

## Honest baseline

- `/dashboard` is currently an onboarding checklist, not the professional dashboard.
- `/dashboard-demo` is the locked visual approximation, but its identity, KPIs, notifications, search, clients, revenue and AI content are fake.
- The 18 `/dashboard/*` module screens exist, but most are static mocks and currently sit outside the managed authenticated route tree. `/dashboard/clients` is partly live.
- `/admin` already exists as the separate admin dashboard. Admin sign-in resolves to `/admin`; professional sign-in resolves to `/dashboard`; client sign-in resolves to `/portal`. Admin remains unchanged except for regression checks.

## Build

### 1. Establish a protected professional route area

- Add a pathless professional-role layout beneath the existing managed authenticated layout.
- Move `/dashboard`, the three onboarding routes, and all 18 `/dashboard/*` module files beneath it.
- Preserve every user-facing URL while updating file route IDs; do not edit the generated route tree manually.
- Centralize the professional-role redirect in this layout so admins and clients cannot enter professional routes.
- Add `noindex` metadata to private dashboard routes.

### 2. Turn the mock-up into the real `/dashboard`

- Use `src/mockups/reps_fullpage_professional_dashboard_v1.png` as the locked visual source of truth; treat `/dashboard-demo` only as reusable implementation material.
- Extract the 1,200-line demo overview into focused dashboard components rather than duplicating it into the live route.
- Keep the desktop hierarchy, spacing, cards and responsive grids visually locked.
- Upgrade `ProShell` to accept real member identity, tier, verification and onboarding state.
- Replace hardcoded James Carter identity with the signed-in member’s name/avatar (initials fallback), title, level and real status.
- Replace hand-typed branding with `RepsWordmark`.
- Add a shadcn `Sheet` mobile navigation drawer and responsive page/top-bar spacing; preserve desktop composition.
- Keep `/dashboard-demo` as the public showcase, but remove the live dashboard’s link to it and correct the demo’s misleading canonical/social URL.

### 3. Make Verified truthful and Pro visibly locked

- Expand `getDashboardStatus` with existing profile identity and professional-status fields, plus a normalized tier/entitlement/onboarding summary.
- Show only database-backed Verified information as real: membership tier/status, verification, profile completion, publication, renewal, REPS level and available credential/status dates.
- Do not invent profile views, rank, reviews, revenue, schedules, notifications, search results or other unavailable metrics.
- Preserve the full mock-up composition, but group revenue, clients, leads, schedule, bookings, payments, programmes, reports, AI and other operational areas inside a reusable **Pro preview** treatment.
- Keep previews legible, disable misleading actions, and provide a typed “View Pro plan” link to `/dashboard/start`.
- Apply matching lock state to Pro-only sidebar destinations. Verified-safe routes remain available: dashboard, plan/billing, profile editing, verification and public listing controls.
- Hide/lock the Pro-only quick-add control; remove fake notification counts and non-functional claims.

### 4. Move onboarding into a dismissible dialog

- Extract the current four-step logic: choose plan, complete profile, submit credentials, publish listing.
- Auto-open an accessible shadcn `Dialog` whenever setup is incomplete, unless dismissed during the current browser session.
- Scope the session dismissal key to the signed-in user.
- Keep a persistent “Finish setup — X of 4 complete” trigger in the top bar after dismissal.
- Link each step to the existing functional route; do not duplicate payment, upload, profile or publish logic.
- Remove the dialog and progress trigger automatically once all four steps are complete.
- Keep the dashboard shell visible behind the dialog and provide skeleton, retry and friendly failure states for the real status query.

### 5. Enforce Pro entitlement beyond the UI

- Add a small reviewed backend migration with a reusable active-tier entitlement helper using the existing live billing statuses (`active`, `trialing`, `past_due`, `unpaid`).
- Replace the professional `client_roster` policy so only active Pro/Studio members can manage their roster; retain admin management and invited-client own-row reads.
- Update all authenticated roster server-function entry points to assert active Pro/Studio entitlement, preventing direct calls that bypass the locked UI.
- No new tables or user-data migration are required.

### 6. Keep module scope honest

- Preserve all 18 module screens as authenticated static previews, as requested.
- Do not claim they are wired. Only `/dashboard/clients` currently uses real roster data, and it will be Pro-gated.
- Build real data contracts, permissions and interactions one module at a time in later milestones.
- Fix only audit-blocking token/radius violations encountered in moved files; do not redesign locked module bodies.

### 7. Validate and document

- Verify professional, admin and client role redirects, including admin-first behavior for multi-role accounts.
- Verify direct `/dashboard/*` access requires authentication and professional role.
- Verify a Verified member cannot reach or call the live roster module directly, while Pro retains access.
- Verify onboarding auto-open, session dismissal, progress reopening and completed-state removal.
- Check desktop and mobile navigation, loading/error states, keyboard/focus behavior and typed links.
- Run the REPs Build Compliance audit and the project’s automatic build/type checks.
- Update `docs/09_phase2_verified.md` to record the actual shipped dashboard foundation and leave individual module wiring in Phase 2.1+.

## Result

Verified members land on a genuine, truthful professional command centre matching the approved mock-up, with onboarding overlaid and Pro capabilities clearly previewed—not faked. Admins continue to land on the separate, role-gated `/admin` dashboard.