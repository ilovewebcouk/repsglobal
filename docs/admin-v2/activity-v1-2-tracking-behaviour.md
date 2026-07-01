# Admin Activity v1.2 — Tracking Behaviour Spec

Source of truth for **what /admin/activity is designed to capture** in v1.2.
Cross-referenced against `src/hooks/useActivityBeacon.ts`,
`src/routes/api/public/activity/{auth-event,session-event}.ts`, and
`src/lib/activity/capture.server.ts`.

## Design principle

v1.2 is a **logged-in member analytics console**, not a public web-analytics
product. Anonymous / public / bot traffic is intentionally excluded. Admin
traffic is excluded from member metrics. Impersonation is excluded so admin
QA never pollutes real member behaviour.

## Behaviour matrix

| # | Scenario | Should capture? | Enforced by | Status |
|---|---|---|---|---|
| 1 | Anonymous public visitor (any browser) | ❌ No | `ctx.userId == null` → 204 in both endpoints; beacon also short-circuits when no bearer | ✅ correct |
| 2 | Safari **private window**, logged out, browsing public pages | ❌ No | Same as #1 — no session, no bearer, no insert | ✅ correct — this is why nothing appeared |
| 3 | Logged-out user browsing profile pages | ❌ No | Same as #1 | ✅ correct |
| 4 | Logged-in **member** browsing dashboard | ✅ Yes | Beacon posts on route change; endpoint inserts to `member_session_events` and upserts `user_sessions` | ✅ correct |
| 5 | Logged-in **admin** browsing `/admin/*` | ❌ No | Client hook skips `/admin`; server also rejects `/admin` paths | ✅ correct |
| 6 | Logged-in **admin** browsing non-admin pages (e.g. `/pro/…`) | ⚠️ Currently captured as a member | Neither client nor server checks admin role | 🐞 **Gap** — admin sessions leak into "member" activity |
| 7 | Admin impersonating a member | ❌ No | `ctx.isImpersonating` short-circuits to 204 | ✅ correct |
| 8 | Signup / checkout pages | ✅ Yes if member is signed in; ❌ if anonymous | Same rules as #1/#4 | ✅ correct — signup while anonymous stays invisible |
| 9 | Successful sign-in | ✅ Yes → `auth_events.event = 'sign_in'` | Beacon listens to `SIGNED_IN` and posts to `/auth-event` | ⚠️ Wired, but see freshness audit — `auth_events` currently has 0 rows |
| 10 | Failed sign-in | ⚠️ Schema supports `'sign_in_failed'` but nothing posts it | Client only fires on Supabase `SIGNED_IN` / `SIGNED_OUT` / `PASSWORD_RECOVERY` | 🐞 **Not implemented** |
| 11 | Sign-out | ✅ Yes | `SIGNED_OUT` → auth-event | ✅ correct |
| 12 | Route change inside authenticated dashboard | ✅ Yes | `useRouterState` pathname effect | ✅ correct (subject to browser fetch/keepalive support) |
| 13 | DNT / Sec-GPC enabled member | ⚠️ Session heartbeat only, no per-page detail | `ctx.dnt || ctx.gpc` short-circuits detail insert | ✅ correct, but not surfaced to admin ("why is this member missing page views?") |
| 14 | Bots (Googlebot etc.) | ❌ No | UA classifier tags device=bot; and bots aren't signed in | ✅ correct |

## Answers to explicit questions

- **Anonymous public visitors on `/admin/activity`?** No. By design.
- **Safari private window (logged out)?** No. Empty page is correct.
- **Logged-out profile browsing?** No.
- **Logged-in member?** Yes.
- **Logged-in admin?** Excluded on `/admin/*`. **Currently leaks** on non-admin routes → must fix.
- **Impersonated member?** No — dropped server-side.
- **Signup/checkout?** Only if the user is already authenticated at that point.
- **Failed sign-ins?** Schema ready, client not wired → must implement.
- **Successful sign-ins?** Wired, but currently not landing in DB → investigate (see freshness audit).
- **Route changes inside dashboard?** Yes.

## Gaps to fix before further polish

1. **Admin leakage on non-admin routes** (#6) — add a role check server-side
   in `session-event.ts` (`has_role(userId, 'admin')`) and short-circuit.
2. **Failed sign-in capture** (#10) — post `sign_in_failed` from `/auth` on
   Supabase `signInWithPassword` error.
3. **`auth_events` is empty** — beacon fires on `SIGNED_IN`, but nothing has
   landed. Likely the `keepalive` fetch races the redirect off `/auth`.
   Fire the event **before** the navigate, or await it.
4. **DNT/GPC transparency** — surface a small badge on Member 360 so admins
   know why a member has session but no page views.
