# Slice A — Support queue overhaul

Goal: a triage surface that beats Zendesk for our scale — fast, keyboard-driven, zero-ambiguity status, and admins can start a brand-new ticket (outbound email) without bouncing to Campaigns.

## 1. Status model + signal upgrades (DB)

Single migration:

- `support_tickets.is_unread boolean not null default false` — flips `true` on inbound insert, `false` when an admin opens the ticket.
- `support_tickets.snoozed_until timestamptz` — when set and in the future, ticket is hidden from Open and appears in a new "Snoozed" tab; auto-wakes when reached.
- `support_tickets.last_opened_at timestamptz` and `last_opened_by uuid` — drives "you last viewed 3h ago" + multi-admin awareness.
- Extend `tg_support_message_after_insert`: on inbound, set `is_unread=true` and clear `snoozed_until` (a customer reply unsnoozes).
- Index: `idx_support_tickets_unread (is_unread) where is_unread = true`.

Status semantics stay on the existing enum (`open / pending / resolved / closed`) — we already use them correctly. The unread flag is the "needs me right now" signal we were missing.

## 2. New server functions (`tickets.functions.ts`)

- `markTicketRead({ id })` — sets `is_unread=false`, `last_opened_at=now()`, `last_opened_by=userId`.
- `snoozeTicket({ id, until })` — validates future timestamp, sets `snoozed_until`. `unsnoozeTicket({ id })` clears it.
- `searchTickets({ q, status, inbox })` — extends list with case-insensitive match on `ticket_number`, `subject`, `requester_email`, `requester_name` (debounced from UI).
- `createOutboundTicket({ to, name?, subject, body, priority?, inbox? })` — creates a ticket with `source='admin'`, sends the first email via Mailgun (re-uses `sendViaMailgun` + a new `outbound-first-touch` template), stores the outbound `support_messages` row, sets `thread_key` to the message-id so the customer's reply lands back on the same ticket. Status starts `pending` (waiting on customer).

## 3. Queue UI (`admin_.support.tsx`)

- **Header row** gets a single primary `+ New ticket` button (orange) — visible at every breakpoint, including mobile. Opens `NewTicketDialog`.
- **Search input** (`/` focus shortcut) lives in the header row.
- **Tabs**: Open · Pending · Snoozed · Resolved · All (snoozed added).
- **Unread row**: leading orange dot + slightly bolder subject; row click marks read.
- **From column**: single-line truncate w/ tooltip on overflow (kills the wrap).
- **Keyboard shortcuts**: `j` / `k` move highlight, `Enter` opens, `e` resolves highlighted, `s` snoozes, `/` focuses search, `c` opens New ticket, `Esc` clears selection / closes drawer.
- Mobile: the inbox filter row collapses behind a single "Inbox: All ▾" select under 640px so the tab strip + New ticket button fit on one line.

## 4. Ticket drawer

- **Snooze button** in header (popover: 1h / 4h / tomorrow 9am / Mon 9am / custom).
- **Reply & Resolve** as a split button — `Send reply` (primary) + a dropdown `Send & resolve` that fires the existing `closeAfter` path. Removes the easy-to-miss checkbox.
- **⌘/Ctrl + Enter** sends the active draft.
- **`e`** while drawer is open marks resolved.
- Reading a ticket calls `markTicketRead` on open.
- "Last opened by {name} {timeAgo}" line under requester when another admin viewed it within 24h (forward-compat for multi-admin).

## 5. New ticket dialog (`NewTicketDialog.tsx`)

Lightweight: To (email + optional name), Inbox (support/pros/partners/press), Subject, Body, Priority. On submit calls `createOutboundTicket` and opens the new ticket in the drawer. This replaces the Campaigns redirect for "I just need to email one person".

## Files touched

- `supabase/migrations/<new>.sql` — status/unread/snooze columns, trigger extension, index.
- `src/lib/support/tickets.functions.ts` — add 4 server fns above.
- `src/lib/email-templates/registry.ts` (+ new template) — `outbound-first-touch`.
- `src/routes/admin_.support.tsx` — header, search, tabs, unread, keyboard, mobile fixes.
- `src/components/admin/support/NewTicketDialog.tsx` — new.
- `src/components/admin/support/SnoozePopover.tsx` — new.

## Out of scope (Slice B/C)

Saved views, customer card sidebar, SLA-with-pause, AI triage (auto-priority/auto-tagging), multi-assignee, canned responses, attachments on outbound, scheduled send.

## Order of execution

1. Migration (requires your approval).
2. Server functions + template.
3. UI: header/search/tabs, drawer snooze + split-button, keyboard, New ticket dialog, mobile fixes.

Proceed?
