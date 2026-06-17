
# Support lifecycle — 5 states, Zendesk-aligned

## States

| Status | Set by | Means | Auto-transitions |
|---|---|---|---|
| **New** | System (inbound email / contact form) | Untouched. Drives notification badge. | First time any agent opens the ticket → `Open`. Cannot be set back to New. |
| **Open** | System / Agent | Acknowledged, in progress. | Customer reply on `Pending` or `Solved` → flips to `Open`. |
| **Pending** | Agent | Waiting on customer. | Customer reply → `Open`. |
| **Solved** | Agent | Agent submitted a solution. | Customer reply → `Open`. After 28 days of no activity → `Closed`. |
| **Closed** | System only (cron) | Locked, archived. Immutable. | Customer reply → spawns a new linked ticket (`reopened_from_ticket_id`). Never manually set, never re-opened. |

## Notifications

- Sidebar badge on "Support" + topbar bell = `count(status = 'new')`.
- The instant an admin opens a ticket whose status is `new`, server fn flips it to `open` and badge invalidates.

## Tabs (6)

`New · Open · Pending · Solved · Closed · Spam`

Plus `Trash` as a sibling at the end (soft-deleted, 30-day recovery, hard-purge by cron).

Drop today's `Needs you`, `Waiting on customer`, `Snoozed`, `Resolved today`, `All`.

Snoozed: kept as a row-level attribute (`snoozed_until`) — snoozed rows hide from `Open` until they wake. No dedicated tab.

## Drawer status dropdown (3 options only)

`Open · Pending · Solved`

- `New` is never selectable (system-set, auto-promotes on first view).
- `Closed` is never selectable (system-only).
- `Spam` lives as a separate button next to the dropdown, not inside it (it's a moderation action, not a lifecycle state).

No descriptive helper text. The labels speak for themselves.

## Bulk action bar (bottom pill)

Already correct — keep as-is, just relabel:
`Open · Pending · Solve · Spam · Trash`

(Drop `Close` — no one closes manually.)

## Auto-close: 28 days

Zendesk's own default. Existing `pg_cron` job at 03:15 UTC stays — just change the window from 14 → 28 in `src/routes/api/public/hooks/support-auto-close.ts`.

## Database changes

```sql
-- 1. Add 'new' to the status enum
ALTER TYPE support_ticket_status ADD VALUE IF NOT EXISTS 'new' BEFORE 'open';

-- 2. Backfill nothing — existing rows stay where they are.

-- 3. Default for new inbound tickets
ALTER TABLE public.support_tickets
  ALTER COLUMN status SET DEFAULT 'new';
```

## Code changes

**`src/routes/api/public/email/inbound/mailgun.ts`**
- New inbound (no thread match) → insert with `status = 'new'` (currently `open`).
- Reply to `closed` ticket → spawn new ticket with `status = 'new'`, `reopened_from_ticket_id = old.id`. (Already wired — confirm status value.)
- Reply to `pending` / `solved` ticket → flip to `open` (already wired).

**`src/lib/support/tickets.functions.ts`**
- `listTickets({ tab })` — add `'new'` filter; redefine `'open'` = `status='open' AND (snoozed_until IS NULL OR snoozed_until <= now())`.
- New server fn `markTicketViewed(ticketId)` — if `status='new'`, set to `'open'`, stamp `first_viewed_at = now()`, `first_viewed_by = userId`. Idempotent.
- `getTicketCounts()` — return `{ new, open, pending, solved, closed, spam, trash }`.

**`src/hooks/useSupportUnread.ts`**
- Already exists. Repoint to `count(status='new' AND deleted_at IS NULL)`.

**`src/routes/admin_.support.tsx`**
- Tabs: `New · Open · Pending · Solved · Closed · Spam · Trash`. Counts from `getTicketCounts`.
- KPI strip simplified to 4 cards: `New · Open · Pending · Solved (last 7d)`.
- Drawer: `Select` with 3 options (`Open · Pending · Solved`), plus a separate `Spam` button.
- When drawer opens a `new` ticket, call `markTicketViewed` once → optimistic-update local row + invalidate counts.

**`src/components/admin/support/BulkActionBar.tsx`**
- Remove `Close` button.
- Per-tab visibility unchanged otherwise.

## Why this is 10/10

- Matches Zendesk exactly, so any agent you hire already knows it.
- `New` earns its keep by powering the notification badge — not just a triage label.
- `Closed` is genuinely terminal (system-only), which is what makes it different from `Solved`.
- Drawer has only the 3 statuses an agent ever picks — zero cognitive load.
- Auto-close window is the industry default, not a guess.
- Reply-to-closed always lands somewhere (new linked ticket) — never silently dropped.

## Open question

Notification badge today: where does it live? I'll point `useSupportUnread` at `count(status='new')`. If you also have a topbar bell counting other things (verifications, enquiries), I'll only touch the support count — confirm if you want me to leave the existing hook signature alone or rename it.
