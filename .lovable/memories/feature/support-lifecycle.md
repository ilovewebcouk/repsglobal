---
name: Support ticket lifecycle (Zendesk-aligned)
description: 5-state lifecycle (New→Open→Pending→Solved→Closed), drawer dropdown options, auto-transitions, 28-day auto-close, send-and-close from reply.
---

LOCKED 2026-06-17. The admin support queue at `/admin/support` follows the Zendesk model exactly:

| Status | Set by | Means | Auto-transitions |
|---|---|---|---|
| `new` | System (inbound, default) | Untouched. Powers the notification badge. | First view in drawer → `open` (`markTicketRead` promotes + stamps `first_viewed_at/by`). Cannot be set back to `new`. |
| `open` | Agent / system | Acknowledged, in progress. | Customer reply on `pending`/`solved` flips back to `open` (handled in `mailgun.ts` inbound). |
| `pending` | Agent | Waiting on customer. | Customer reply → `open`. |
| `solved` | Agent | Submitted a solution. | Customer reply → `open`. After 28 days idle → `closed` (cron). |
| `closed` | System (cron) or agent reply | Locked, archived. | Customer reply spawns NEW ticket with `reopened_from_ticket_id`. Manual close only via the **Send & closed** reply button — never via the status dropdown or bulk actions. |
| `spam` | Spam button | Junk, sequestered. | Set/cleared via separate Spam / Not spam button (NOT in the status dropdown). |

Auto-close: 28 days (`src/routes/api/public/hooks/support-auto-close.ts`, cron `support-auto-close-daily` at 03:15 UTC). Trash hard-purge: 30 days, same cron.

Tabs (7, in order): `New · Open · Pending · Solved · Closed · Spam · Trash`. Snoozed is a row-level attribute (`snoozed_until`), NOT a tab — snoozed Open rows hide from the Open tab until they wake.

Drawer status dropdown (`admin_.support.tsx`): `Open · Pending · Solved` enabled; `New`, `Closed`, `Spam` shown but disabled (system-set). Spam toggles via a separate button. No descriptive helper text — labels speak for themselves.

Reply button stack (`admin_.support.tsx`): split button with **Send & pending** as the primary action (customer-facing reply flips ticket to `pending`), and dropdown options **Send & solved** and **Send & closed**. The `E` keyboard shortcut still sets the ticket to `solved`.

Notification badge: `useSupportUnread` / `listSupportNotifications` returns `count(status='new' AND deleted_at IS NULL)`. "Mark all read" promotes every `new` to `open`.

Bulk action enum (server): `resolve, reopen, pending, delete, restore, purge, spam, not_spam, priority, assign`. `close` is intentionally NOT exposed — closed is only reachable via the reply button.

DB columns: `solved_at` (renamed from `resolved_at`), `closed_at`, `deleted_at`, `first_viewed_at`, `first_viewed_by`, `reopened_from_ticket_id`. Status enum: `new, open, pending, solved, closed, spam`. Default on inbound = `new`.

DO NOT re-add: "Needs you" tab, "Waiting on customer" tab, "Snoozed" tab, "All" tab, "Resolved today" tab, manual Close action in the dropdown/bulk, descriptive helper text in the dropdown, status value `resolved` (renamed to `solved`).
