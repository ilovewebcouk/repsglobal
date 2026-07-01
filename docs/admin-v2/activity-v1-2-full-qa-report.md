# Admin Activity v1.2 — Full QA Report

**Date:** 2026-07-01
**Verdict:** ⚠️ **Partially working.** The infrastructure is correct;
the capture pipeline has two real bugs that explain the empty panels.
Do NOT run another visual polish pass until F1 + F2 below are fixed.

---

## 1. Is activity capture working end-to-end for logged-in members?

**Partially.**

- ✅ `session-event` endpoint correctly rejects anonymous, admin-on-/admin,
  and impersonation traffic.
- ✅ Beacon hook mounts globally, throttles duplicates, uses per-tab
  session IDs, attaches bearer.
- 🐞 **F1** — `auth_events` table has **0 rows**. The `SIGNED_IN`
  auth-event beacon is racing the `/auth → /dashboard` redirect. Fix:
  post the sign-in event inline in `/auth` before `navigate`.
- 🐞 **F2** — `session-event` does not check admin role for **non-/admin**
  routes. An admin browsing `/pro/…` or `/dashboard` leaks into member
  analytics. Fix: server-side `has_role` check.
- 🧹 Legacy: 2 rows in `user_sessions` are from pre-v1.2 code (one has
  `user_id = NULL`, which the current endpoint cannot produce). Purge.

## 2. Is Safari private anonymous browsing expected to show?

**No — this is correct behaviour.** v1.2 tracks **logged-in members only**.
Anonymous public browsing (any browser, any mode) is intentionally not
captured. See `activity-v1-2-tracking-behaviour.md` for the full matrix.
The fact that Safari private showed nothing is **evidence the privacy
guarantee is working**, not evidence of a bug.

If you want anonymous funnel analytics later, that is a separate
`public-analytics-v2` product with a different consent model.

## 3. Are empty panels caused by low activity or bugs?

**Both.**

- Real low activity: no non-admin members happened to be browsing at test
  time.
- Bugs blocking evidence:
  - F1 (auth-events empty)
  - F2 (admin leak) will actually *increase* rows once fixed for admins
    on `/admin/*` — but currently there are none because admins live on
    `/admin/*` which is correctly filtered.

Once a real member signs in and browses ≥ 2 non-admin routes, panels will
populate within the 10–30s refresh windows.

## 4. Is the map behaving as intended?

**Yes, at v1.2 spec level.** It renders, shows honest country bubbles,
handles empty states, has a fallback. It does **not yet** support
auto-fit to active countries, zoom controls, or touch pinch — those are
open recommendations, not v1.2 regressions. See
`activity-map-behaviour-qa.md`.

## 5. Should the map support auto-zoom / fit-to-active locations?

**Yes — recommended for the next pass.** Priority order:

1. Auto-fit on first load and when active-country set changes.
2. Zoom `+` / `-` / Reset controls (bottom-right).
3. Touch pinch (requires `touch-action: none` + `filter` prop on
   `ZoomableGroup`).

Do **not** swap map libraries.

## 6. Is realtime auto-refresh working?

**Yes.** All 8 panels poll on their own intervals (10–60s). Tab-hidden
pausing works by default (`refetchIntervalInBackground: false`). See
`activity-realtime-refresh-qa.md`.

## 7. Is the manual Refresh button still needed?

**No, but keep it.** Relabel to **"Refresh now"** and add a
**`Live · updated Xs ago`** indicator next to it. Add
**`Reconnecting…`** state on sustained poll failure.

## 8. What must be fixed before more visual polish?

**In order:**

1. 🐞 **F1** — Fire `sign_in` auth-event inline in `/auth` before navigate,
   with fallback via `onAuthStateChange` for OAuth/magic-link.
2. 🐞 **F2** — Add `has_role(userId, 'admin')` check in `session-event.ts`;
   drop admin traffic on any route.
3. 🐞 **F4** — Post `sign_in_failed` from `/auth` on password error.
4. 🧹 Purge 2 legacy `user_sessions` rows.
5. ⚠️ **F3** transparency — add DNT/GPC badge on Member 360 so admins
   understand missing detail.

## 9. What is the next recommended implementation pass?

**Pass A — Capture fixes (must ship first):** F1, F2, F4, legacy purge.
Small, targeted diffs; 1 migration for cleanup; no UI change.

**Pass B — Map polish:** auto-fit + zoom controls + touch pinch.

**Pass C — Freshness UX:** "Refresh now" rename, `Live · Xs ago` chip,
degraded state chip, DNT/GPC badge on M360.

**Pass D — Visual polish:** only after A–C. Then we know the map has real
data to draw and the "empty" states are truly empty, not broken.

---

## Deliverables produced this turn

- `docs/admin-v2/activity-v1-2-tracking-behaviour.md`
- `docs/admin-v2/activity-capture-qa.csv`
- `docs/admin-v2/activity-endpoint-qa.csv`
- `docs/admin-v2/activity-beacon-qa.md`
- `docs/admin-v2/activity-map-behaviour-qa.md`
- `docs/admin-v2/activity-realtime-refresh-qa.md`
- `docs/admin-v2/activity-data-freshness-audit.csv`
- `docs/admin-v2/activity-v1-2-full-qa-report.md` (this file)

**Live DB snapshot 2026-07-01 08:40 UTC:**
- `user_sessions`: 2 (1 legacy admin `/admin/activity`, 1 legacy anon NL)
- `member_session_events`: 0
- `auth_events`: 0

No code changed this turn — QA only, per instruction.
