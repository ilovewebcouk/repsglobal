# Verification gating + onboarding prompt

Front-load the three-step trust flow (Identity → Qualifications → Insurance) for every professional, including existing accounts.

## Behaviour

**Hard gate — Identity**
- Until `trustState.identity.status === "approved"`, the entire `/dashboard/*` subtree is replaced by a full-screen "Verify your identity" wall.
- Wall offers two states:
  - **Not started / rejected / needs_more_info** → primary CTA "Start ID check" launches the existing identity flow on `/dashboard/verification#identity`.
  - **Pending** (submitted, in review) → "We're reviewing your ID — usually under 24h." CTA: contact support. No bypass.
- Allow-list of routes that remain accessible while gated: `/dashboard/verification`, `/dashboard/settings` (billing/account only), `/dashboard/support`, `/dashboard/syncing`. Everything else (enquiries, profile editor, services, shop-front, reviews, CPD, etc.) is replaced by the wall.
- Admin impersonation bypasses the gate (so admins can still view-as).
- Public profile `is_published` stays false while identity is not approved (already enforced by existing logic — verify, no change needed).

**Soft gate — Qualifications + Insurance**
- Once identity is approved, dashboard unlocks fully.
- A **dismissible** `VerificationPromptDialog` appears on every login until `trustState.completedCount === 3`:
  - 3 numbered rows mirroring `VerificationCard` (Identity ✓ locked-green, Qualifications, Insurance) with per-row status pill and CTA.
  - "Remind me later" closes for the current tab session (sessionStorage key `reps.verify-prompt.dismissed.<userId>`).
  - Reappears on next login / next tab.
  - Suppressed entirely when all 3 are green.
- `VerificationCard` stays pinned at top of `/dashboard` (already present) — no change to its placement.

## Implementation

### 1. Shared gate hook
`src/lib/verification/useIdentityGate.ts` — wraps `getTrustState`, returns `{ status, isGated, isPending }`. `isGated = status !== "approved"`.

### 2. Full-screen wall component
`src/components/dashboard/verification/IdentityGateWall.tsx` — uses dashboard tokens (dark, `bg-reps-panel`, `border-reps-border`, `DashboardButton` primary). Renders inside `DashboardShell` so sidebar/topbar stay visible (user can sign out, reach support, billing).

### 3. Wire the gate in `_professional/route.tsx`
- In `beforeLoad`, after the existing paid-tier check, fetch `getTrustState` (server-side, already auth-middleware'd).
- Return `identityGated: boolean` and `identityStatus` on the route context.
- Skip when `isImpersonating`.
- Do NOT redirect — child routes read context and render the wall themselves (so the URL stays intact and the allow-list works).

### 4. Per-route enforcement
Create `src/components/dashboard/verification/withIdentityGate.tsx` — a small wrapper that reads route context and:
- Renders children if `!identityGated` or current route is on the allow-list.
- Otherwise renders `<IdentityGateWall />` inside the same `DashboardShell` the route would have used.

Apply to every gated route component (`dashboard.tsx`, `dashboard_.enquiries.tsx`, `dashboard_.profile.tsx`, `dashboard_.services.tsx`, `dashboard_.shop-front.tsx`, `dashboard_.reviews.tsx`, `dashboard_.cpd.tsx`, all `_pro/*` routes). Mechanical wrap — one line per file.

### 5. Onboarding dialog
`src/components/dashboard/verification/VerificationPromptDialog.tsx` — uses `Dialog` from `src/components/dashboard/ui/dialog.tsx`. Reuses `VerificationCard`'s `deriveSteps` logic so the two stay in sync.

Mount once in `_professional/route.tsx` component (next to `<Outlet />`), gated on:
- identity approved
- `completedCount < 3`
- not in sessionStorage dismissed set for this user

### 6. Existing-user coverage
No data migration needed — the gate evaluates `trustState` live, so any pre-existing account without an approved identity hits the wall on next page load.

## Out of scope
- Changing the actual identity submission flow (Stripe Identity / doc upload) — already shipped.
- Email nudges to dormant un-verified users (separate campaign).
- Changing `is_published` logic.

## Open question
Should `/dashboard/profile` be in the allow-list? Argument for: pros want to draft bio/photos while ID is in review. Argument against: keeps the funnel single-minded. **Recommendation: NOT in allow-list** — drafting before ID approval is low-value and dilutes the gate. Confirm before I build.
