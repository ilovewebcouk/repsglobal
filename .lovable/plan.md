## Support v1.1 — scope

Four parallel tracks. All admin-side work hooks into the existing `/admin/support` triage already built.

### 1. Form polish — match Public Profile / app inputs

Symptom: the New-ticket and reply forms use raw `div.space-y-2 + Label + Input/Textarea` instead of the shadcn `FieldGroup` / `Field` pattern used everywhere else (Public Profile, Verification, Services). That's the "messy / one-or-two pixel lines" look — wrong wrapper, not wrong tokens.

Apply across `dashboard_.support.new.tsx`, `dashboard_.support.$id.tsx` (reply box), `admin_.support.tsx` reply box:
- Wrap form bodies in `FieldGroup`.
- Each control becomes `<Field><FieldLabel/><Input/Select/Textarea/><FieldDescription/></Field>`.
- Validation: `data-invalid` on Field + `aria-invalid` on control (subject < 3 chars, body < 10 chars).
- Remove ad-hoc `space-y-*`; use FieldGroup's gap.
- Keep `PCard` wrapper + `rounded-[18px]` per profile cards.
- Reply composer on `$id` page becomes a `Field` inside `PCard`, matching the messaging composer style.

### 2. Attachments

- Bucket: new private `support-attachments` (via storage tool).
- RLS on `storage.objects`:
  - Ticket owner can read/write objects keyed under `tickets/{ticket_id}/...` where they own the ticket.
  - Admin (`has_role(uid,'admin')`) full read/write.
- Existing `support_attachments` table already has the shape — just wire it.
- UI: shadcn `InputGroup` with paperclip `InputGroupAddon` inside the message composer and new-ticket form. Multi-file, max 5 per message, 10 MB each, types: images / pdf / common docs.
- Render attachments on each message bubble (admin + trainer view) as a row of file chips with download.
- Server fn: `addAttachmentsToMessage({ messageId, files: [{path,name,mime,size}] })` (called after direct-to-Storage upload).

### 3. Email notifications

Mailgun already wired (`mailgun-send.server.ts`). Two new transactional templates + send points:

a. **New ticket → admin inbox** (`support@repsuk.org`)
   - Triggered inside `createMyTicket` handler after insert.
   - Subject: `[REPS Support #{ticket_number}] {subject}`
   - Body: requester name/email, tier, category, full message, link to `/admin/support?ticket={id}`.

b. **Admin reply → ticket owner**
   - Triggered when an `outbound` message is inserted by an admin in `tickets.functions.ts` (`replyToTicket`).
   - Subject: `Re: [#{ticket_number}] {subject}`
   - Body: message body, link to `/dashboard/support/{id}`, unsubscribe footer respects `notification_preferences`.

Both go through existing `enqueue_email` → mailgun worker pattern (no synchronous Mailgun call in the request path).

Out of scope: end-user reply → admin email (admin uses in-app inbox).

### 4. Unread / notification surfacing

DB:
- Add column `support_messages.read_by_recipient_at timestamptz` (already have `is_unread` on ticket; need per-side).
- Two RPCs (SECURITY DEFINER):
  - `count_unread_support_for_user(uid)` → tickets with new admin messages for the trainer.
  - `count_unread_support_for_admin()` → tickets with new inbound messages or `status='open'` unread by admin.

Sidebar badge (`nav-data.ts` + `DashboardSidebar.tsx`):
- Support nav item accepts an optional `badge?: number`.
- Trainer sidebar: query `count_unread_support_for_user` (TanStack Query, 30s refetch + realtime channel on `support_messages` filtered by ticket owner).
- Admin sidebar (`/admin/support` link): same pattern with the admin RPC.
- Render small destructive pill next to label when > 0.

NotificationsBell (`src/components/dashboard/NotificationsBell.tsx`):
- Add a "Support" section feeding from the same unread query.
- Each row links to `/dashboard/support/$id` (or `/admin/support?ticket=...` for admin).
- Mark-as-read on click → call `markTicketRead({ ticket_id })` which stamps `read_by_recipient_at` on all messages newer than last read for the current side (owner vs admin).

### Files

Migrations
- `support-attachments` bucket + storage policies.
- `ALTER TABLE support_messages ADD read_by_recipient_at`, plus 2 new RPCs.

Server fns
- `src/lib/support/my-tickets.functions.ts` — extend `createMyTicket` to enqueue admin email; add `addAttachmentsToMessage`, `markTicketRead`, `countUnreadForMe`.
- `src/lib/support/tickets.functions.ts` — extend `replyToTicket` to enqueue owner email; add `countUnreadForAdmin`, attachments path.
- `src/lib/support/mailgun-templates.server.ts` — two new templates.

UI
- Rebuild forms with `FieldGroup`/`Field` in 3 files (trainer new, trainer detail, admin detail).
- `DashboardSidebar.tsx` — render `badge` on nav items.
- `nav-data.ts` — `badge` field type.
- `NotificationsBell.tsx` — support section.
- New `SupportAttachments.tsx` component (chip list + upload button via `InputGroup`).

### Out of scope (flag if you want included)
- Satisfaction rating on close.
- Trainer-side push/email digest beyond per-reply email.
- Inline image preview (we'll show as chips that open in new tab).

Want me to ship all four tracks, or pick a subset?