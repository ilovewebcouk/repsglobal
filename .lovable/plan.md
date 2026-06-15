## What we know

- `cruz.pt@icloud.com` is correctly seeded with `admin` + `professional` + `client` roles in `user_roles` (verified in DB).
- The header avatar menu correctly shows the `ADMIN` badge, so the client-side role check works.
- The `/admin` route is throwing **after** the role gate passes — the screen shown ("This page didn't load — Try again / Go home") is the route's `errorComponent`, not the `requireRole` redirect. So this is not a permissions problem; the admin page itself is crashing on render.
- Recent commits added `useSupportUnread` → `listSupportNotifications` (`src/lib/support/tickets.functions.ts`), which top-level-imports `render` from `@react-email/components` and the entire email template registry. `DashboardShell` (used by `/admin`) now consumes that hook for the sidebar badge.
- `src/components/admin/sections/OverviewKpis.tsx` also has a suspicious unused `const DeltaIcon = import("lucide-react").then(...)` on line 46 and a misplaced `import { TrendingUp }` on line 74.

The actual runtime error isn't surfaced in the snapshot I have, so step 1 is to confirm the stack trace, then fix the offender.

## Plan

1. **Confirm the real error**
   - Open `/admin` in the preview signed in as the admin and capture the browser console error + stack from the error boundary. Most likely candidates:
     a. `tickets.functions.ts` pulling `@react-email/components` + all email templates into the client bundle and exploding during route load.
     b. `OverviewKpis.tsx` line 46 dynamic-import expression / misplaced import causing a render-time exception.

2. **Split server-only email code out of the client-imported server-fn module**
   - Move `render` + `TEMPLATES` usage out of `src/lib/support/tickets.functions.ts` into a sibling `*.server.ts` (e.g. `tickets-email.server.ts`) and `await import(...)` it inside the handler that needs it.
   - Keep `listSupportNotifications` (and other read-only fns the sidebar/bell call) free of any `@react-email/components` import so the client bundle stays small and side-effect free.

3. **Clean up `OverviewKpis.tsx`**
   - Remove the unused `const DeltaIcon = import("lucide-react").then(...)` line.
   - Move `import { TrendingUp } from "lucide-react";` to the top of the file with the other imports.

4. **Verify**
   - Hard-reload `/admin` as `cruz.pt@icloud.com`, confirm the dashboard renders (KPIs, queues, revenue, etc.) and the sidebar Support badge still updates.
   - Confirm `/dashboard` (Pro) and `/dashboard/support` for the same user still work and the support unread count is unchanged.

No DB migrations, no role changes, no UI redesign — purely a render-crash fix.
