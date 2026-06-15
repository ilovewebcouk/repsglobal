## Goal
Turn the currently-disabled bell in the dashboard header into a live notification button that surfaces new support tickets and new inbound emails as they arrive.

## Scope
- Admin role only (the support queue is admin-only). The bell stays disabled for trainer/client roles for now — happy to extend later if you want.
- "Notification" = a new `support_tickets` row OR a new `support_messages` row with `direction = 'inbound'` (i.e. a customer reply to an existing thread).

## Behaviour
1. Bell shows an unread count badge (orange dot + number, capped at "9+").
2. Clicking the bell opens a popover listing the last ~10 notifications, newest first:
   - New ticket → subject + requester + "Just now / 5m ago"
   - New inbound message → "Reply on TKT-1234" + snippet
   - Each row links to `/admin/support?ticket=<id>` and closes the popover.
3. "Mark all as read" action + auto-mark-as-read when the popover opens.
4. Unread state persists per admin in `localStorage` as a `lastSeenAt` timestamp (no schema changes needed — keeps this lightweight).
5. Updates arrive live via Supabase Realtime — no polling, no page refresh.

## Technical details
- Enable Realtime in a migration:
  ```sql
  ALTER PUBLICATION supabase_realtime ADD TABLE public.support_tickets;
  ALTER PUBLICATION supabase_realtime ADD TABLE public.support_messages;
  ```
- New hook `src/hooks/useSupportNotifications.ts`:
  - On mount, fetch last 20 tickets + last 20 inbound messages (server fn, admin-gated via `has_role`), merge, sort by `created_at` desc.
  - Subscribe to `postgres_changes` INSERT events on both tables inside `useEffect`; on event, prepend to the in-memory list and bump unread count. Clean up channel on unmount.
  - Track `lastSeenAt` in `localStorage` (`reps.support.lastSeenAt`); unread = items with `created_at > lastSeenAt`.
- New component `src/components/dashboard/NotificationsBell.tsx`:
  - shadcn `Popover` + `Button` (replaces the disabled button in `DashboardShell.tsx` ~line 475).
  - Badge: small orange pill on top-right of the bell when `unread > 0`.
  - Empty state: "You're all caught up."
- `DashboardShell.tsx`: render `<NotificationsBell />` when `role === "admin"`; keep the disabled bell for other roles (unchanged visuals).
- Server fn `getRecentSupportActivity` in `src/lib/support-notifications.functions.ts`:
  - `.middleware([requireSupabaseAuth])`, verify `has_role(userId, 'admin')`, then read tickets + inbound messages via the user-scoped supabase client (RLS already restricts to admins).

## Out of scope
- Sound / browser push notifications.
- Per-admin server-side read state (localStorage is enough for one admin; we can promote to a DB column later if multiple admins need shared state).
- Notifications for outbound replies, status changes, or non-support events.

## Verification
- Open `/admin/support` in one tab and trigger a new inbound email via Mailgun → bell badge increments live, popover lists the new item, clicking jumps to the ticket and clears the badge.
