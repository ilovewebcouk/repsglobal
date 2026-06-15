# Support Comms v1 — Full inbound email → ticket system (locked)

Replaces the broadcast-first plan. **Option 3:** `support@repsuk.org` becomes a real two-way address. Inbound emails become tickets. Admin replies email the requester. Requester replies thread back. The locked `/admin/support` mockup is wired 1:1 to live data. Bell + notifications backbone ship at the same time. Broadcasts ship later on the same backbone.

## Pre-flight (blockers, not features)

1. **Fix email DNS drift.** `notify.staging.repsuk.org` NS records are missing at the registrar — outbound is broken. Re-add NS + TXT verify records. Decide: keep `notify.staging.repsuk.org` or set up `notify.repsuk.org` for prod (recommended).
2. **Fix `SENDER_DOMAIN` / `FROM_DOMAIN`.** Currently `notify.dogboss.io` (wrong project) in `src/lib/email/send.server.ts` and `src/routes/lovable/email/transactional/send.ts`. Update to chosen REPs domain.
3. **Link Mailgun connector** (workspace). Used for inbound parsing. Outbound stays on the existing Lovable queue.
4. **Reserve `support@repsuk.org`.** Mailgun Route delivers matching mail to our webhook AND optionally forwards to a backup mailbox.

## Architecture

```text
              ┌─────────────────────────────────────┐
 Email in ──► │  support@repsuk.org (Mailgun MX)    │
              │       │                             │
              │       ▼  Mailgun Route + signed     │
              │  /api/public/email/inbound          │
              │       │  HMAC verify, parse MIME    │
              │       ▼  ALWAYS 200s (never-throws) │
              │  support_tickets + support_messages │
              │       │                             │
              │       ▼  fan out                    │
              │  notifications (admin bell rings)   │
              └─────────────────────────────────────┘

Admin replies in /admin/support/$ref
         │  outbound via existing Lovable email queue
         │  From:      support@repsuk.org
         │  Reply-To:  support+tkt_<ref>@repsuk.org   ← thread key
         │  Headers:   Message-ID, In-Reply-To, References,
         │             Auto-Submitted: auto-generated   ← loop guard
         ▼
   Requester replies → Mailgun Route → same webhook → threaded
```

## Threading (three redundant mechanisms)

1. **Plus-addressing** — `Reply-To: support+tkt_<ref>@repsuk.org`. Webhook regexes the `recipient` field. Primary key. 100% reliable on direct Reply.
2. **RFC 2822 headers** — outbound stamps `Message-ID: <ticket-<ref>-msg-<id>@repsuk.org>`. Inbound `In-Reply-To` / `References` matches against `support_messages.email_message_id`. Catches forward-then-reply.
3. **Subject** — `[REPs #TKT-XXXX]` last resort, lowest trust.
4. **No match → new ticket**, status `open`, priority `normal`, unassigned. Logged with `match_method='new'`.

## Loop & abuse guards (new — were missing)

- **Outbound headers**: every admin reply and auto-ack sends `Auto-Submitted: auto-generated` + `Precedence: bulk` so well-behaved autoresponders don't bounce back.
- **Inbound drop rules**: discard (log only, no ticket, no notification) if any of:
  - `Auto-Submitted: auto-replied` or `auto-generated` is present
  - `Precedence: bulk` / `list` / `junk` is present
  - `List-Id` / `List-Unsubscribe` header present (mailing list)
  - `From` matches `MAILER-DAEMON@` / `postmaster@` / `noreply@` / `no-reply@`
  - Mailgun spam flag set above threshold
- **Per-sender throttle**: ≥10 inbound from same `From` within 60s → drop with `status='throttled'`.

## Data model

```sql
notifications (
  id, user_id, kind text,
  title, body, link, source_table, source_id,
  read_at, created_at
)

support_tickets (
  id uuid pk,
  ref text unique,                    -- "TKT-4822" via sequence starting 4822
  requester_user_id uuid null,        -- null if no account
  requester_email text not null,
  requester_name text,
  subject text not null,
  category text,                      -- 'verification'|'billing'|'bug'|'other'
  priority text default 'normal',     -- 'urgent'|'high'|'normal'|'low'
  status text default 'open',         -- 'open'|'pending'|'resolved'|'closed'
  assignee_id uuid null,
  source text not null,               -- 'email'|'in_app'|'admin'
  first_response_at timestamptz,
  resolved_at timestamptz,
  sla_due_at timestamptz,
  last_message_at timestamptz default now(),
  last_message_from text,             -- 'requester'|'admin'
  created_at, updated_at
)

support_messages (
  id uuid pk,
  ticket_id uuid fk,
  author_user_id uuid null,
  author_role text not null,          -- 'requester'|'admin'|'system'
  body_text text,
  body_html text,                     -- SANITIZED with DOMPurify on render
  is_internal_note boolean default false,
  email_message_id text,
  in_reply_to text,
  inbound_event_id uuid null,
  created_at
)

support_attachments (
  id uuid pk, message_id uuid fk,
  filename, content_type, byte_size,
  storage_path text                   -- 'support-attachments' bucket
)

email_inbound_events (
  id uuid pk,
  provider text default 'mailgun',
  provider_event_id text unique,      -- dedupe
  payload jsonb,                      -- raw POST (no attachments)
  match_method text,                  -- plus_addr|in_reply_to|subject|new
  ticket_id uuid null,
  status text,                        -- processed|error|spam_dropped|loop_dropped|throttled
  error text,
  received_at timestamptz default now()
)
```

- RLS: notifications self-only; tickets admin-all + requester own; messages admin-all + requester non-internal on own tickets; attachments mirror parent; inbound_events admin-only.
- Storage bucket `support-attachments` (private). Path `tickets/{ticket_id}/{message_id}/{filename}`.
- Realtime on `notifications` + `support_messages`.
- GRANTs + `service_role` on every new public table.
- `support_ticket_ref_seq` starts at 4822 (next after mockup's 4821).
- **Retention job**: nightly delete `email_inbound_events` older than 90 days. Tickets/messages retained indefinitely (operational record).

## `/api/public/email/inbound` webhook (TanStack server route)

Hard rule: **always returns 200 after logging**. Any throw inside the handler is caught, written to `email_inbound_events` with `status='error'`, then 200'd. Otherwise Mailgun retries for 8 hours and one bad email blocks the queue.

Flow:
1. Verify Mailgun HMAC signature (`timestamp` + `token`, signing key, timing-safe, 5min skew window) → reject 401 on fail.
2. Upsert `email_inbound_events` with `provider_event_id = token` (dedupe).
3. Apply loop & abuse guards → if dropped, mark status, return 200.
4. Parse `From`, `To`, `Subject`, `body-plain`, `body-html` (sanitize), `Message-Id`, `In-Reply-To`, `References`, attachment list.
5. **Stream attachments now** from Mailgun's signed URLs (API-key authed) into the `support-attachments` bucket. Mailgun's URLs expire — never lazy-fetch.
6. Resolve thread (plus-addr → headers → subject → new).
7. Insert `support_messages` (`author_role='requester'`, link `requester_user_id` if email matches `auth.users` case-insensitively).
8. Update ticket `last_message_at` / `last_message_from='requester'` / `status='open'` if was `pending`.
9. Insert `notifications` for assignee (or all admins if unassigned).
10. Return 200.

## Server-side surfaces

### `src/lib/support/*.functions.ts`
- **Pro**: `createTicket`, `listMyTickets`, `getMyTicket`, `replyToMyTicket`, `markResolvedMyTicket`.
- **Admin** (gated `has_role(uid,'admin')`): `listTickets({status,priority,assignee,search})`, `getTicket`, `replyAsAdmin({sendEmail})`, `addInternalNote`, `setStatus`, `setPriority`, `assignTicket`, `mergeTickets`, `ticketStats`.
- Admin public reply → insert message + enqueue email via `sendTransactionalEmailServer` with new `support-reply` template, `Reply-To: support+tkt_<ref>@repsuk.org`, loop-guard headers, idempotency `ticket-<id>-msg-<message_id>`.
- Pro in-app reply → insert message + email admin assignee (or all admins).

### `src/lib/notifications/*.functions.ts`
`listMyNotifications`, `unreadCount`, `markRead`, `markAllRead`.

### Email templates (`src/lib/email-templates/`)
- `support-reply.tsx` — REPs header, body, "View ticket" CTA → `/dashboard/support/$ref`.
- `support-new-ack.tsx` — auto-ack on new email-sourced ticket ("Got your message, ref TKT-XXXX").
- Both registered in `registry.ts`. Both inherit loop-guard headers from send route.

## UI surfaces

### Admin: `/admin/support` (WIRE existing mockup 1:1)
- `src/routes/admin_.support.tsx` — preserve every pixel (KPI cards, Open/Pending/Resolved/All tabs, table cols, badges, "Open" action).
- Replace static `TICKETS` with `useSuspenseQuery(ticketsQuery(activeTab))`.
- KPI cards live: Open (+urgent), Pending reply (+avg wait), Resolved today (+delta), First-response SLA %.
- SLA strings from `sla_due_at` using existing format ("32m left" / "1h 14m" / "Today" / "Tomorrow" / "Resolved").

### Admin: `/admin/support/$ref` (NEW thread view)
- Left: conversation. Requester left, admin right, internal notes amber-pinned.
- Right rail: requester snippet (name/email/tier/city/verification if linked), metadata, assignee picker, priority + status, SLA countdown, "Add internal note" toggle.
- Composer: textarea + attachments + `Send` / `Send & resolve` / `Save as note`.
- Body HTML rendered via DOMPurify in the browser (XSS guard).
- Realtime: `support_messages` filtered to this ticket.

### Pro: `/dashboard/support` + `/dashboard/support/$ref` (NEW)
- Contact form (subject, category, body, attachments) + own ticket list.
- Thread view = admin layout minus internal-notes + admin right-rail.

### Bell (wire placeholder at `DashboardShell.tsx:482`)
- Replace disabled button with `NotificationBell`. Popover: last 10 + unread dot + "Mark all read" + "See all".
- Realtime channel filtered to `user_id=eq.<uid>`. Toast on arrival.
- Click → mark read + navigate.

### `/dashboard/notifications`
Full inbox grouped today/week/earlier.

## SLA logic
On ticket insert: `sla_due_at = created_at + interval` by priority (Urgent 1h, High 4h, Normal 1bd, Low 3bd). `first_response_at` stamped on first admin message. KPI "First-response SLA %" = `count(first_response_at <= sla_due_at) / count(*)` over tickets resolved today. Rolling clock-time (no business-hours engine in v1).

## Out of scope (deliberate)
Pro↔client messaging. Multi-language detection. Business-hours SLA. Saved replies / macros (Phase 2.1). CSAT survey on resolve (Phase 2.1). Broadcasts (separate slice).

## Broadcasts slice (deferred, same backbone)
Later: `broadcasts` + `broadcast_recipients`, `/admin/broadcasts` composer, fan into same `notifications` + outbound pipe. ~1–2 days on top of this.

## Acceptance criteria

1. DNS + `SENDER_DOMAIN` fixed → outbound resumes.
2. External email to `support@repsuk.org` → within ~30s: `email_inbound_events` row, ticket created, top of `/admin/support`, admin bell unread.
3. Admin reply → requester receives email with correct `Reply-To` + loop-guard headers. Reply in Gmail → appears live in thread (Realtime). Admin bell rings.
4. Internal note visible to admin only.
5. Pro creates ticket from `/dashboard/support` → admin queue updates; admin reply triggers email + notification.
6. "Send & resolve" → status flips, `resolved_at` set, KPIs recompute.
7. Suppressed/unsubscribed pro → in-app bell still pings; email skipped, logged.
8. Spam-flagged inbound → `spam_dropped`, no ticket.
9. Out-of-office / mailing list / postmaster bounce inbound → `loop_dropped`, no ticket.
10. Forward-then-reply → threads via `In-Reply-To`.
11. Malformed inbound (handler throws) → logged as `error`, webhook returns 200, queue keeps flowing.
12. `email_inbound_events` older than 90 days purged nightly.

## Build sequence (sub-agent execution)

1. Pre-flight: agent STOPS, asks user to fix DNS + confirm domain + link Mailgun connector.
2. Migration: notifications + support_* + RLS + GRANTs + sequence + bucket + Realtime + retention job.
3. Server fns + templates + bell + notifications inbox.
4. Wire `/admin/support` to real data (mockup pixel-for-pixel).
5. Build `/admin/support/$ref` thread view (DOMPurify in render).
6. Build `/dashboard/support` + `/dashboard/support/$ref`.
7. `/api/public/email/inbound` with HMAC verify + MIME parse + loop guards + attachments + never-throws boundary.
8. Surface exact Mailgun Route URL + config for user to paste.
9. End-to-end test from real Gmail.

## Assumptions

1. Mailgun (not Resend) for inbound — most mature parse-to-webhook.
2. Outbound stays on existing Lovable email queue.
3. Inbound mailbox is `support@repsuk.org` only in v1 (more routes = zero code change).
4. Requesters = pros + unknown senders; clients may email in too (just no linked user account).
5. Attachments capped at Mailgun's 25MB limit. Private bucket.
6. Plus-addr format: `support+tkt_<ref>@repsuk.org` with `<ref>` = lowercase ref minus `TKT-` (e.g. `support+tkt_4822@`).
7. Next ticket ref `TKT-4822`.
