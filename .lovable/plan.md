# Support notifications — QA pass

Goal: audit every automated email the support system can send, confirm each one fires (or doesn't fire) in the right place, and fix anything off. No new features.

## What's wired today

Outbound email touchpoints I found:

1. **Contact form → new ticket** (`/api/public/support/contact-form.ts`)
   - Sends `contact-autoresponse` once on submission. Logs as `is_auto=true`.
2. **Inbound email → new ticket** (`/api/public/email/inbound/mailgun.ts`)
   - Sends `contact-autoresponse` **only when `createdNewTicket === true`** (brand-new ticket or reply-after-archive that spawns a new ticket).
   - Customer replies on existing Open / Pending / Solved tickets → flip status only, **no auto-reply**. ✅ correct.
   - Skips when sender is on `suppressed_emails`. ✅
3. **Agent reply from drawer** (`tickets.functions.ts` `replyToTicket`)
   - Sends `support-reply` template, threads via `In-Reply-To` / `References`, updates status to `pending` / `solved` / `closed` based on the split button.
4. **Agent-initiated new outbound** (`tickets.functions.ts` `createOutboundTicket`)
   - Sends `support-outbound`, creates a fresh ticket.

Other lifecycle events that do **not** send anything (intentional or possible gap, to confirm):
- Ticket moved to Spam / Not spam
- Ticket auto-closed by 28-day cron
- Ticket reopened (customer reply on Pending/Solved)
- Ticket deleted / restored / hard-purged

## QA checklist to run

For each scenario: trigger it, check (a) email actually received, (b) `support_messages` row logged with correct `is_auto` + `direction`, (c) ticket status after, (d) threading (reply lands back on same ticket, not a new one).

| # | Scenario | Expected email | Expected status after |
|---|---|---|---|
| 1 | Customer submits contact form | `contact-autoresponse` | `open` (currently — should this be `new`? see below) |
| 2 | Inbound email to support@ (no prior ticket) | `contact-autoresponse` | `new` |
| 3 | Inbound reply on `open` ticket | none | `open` |
| 4 | Inbound reply on `pending` ticket | none | `open` (reopened) |
| 5 | Inbound reply on `solved` ticket | none | `open` (reopened) |
| 6 | Inbound reply on `closed` ticket | `contact-autoresponse` (new ticket spawned) | new ticket `new`, old stays `closed` |
| 7 | Inbound reply on `spam` ticket | none | stays `spam`, no new ticket? — confirm behaviour |
| 8 | Inbound from suppressed address | none | ticket still created |
| 9 | Agent **Send & pending** | `support-reply` | `pending` |
| 10 | Agent **Send & solved** | `support-reply` | `solved` |
| 11 | Agent **Send & closed** | `support-reply` | `closed` |
| 12 | Agent **Mark solved** (no reply) | none | `solved` |
| 13 | Agent **Reopen** | none | `open` |
| 14 | Agent **Spam** / **Not spam** | none | `spam` / `open` |
| 15 | Cron auto-close after 28d | none | `closed` |
| 16 | Agent creates outbound ticket | `support-outbound` | `open` |

## Known suspects to verify during the pass

- **Contact-form status** (line 141): inserts as `status: "open"` instead of `"new"`, so contact-form tickets skip the New tab + badge. Likely a bug given the locked Zendesk lifecycle (new is the default for inbound). Confirm and fix to `"new"`.
- **Scenario 6 wording**: the auto-reply on a reply-to-closed ticket uses the same `contact-autoresponse` ("we got your message, we'll reply within 24h"). That's fine but worth re-reading the copy in that context.
- **Scenario 7 (reply to spam ticket)**: current code in inbound handler treats spam the same as closed → spawns a new ticket and auto-replies. That means a spammer keeps getting auto-replies. Probably should skip auto-reply when `reopenedFromId` came from a `spam` parent, or add sender to suppression. Decision needed.
- **Threading on contact-form auto-reply** (line 198): no `inReplyTo` / `references` set, only `messageId`. The seeded `thread_key` covers it via the subject+sender fallback, but a true `Message-Id` reference would be cleaner. Low priority.
- **Agent reply when ticket already `closed`**: `replyToTicket` doesn't block sending into a closed ticket. Should it? Today a reply on a closed ticket would re-set status to `pending`/`solved` based on the button. Decision needed (probably allow — agent knows what they're doing).
- **`support-outbound` thread_key**: line 606 sends with `inReplyTo: null` — confirm the function still writes `thread_key = messageId` afterwards (lines 619+) so customer replies match.

## Deliverable

I'll work through the 16 scenarios in order, fix any concrete bug as we go (status-on-contact-form, spam reply behaviour, anything else surfaced), and report back with a pass/fail table. No template copy rewrites unless you ask.

## Two open questions before I start

1. **Spam reply behaviour** (scenario 7): silently drop, or auto-suppress the sender and don't reply?
2. **Reply-to-closed re-engagement** (scenario 6): keep current "treat as new ticket + standard autoresponse", or use a different opener ("This is a continuation of TKT-1234…")?
