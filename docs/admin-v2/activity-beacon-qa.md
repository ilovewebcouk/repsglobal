# Activity Beacon QA — `src/hooks/useActivityBeacon.ts`

Mounted once in `src/routes/__root.tsx:223`.

| Check | Result | Notes |
|---|---|---|
| Hook mounts only when authenticated | ⚠️ Mounts always; **posts only when authenticated** | `postJSON` short-circuits when `authHeaders()` returns no bearer. Correct outcome, but a Supabase `getSession()` call happens on every navigation for anonymous users too (cheap, no network). |
| Skips for anonymous visitors | ✅ Yes | See above — no fetch is made without a bearer. |
| Skips `/admin/*` | ✅ Yes | `pathname.startsWith("/admin")` guard. Server also enforces. |
| Skips impersonation | ⚠️ Only server-side | Client will still POST during impersonation; server drops. Fine but wastes a request. |
| Route changes detected | ✅ Yes | `useRouterState({ select: s => s.location.pathname })`. |
| Duplicate-path throttling | ✅ Yes | `lastSentRef` prevents repeat posts for the same path. |
| `session_id` in `sessionStorage` | ✅ Yes | Key `reps.activity.session_id`, per-tab. |
| No persistent `anon_id` / `localStorage` | ✅ Correct | We deliberately do **not** persist an anon identifier. |
| `fetch({ keepalive: true })` | ✅ Yes | No `sendBeacon` — chosen so Authorization header works (sendBeacon can't set headers). |
| Bearer attached | ✅ Yes | Attached inline via `authHeaders()`, not via `attachSupabaseAuth` (that middleware only affects `createServerFn`, not raw `/api/public/*`). |
| Safari private mode | ⚠️ Partial | `sessionStorage` **is** available in Safari private (7-day iCloud sandbox); falls back to in-memory UUID if not. `fetch keepalive` works. Bearer attach works. So logged-in member browsing DOES capture in Safari private. Anonymous still stays invisible. |
| Errors don't break navigation | ✅ Yes | Wrapped in `try/catch` that swallows. |

## Findings

### 🐞 F1 — `SIGNED_IN` beacon racing the redirect

`auth_events` currently has **0 rows** despite the client wiring. On successful
sign-in, `/auth` navigates to `/dashboard` within the same tick that the
`SIGNED_IN` callback fires. `fetch({ keepalive: true })` normally survives
this, but the `authHeaders()` awaits `supabase.auth.getSession()`, which
itself awaits — the navigation may cancel before the fetch is enqueued.

**Fix**: in `/auth` on successful password sign-in, fire the auth-event
POST inline (with the fresh session already in scope) and `await` it
before navigating. Keep the `onAuthStateChange` fallback for OAuth/magic
link flows.

### 🐞 F2 — Admin leaks on non-admin routes

Client only filters `/admin`. An admin browsing `/pro/…` or `/dashboard`
will insert `member_session_events`. Fix in `session-event.ts`:

```ts
const isAdmin = await supabaseAdmin
  .rpc("has_role", { _user_id: ctx.userId, _role: "admin" })
  .then(r => Boolean(r.data));
if (isAdmin) return new Response(null, { status: 204 });
```

### ⚠️ F3 — No `TOKEN_REFRESHED` filter

The hook subscribes to all auth events. Currently only 3 are acted on
(`SIGNED_IN` / `SIGNED_OUT` / `PASSWORD_RECOVERY`), so other events are
no-ops. This is correct — no change needed.

### ⚠️ F4 — No failed-sign-in capture

`sign_in_failed` is in the Zod enum but nothing posts it. Add a POST from
the `/auth` failure handler (email/password path only; OAuth failures have
no bearer).
