# Slice A — Status model, inbound threading, queue UX

Honest answer to your first question: **no, the "pull previous tickets from the same requester into the open ticket" piece was never done.** The drawer only loads `support_messages` for the current ticket (see `tickets.functions.ts:72-81`). I'm folding it into Slice A because it's the same file.

Go-ahead means I ship everything below in one slice.

---

## 1. Database (single migration)

`support_tickets` additions:
- `status` enum extended: `new`, `open`, `awaiting_us`, `waiting_customer`, `snoozed`, `resolved`, `closed`. Backfill `open` → `awaiting_us` where last message was inbound, `waiting_customer` where last was outbound and not resolved.
- `snoozed_until timestamptz` (already exists — verify).
- `last_inbound_at timestamptz`, `last_outbound_at timestamptz`.
- `is_unread boolean` already exists — keep; flip to true on inbound.

Trigger updates:
- `tg_support_message_after_insert`: on inbound → `status = 'awaiting_us'`, `is_unread = true`, `last_inbound_at = now()`. On outbound → `status = 'waiting_customer'` (unless resolved/closed), `last_outbound_at = now()`.

Cron (existing pg_cron or a 5-min server fn): when `snoozed_until <= now()`, move `snoozed` → `awaiting_us`.

## 2. Inbound webhook

`/api/public/mailgun/inbound` — verify Mailgun signature, parse, match by `In-Reply-To` → `thread_key` → fallback to `requester_email + subject`. Insert `support_messages` row (direction=inbound). Trigger handles status flip. Already partially there; finish signature verify + thread matching.

## 3. Queue UI

- Replace "Open / Pending / Resolved / All" + "All inboxes / Support / Pros / Partners / Press" two-row chrome with a **single pill row** of saved views: `Needs you` (awaiting_us + unread) · `Waiting on customer` · `Snoozed` · `Resolved today` · `All`. Inbox filter becomes a compact `<Select>` to the right.
- Unread dot (orange) on rows where `is_unread = true`.
- Status pill colour map per row (already shipped in last turn — keep).
- **Mobile fixes**: Compose button moves into the page header row (next to the title/search), off the tab strip. Below `sm:` the table becomes a stacked card list (subject + from + status pill + time). Above `sm:` keep the table.
- Remove the cryptic `support@ · pros@ · partners@ · press@` legend strip.
- "From" column: single-line truncate with `title=` tooltip; email shown smaller under name.
- Desktop dead-space: cap table panel at `max-w-[1400px]` and let `Subject` flex-grow so columns breathe instead of leaving 400px gap.

## 4. Ticket drawer

- **Requester history** (the missing piece): new server fn `listRequesterTickets({ email, excludeId })` → drawer shows a collapsible "Previous tickets from this requester (N)" section above the message thread, each row links/opens that ticket. Powered by `requester_email` index.
- Reply & Resolve: "Mark as resolved after sending" checkbox already there — wire it so submit sets `status = resolved` in the same mutation.
- Keyboard: `⌘/Ctrl + Enter` sends, `e` resolves, `s` opens snooze popover. (Snooze popover already exists.)

## 5. Out of scope (stays in B/C)

Saved-view persistence per-user, customer profile card, SLA-with-pause, AI triage, full keyboard palette.

---

## Files touched

- `supabase/migrations/<new>.sql` — status enum + columns + trigger.
- `src/routes/api/public/mailgun/inbound.ts` — signature verify + thread match.
- `src/lib/support/tickets.functions.ts` — extend `getTicket` to return prior tickets, new `listRequesterTickets`, update reply mutation to accept `resolve: true`.
- `src/routes/admin_.support.tsx` — single pill row, mobile card list, header Compose, drawer prior-tickets block, keyboard shortcuts.

Say **go** and I ship it.