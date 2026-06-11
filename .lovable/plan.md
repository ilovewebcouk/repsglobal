# Phase A — QA Sweep: Signup → Role → Dashboard Routing

Read-only investigation. No code changes. Output is a triaged findings report grouped by severity (P0 blocks launch / P1 broken-but-workaround / P2 polish), each with file:line evidence and a proposed fix. Fixes happen in a follow-up build loop after you approve the triage.

## Scope (in)

1. **Signup paths**
   - Professional email/password signup → `handle_new_user` trigger → `profiles` + `user_roles('professional')` + `professionals` rows created
   - Client email/password signup (via invite token + standalone) → `profiles` + `user_roles('client')` + `clients` rows
   - Google OAuth signup for both kinds (does `signup_kind` survive the OAuth round-trip?)
   - Admin seed `pros@repsuk.org` — confirm `user_roles('admin')` present
   - Invite-accept flow → `accept_client_invite` RPC behaviour

2. **Role assignment + tier**
   - Every signed-up user has exactly one expected `user_roles` row
   - `subscriptions.tier` resolves correctly for Verified vs Pro vs none
   - `has_role` and `has_active_tier` return expected values for sample users

3. **Dashboard routing**
   - `/auth` → correct post-login redirect by role (pro → `/dashboard`, client → client area, admin → `/admin`)
   - `_authenticated/route.tsx` gate behaviour (signed-out, signed-in, role mismatch)
   - `_authenticated/_professional/*` gate (if present) — does a Verified user reach Pro-only pages?
   - `/admin/*` — does a non-admin user get bounced?
   - Tier-aware nav: Verified user currently sees full Pro nav (expected gap — log it, don't fix here)
   - Hard-refresh on a deep protected URL (e.g. `/dashboard/clients/abc`) — no redirect loop, no auth flash

4. **Evidence gathering (read-only)**
   - `supabase--read_query` against `auth.users` (recent), `profiles`, `user_roles`, `professionals`, `clients`, `subscriptions`, `payment_events`, `client_invites` for the last ~20 signups
   - `supabase--analytics_query` on `auth_logs` for signup errors / 4xx-5xx
   - `rg` sweep of `src/routes/_authenticated/`, `src/routes/auth*.tsx`, `src/routes/admin*`, `src/lib/billing.ts`, `handle_new_user` references
   - Browser-driven smoke of `/auth` (sign-in form only — no destructive actions, no new account creation in prod data)

## Scope (out — explicitly deferred)

- Stripe checkout end-to-end (Phase A2, separate sweep)
- Verified-shell build, shared-primitive extraction (Phase B)
- Visual / token / radius audit of dashboard chrome (Phase B post-flight)
- Any code edits, migrations, or RLS changes
- Admin dashboard functionality (Phase D)

## Deliverable

A single triage report in chat with:

```text
P0 (blocks launch)
  - <symptom> — <file:line or query evidence> — <proposed fix>
P1 (broken, has workaround)
  - ...
P2 (polish)
  - ...
Healthy (verified working)
  - ...
```

Plus a recommendation on whether to fix P0s immediately or proceed to Phase B and batch fixes.

## Approach / order of operations

1. Map the auth surface: read `src/routes/auth*.tsx`, `_authenticated/route.tsx`, any `_professional` / `_admin` layouts, `handle_new_user`, `accept_client_invite`.
2. Pull last 20 signups + their `user_roles` / `profiles` / `professionals` / `clients` / `subscriptions` rows; flag any mismatches.
3. Check `auth_logs` for the last 24h of signup/sign-in errors.
4. Browser-smoke `/auth` page render + sign-in form validation (no submissions against prod accounts).
5. Static-trace each role's expected post-login route and gate behaviour.
6. Compile triage report.

## Risks / assumptions

- Read-only — no risk to data.
- Assumes the user does NOT want me to create new test accounts in the live Supabase project. If you want a real end-to-end signup test, say so and I'll do it in a separate loop with a throwaway email.
- Verified-tier users currently seeing the full Pro nav is **expected** until Phase C and will be logged as a known gap, not a P0.
