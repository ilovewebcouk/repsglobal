## P1 #7 — `has_role` permissions audit + ghost-subscription guardrails

Two remaining P1 items from the readiness report. Both are read-then-fix passes — no UX surface area.

### Part A — `has_role` permissions audit

**Goal:** confirm no `authenticated` user can elevate themselves via `user_roles`, and that every admin-only RPC/policy actually calls `has_role(auth.uid(), 'admin')` (not a looser check).

**Steps**
1. Query `pg_policies` for every policy on `public.*` that references `user_roles` directly (instead of going through `has_role`) — direct references are the classic recursion/escalation foot-gun.
2. Query `information_schema.role_table_grants` for `user_roles` — confirm `authenticated` has only `SELECT`, and `INSERT/UPDATE/DELETE` are restricted to `service_role`.
3. Grep the codebase for `.from('user_roles')` writes from client-bundled paths (anything not under a `.server.ts` / verified server-fn with admin check).
4. List every SECURITY DEFINER function in `public` and verify each one that mutates roles or admin data calls `has_role(auth.uid(), 'admin')` at the top.
5. Patch any gap found: tighten grants, rewrite offending policies to use `has_role`, add the missing admin guard to any RPC.

### Part B — Ghost subscription guardrails

**Goal:** make it structurally impossible for `stripe.subscriptions` rows to outlive their `auth.users` row again (the Cruz/Raheela class of bug).

**Steps**
1. Add a DB trigger `on_auth_user_deleted_cleanup_subscriptions` on `auth.users` AFTER DELETE that:
   - Marks matching `public.subscriptions` rows as `status = 'canceled'`, `canceled_at = now()`, `cancel_reason = 'user_deleted'`.
   - Writes an `admin_audit_log` entry so we can see ghosts being reaped.
2. Harden the Stripe webhook (`customer.subscription.*`) so that when `resolveUserId()` returns `null` AND no `legacy_stripe_link` row exists, it logs to `payment_events` with `status = 'orphaned'` instead of upserting a row with `user_id = null` (defensive — should already be impossible after the earlier webhook fix, but worth asserting).
3. Add a nightly reconciliation cron `ghost-subscription-sweep-daily` (03:00 UTC) that flags any `subscriptions.status = 'active'` whose `user_id` no longer exists in `auth.users`, writes them to `payment_events` as `orphaned`, and emails the admin team.
4. Add a small `/admin/reconciliation` drift panel "Orphaned subscriptions" reading from that sweep so we never have to hunt manually again.

### Technical notes
- Files touched: `supabase/migrations/<ts>_p1_role_audit_and_ghost_guards.sql`, `src/routes/api/public/payments/webhook.ts`, `src/routes/api/public/hooks/ghost-subscription-sweep.ts` (new), `src/lib/admin/reconciliation.functions.ts`, `src/routes/admin_.reconciliation.tsx`.
- Cron registered via `supabase--insert` (not migration — contains URL + anon key).
- All admin RPC tightening goes in the same migration as Part A.
- No app UI changes beyond the one new drift panel.

### Out of scope
- P2 items (email queue names, confirmation emails, Pro waitlist enforcement) — separate pass after P1 closes.
- Stripe Radar / fraud rules — Stripe-side config, not codebase.

### Acceptance
- Zero policies on `public.*` reference `user_roles` directly.
- `authenticated` cannot INSERT/UPDATE/DELETE on `user_roles`.
- Every admin-mutating SECURITY DEFINER function calls `has_role(auth.uid(), 'admin')`.
- Deleting a user in `auth.users` automatically cancels their subscription rows and writes an audit entry.
- Nightly sweep + admin panel surface any future drift within 24h.
