# Slice B1 + B2 (final — with two added fixes)

## B1 — Inbound auto-reply gap
In `src/routes/api/public/mailgun/inbound.ts`, after a NEW ticket is created (not on follow-ups in an existing thread):
- Skip if sender is in `suppressed_emails`.
- Send the existing `contact-autoresponse` template via Mailgun, subject prefixed `[TKT-####] <original subject>`, `In-Reply-To`/`References` set to the inbound `Message-Id`.
- Insert a `support_messages` row with `direction = outbound`, `is_auto = true`, `thread_key = <auto-reply Message-Id>`.
- Do NOT change ticket status (stays `open` / `new`).

## B2 — Queue + drawer polish (10 items already agreed)
1. Empty-state: replace inbox-address legend with clean copy.
2. Status pill: always render a sensible label (Resolved tickets never show raw `open`/`pending`).
3. Radius: Status pill → `rounded-[6px]`; Priority stays the only `rounded-full`.
4. Hide Inbox column when an inbox filter is active.
5. SLA cell colors: rose if overdue, amber if <1h left, white/65 otherwise.
6. Unread row: bold From-name + `bg-white/[0.015]` tint (in addition to orange dot).
7. Footer `?` trigger → keyboard cheatsheet (`c` / `j` / `k` / `e` / `⌘+Enter`).
8. `title=` ISO timestamp on Last activity.
9. "Resolved today" → server-side `resolved_at >= startOfToday` filter (not client cap).
10. Auto-reply messages render with small `Auto-reply` chip in the thread.

## NEW — folded in this turn

### B2.11 — Kill the stuck orange focus ring on rows
Each `<tr>` currently picks up the global focus-visible ring (orange 1px border) on click, and because the row is focusable it keeps focus after the pointer leaves — that's the orange box that "stays there."
Fix in `src/routes/admin_.support.tsx` only:
- Remove `tabIndex` / focus styling from `<tr>` (selection lives on the row checkbox and the View button — both already focusable).
- Add `focus:outline-none focus-visible:outline-none focus-visible:ring-0` to the row, and keep hover state (`hover:bg-white/[0.02]`) as the only visual affordance.
- Re-test: click row → open drawer → close → ring must be gone. Tab order through page still reaches checkbox + View.

### B2.12 — Post-reply auto-flow (Zendesk-style)
In the drawer's send-reply mutation (`src/routes/admin_.support.tsx`):
- After a successful outbound `support_messages` insert:
  - If status is `open` or `new` → update ticket `status = pending` (waiting on customer).
  - If the "Mark as resolved after sending" checkbox is ticked → `status = resolved` instead (existing behavior, kept).
- Invalidate the tickets query so the row pill flips immediately.
- Close the drawer automatically (same handler used by the status-change auto-close already shipped).
- Toast: `"Reply sent · ticket set to Pending"` (or `Resolved`).
- Does NOT fire for internal notes — only customer-facing replies.

## Files touched
- `src/routes/api/public/mailgun/inbound.ts` (B1)
- `src/routes/admin_.support.tsx` (all B2 incl. .11 + .12)
- No DB migration, no new server function.

## Out of scope (unchanged)
Saved views editor, customer card, SLA-with-pause, AI triage, full keyboard palette.

Say **"go"** to ship.
