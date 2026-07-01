# Admin Activity v1.2 — Manual QA Test Script

Repeatable checklist for validating that the member-only activity capture pipeline is behaving correctly end-to-end. Run this after any change to `/api/public/activity/*`, `useActivityBeacon`, `session-event`, or the panels/map in `/admin/activity`.

**Tables that power the UI:**

| Panel | Source table(s) |
| --- | --- |
| Online Now | `user_sessions` (last_seen_at ≥ now − 5min, ended_at is null) |
| Pages Being Viewed Now | `user_sessions.current_path` (same 5-min window) |
| Top Member Pages | `member_session_events` (24h window, grouped by path) |
| Country Activity / Map bubbles | `user_sessions` (live) + `member_session_events` (24h) + `auth_events` sign_in (24h) |
| Realtime Summary card | `user_sessions` + `member_session_events` + `auth_events` |
| Recent Activity feed | Cross-source: `payment_events`, `subscriptions`, `verification_decisions`, `support_tickets`, `reviews`, `email_send_log`, `ops_alerts`, `admin_audit_log`, `churn_lifecycle`, plus `auth_events` & `user_sessions` |
| Member 360 → Sessions tab | `user_sessions` + `member_session_events` + `auth_events` for that user only, with `is_admin_view = false` filter |

**Guardrails baked into capture:**

- Admins are excluded server-side in `session-event` via `has_role(userId, 'admin')`.
- Anonymous / private-window traffic is 204'd — no bearer token → no capture.
- DNT / GPC members get a session heartbeat but no `member_session_events` rows; the Sessions tab shows the DNT/GPC badge for those rows.
- No raw IPs are stored — only salted SHA-256 hashes (`ip_hash`).

---

## Scenario A — Non-admin member (positive path)

1. Sign in at `/auth` as a non-admin member (e.g. Katie Gibbs).
2. Land on `/dashboard`. Wait 3s.
3. Navigate to `/dashboard/profile`, then `/dashboard/billing`, then `/dashboard/settings`.
4. Wait 10–15s so the beacon heartbeat flushes.
5. Open **another browser** logged in as admin and go to `/admin/activity`.

**Expect:**

- [ ] `Online Now` includes the member's name.
- [ ] Map has a bubble over their country with a pulsing "live" ring.
- [ ] `Pages Being Viewed Now` shows the member's current path.
- [ ] `Top Member Pages` records the visited paths.
- [ ] `Country Activity` shows their country under Online now.
- [ ] Recent Activity has at least a `sign_in` row.
- [ ] Realtime Summary card shows `1` online, device/browser derived correctly.

**Confirm DB:**
```sql
select count(*), max(created_at) from auth_events where user_id = '<uid>';
select count(*), max(created_at) from member_session_events where user_id = '<uid>';
select id, current_path, last_seen_at, is_admin_view from user_sessions where user_id = '<uid>' order by last_seen_at desc limit 3;
```
All three should return recent rows and `is_admin_view = false`.

## Scenario B — Sign-out clears presence

1. From Scenario A, sign the member out.
2. Wait > 5 minutes (or manually set `ended_at`).

**Expect:**

- [ ] Online Now no longer lists the member.
- [ ] Map bubble drops back to "24h activity" (sky-blue) rather than pulsing live.
- [ ] Recent Activity has a `sign_out` row.

## Scenario C — Admin excluded

1. Sign in as an admin (`cruz.pt@icloud.com`).
2. Browse `/admin/…`, `/dashboard`, `/pro/<slug>`, `/c/<slug>`.
3. Wait 10–15s.

**Expect:**

- [ ] Online Now does NOT include the admin.
- [ ] No new rows in `member_session_events` or `user_sessions` for the admin's `user_id`.
- [ ] No new `auth_events.sign_in` row is treated as member activity in the map.

**Confirm DB:**
```sql
select count(*) from user_sessions
  where user_id = '<admin uid>' and last_seen_at > now() - interval '30 min' and is_admin_view = false;
-- expect 0
```

## Scenario D — Anonymous / private window

1. Open `/` in a private window.
2. Browse `/`, `/pricing`, `/pro/<slug>`.

**Expect:**

- [ ] `/api/public/activity/session-event` returns 204 with no row inserted.
- [ ] No new `user_sessions` row appears with `user_id IS NULL`.

## Scenario E — Failed sign-in

1. Attempt to sign in with a wrong password.

**Expect:**

- [ ] `auth_events` gains a row with `event = 'sign_in_failed'`, `email = <hashed>` (or salted hash) — never plaintext.
- [ ] "Needs Attention" panel picks it up if the same email/user_id fails > 3 times in 15 min.

## Scenario F — Member 360 Sessions tab

1. Open `/admin/members/<uid>` for the member from Scenario A.
2. Click the **Sessions** tab.

**Expect:**

- [ ] Recent sessions listed with device / browser / country / page count.
- [ ] Live session shows a green "Active now" pill.
- [ ] Page trail lists up to 25 recent paths for each session.
- [ ] `sign_in` / `sign_out` events attached to the correct session window.
- [ ] No raw IP shown (only 8-char hash prefix like `a3f8bc21…`).
- [ ] For DNT/GPC members, the DNT/GPC badge renders and the trail is empty by design.
- [ ] Richard Bennett's Member 360 still loads without errors.

## Regression sanity check

- [ ] `bun run typecheck` (or `tsgo`) passes.
- [ ] `/admin/activity` renders without console errors when a country has zero activity (empty state honest).
- [ ] Clicking a country bubble filters the dashboard; clicking "Clear filter" restores.
- [ ] `LiveFreshnessChip` shows `Live · updated Xs ago` and pauses when the tab is hidden.
