
# Support ticket lifecycle — make it 10/10

## Today

- `open` → `pending` → `resolved` / `closed` — but `closed` is dead weight, identical to `resolved`, only reachable from the drawer dropdown.
- `spam` — works, but stays forever.
- `delete` — exists as a bulk action with a typed-count confirm, but it **hard-deletes** the row (and its messages/attachments via cascade). No undo, no recovery, no audit trail of the content. That's the gap you're feeling.

## The world-class model (Intercom / Front / HelpScout)

Two terminal states + a real Trash, with clear, distinct jobs:

| State | What it means | Auto-reopen on reply? | Visible where | How it ends up there |
|---|---|---|---|---|
| `resolved` | "Done for now — happy to hear back" | **Yes** (trigger flips to `open`) | Resolved tab (today) + All | Resolve button, bulk Resolve, drawer |
| `closed` | "Archived / locked — conversation is over" | **No** — a reply opens a NEW ticket linked to this one | Closed tab + All | Auto from `resolved` after **30 days** of no activity, or manual "Close conversation" in drawer |
| `spam` | Junk, sequestered | No | Spam tab only | Spam button, bulk Spam |
| `deleted_at` (soft) | In Trash | No | Trash tab only | Delete button — soft-delete, recoverable for **30 days** |
| (hard delete) | Gone forever | — | — | Auto-purge from Trash after 30 days, or "Delete forever" button in Trash tab |

This gives `closed` a real job (it's the archive, the locked terminal state), keeps `resolved` as the soft terminal state customers can reopen, and gives you a Gmail-style Trash so Delete is never scary.

## Changes

### Data model

```sql
-- Soft delete
ALTER TABLE public.support_tickets
  ADD COLUMN deleted_at timestamptz,
  ADD COLUMN closed_at  timestamptz;

CREATE INDEX support_tickets_deleted_at_idx ON public.support_tickets (deleted_at) WHERE deleted_at IS NOT NULL;
CREATE INDEX support_tickets_closed_at_idx  ON public.support_tickets (closed_at)  WHERE closed_at  IS NOT NULL;

-- For reply-after-close → new ticket link
ALTER TABLE public.support_tickets
  ADD COLUMN reopened_from_ticket_id uuid REFERENCES public.support_tickets(id) ON DELETE SET NULL;
```

Update `tg_support_message_after_insert`:
- If inbound reply arrives and ticket is `closed` (or `deleted_at` is set): do **not** flip status. Instead, insert a new `support_tickets` row with `reopened_from_ticket_id = old.id`, `status = 'open'`, copy subject/requester/inbox, and route the new message to it.
- `resolved` still auto-reopens (today's behaviour).

### Auto-rules (pg_cron or on-demand server fn)

- `resolved` with `resolved_at < now() - interval '30 days'` and no activity → set `status = 'closed'`, `closed_at = now()`.
- `deleted_at < now() - interval '30 days'` → hard delete (cascade messages/attachments).
- `status = 'spam'` and `updated_at < now() - interval '90 days'` → soft delete into Trash (optional, off by default — ask before enabling).

### Server (`bulk-tickets.functions.ts` + `tickets.functions.ts`)

- Replace hard-delete `delete` action with **soft delete**: `UPDATE … SET deleted_at = now()`. Undo restores `deleted_at = NULL`.
- New actions: `restore` (Trash → previous status), `purge` (hard delete from Trash, irreversible, typed-count confirm).
- New action: `close` (manual close, sets `status='closed'`, `closed_at=now()`).
- `listTickets`: every tab except `trash` filters `deleted_at IS NULL`. Spam tab also excluded from all other tabs (already done).
- `updateTicket` allows status transitions resolved↔closed via drawer.
- Every action writes an `admin_audit_log` row (already wired) — purge logs the full ticket snapshot in `before_state` so we have a record even after hard delete.

### UI (`admin_.support.tsx` + `BulkActionBar.tsx`)

Tabs (in this order):
`Open · Pending · Snoozed · Resolved today · Closed · Spam · Trash · All`

`counts` excludes `spam`, `closed` and `deleted_at IS NOT NULL` from Open/Pending/All-active tallies (already excludes spam).

Bulk bar buttons adapt to the tab:
- Default tabs: Resolve · Pending · Reopen · Spam · **Delete** (soft).
- Resolved tab: + **Close** button (terminal-archive).
- Spam tab: Not spam · Delete.
- Closed tab: Reopen · Delete.
- **Trash tab**: Restore · **Delete forever** (typed-count confirm, red).

Drawer status dropdown: Open / Pending / Resolved / **Closed** / Spam. "Closed" is described as "Archived — replies start a new ticket." Add a "Move to Trash" button separate from the status dropdown.

Empty Trash button at the top of the Trash tab ("Delete forever — N tickets older than 30 days will auto-purge").

## Why this is 10/10

- `resolved` vs `closed` finally mean different things (soft-done vs locked-archive), matching every mature helpdesk.
- Delete is no longer terrifying — Gmail-style 30-day Trash with Restore.
- Inbound replies always have somewhere to go: reopen the old ticket if it's resolved, spawn a linked new ticket if it's closed/deleted (never silently dropped).
- Every destructive action is auditable; only auto-purge after 30 days actually destroys data.
- Spam stays separate; optional 90-day spam→trash rule keeps it tidy without losing the ability to review.

## Open questions before I build

1. **Auto-close window** for resolved → closed: 30 days (default), 14, or 60?
2. **Trash retention** before hard purge: 30 days (default) or 7/14/90?
3. **Spam auto-purge**: keep forever (today), or auto-move spam to Trash after 90 days?
4. **Reply-after-closed**: spawn a linked new ticket (recommended) or just append to the closed one and reopen it (simpler, less "archive-y")?
