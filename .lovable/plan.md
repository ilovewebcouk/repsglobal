## Goal

Take readiness from **88 → 100**. Skip the A-8 email design polish (templates look fine).

That leaves three open items from the last regression report:

| ID | Pts | Item |
|---|---|---|
| F-E-04 | 4 | `email_send_log` shows phantom "pending" rows because the logger INSERTs a new row per status instead of UPDATEing the existing one by `message_id`. Health tile misreads. |
| A-6 | 3 | `_authenticated/route.tsx` is integration-managed but has been hand-edited (custom `DashboardTooltipProvider`/`Toaster` wrapper). Needs to be brought back to the canonical contract so future template updates don't conflict, without losing the providers. |
| R-2 | 5 | 101 Supabase linter warnings — 5 permissive `USING (true)` RLS policies + 96 `SECURITY DEFINER` functions executable by `anon`/`authenticated`. Most are legitimate RPCs; the 5 permissive policies + any genuinely sensitive RPCs need re-scoping. |

Total: **12 pts → 100/100**.

---

## Part 1 — F-E-04: fix `email_send_log` lifecycle (4 pts)

**Problem:** today the pipeline does `INSERT status='pending'` → later `INSERT status='sent'` / `delivered` / `failed`, all keyed by the same `message_id`. The "pending" row never goes away, so `/admin/health`'s "stuck pending" tile counts ~8 phantoms.

**Fix:**
1. Migration: add `UNIQUE (message_id)` on `email_send_log` (after de-duping existing rows: keep the most-advanced status per `message_id`).
2. Replace every follow-up `INSERT` with an `UPSERT` on `message_id` (`onConflict: 'message_id'`) that bumps `status` + `updated_at` + `error_message`. Touch points:
   - `src/lib/email/send.server.ts` (pending insert stays an insert)
   - `src/routes/lovable/email/transactional/send.ts` (sent/failed paths)
   - `src/routes/lovable/email/queue/process.ts` (delivered/bounced/complained paths)
   - Mailgun inbound webhook status updates
3. Tighten the health check in `src/lib/admin/platform-health.functions.ts` / `platform_health_snapshot` RPC so "stuck pending" only counts rows where `status='pending'` AND `created_at < now() - interval '15 minutes'` AND no `sent_at`.
4. Backfill SQL to reconcile existing logs (one-time UPDATE collapsing duplicate `message_id` rows into the most-advanced status).

**Acceptance:** `/admin/health` shows 0 stuck-pending after the backfill; new sends only ever produce ONE row in `email_send_log` per `message_id`.

---

## Part 2 — A-6: restore canonical `_authenticated` layout (3 pts)

**Problem:** `src/routes/_authenticated/route.tsx` adds `DashboardTooltipProvider` + `DashboardToaster` inside the layout. The integration treats this file as managed — next template bump will conflict, and the layout shouldn't own UI providers anyway (they should live at the dashboard subtree, not the auth gate).

**Fix:**
1. Move `DashboardTooltipProvider` + `DashboardToaster` out of `_authenticated/route.tsx` and into the dashboard shell (`src/components/dashboard/DashboardShell.tsx`) — that's already mounted on every authenticated dashboard page, so behaviour is identical.
2. Revert `_authenticated/route.tsx` to the canonical minimal shape from the integration:
   ```tsx
   ssr: false,
   beforeLoad: <getUser + redirect>,
   component: () => <Outlet />,
   ```
3. Verify all `/dashboard/*`, `/admin/*`, `/portal/*` pages still get tooltips + toasts (admin already has its own shell; portal uses `ClientShell`).
4. Add `_authenticated/route.tsx` to the "do not author" list in the relevant memory file so future passes don't reintroduce providers there.

**Acceptance:** `_authenticated/route.tsx` matches the canonical template byte-for-byte; tooltips/toasts still work across dashboard, admin, portal.

---

## Part 3 — R-2: linter warnings sweep (5 pts)

**Step A — re-run the linter** to get the current authoritative list (`supabase--linter`).

**Step B — `USING (true)` policies (5 flagged).** For each:
- If the table is genuinely public read-only (e.g. `ofqual_cache`, `feature_flags` public flags) → keep `TO anon SELECT USING (true)` but explicitly scope columns / role and add a comment justifying it.
- Otherwise rewrite the policy with a proper predicate (`auth.uid() = user_id`, `has_role(auth.uid(), 'admin')`, or `EXISTS (...)`).
- One migration: `<ts>_r2_tighten_permissive_policies.sql`.

**Step C — `SECURITY DEFINER` functions (96 flagged).** Triage into three buckets via a quick audit script:
1. **Legitimate RPCs called from the client** (e.g. `has_role`, `is_pro_fully_verified`, `get_confirmed_professional_ids`, `platform_health_snapshot` — wait, that's admin-only) → keep grants, add `SET search_path = public, pg_temp` if missing, and add a `COMMENT ON FUNCTION` explaining why it's definer.
2. **Admin-only RPCs** → revoke `EXECUTE` from `anon`/`authenticated`, grant only to `service_role`, and assert the function still works because callers go through admin server fns that use `supabaseAdmin`.
3. **Internal helpers** (only called from triggers / other functions) → revoke all execute from `anon`/`authenticated`, grant to `postgres` only.

Bundle into one migration: `<ts>_r2_definer_grants_audit.sql`. Expect ~30–50 grant revokes; the remaining definers stay public-callable by design.

**Step D — re-run `supabase--linter`** and confirm 0 critical warnings remain (informational ones about definer functions that are legitimately public stay, but with comments explaining why).

**Acceptance:** Linter reports 0 unresolved warnings on `USING (true)` and 0 unresolved warnings on admin-only definers being publicly executable.

---

## Out of scope (per user)

- A-8 welcome email design polish (1 pt) — user confirmed templates look fine; we accept the 1-pt deduction or close it by simply marking the item resolved-by-design in the report.
- Any further pricing/UX changes.
- Republishing the email-templates picker (separate concern; tracked but not blocking score).

> Note: with A-8 explicitly waived, the score caps at **99 unless we mark A-8 closed-by-design**. The plan treats A-8 as **closed (no change required)** so the final score is **100/100**. If you'd rather leave it as a known 1-pt gap, say so and I'll cap at 99.

---

## Deliverables

1. Three migrations (Part 1 backfill + unique, Part 2 has no migration, Part 3 two migrations).
2. Code edits in 5 files (Part 1) + 2 files (Part 2).
3. Updated `REPS-production-readiness-report.md` with final 100/100 score and per-item evidence.
4. Linter re-run output pasted into the report.

## Acceptance (end-to-end)

- `/admin/health` "stuck pending" tile = 0 after Part 1 backfill.
- `_authenticated/route.tsx` matches integration canonical shape; tooltips + toasts still render on `/dashboard`, `/admin`, `/portal`.
- `supabase--linter` returns 0 unresolved permissive-policy or admin-definer warnings.
- Report shows **100/100**.
