
## Goal

Give admins a full outbound email tool inside `/admin/support`:
- **Compose** to any trainer (search the directory) or any free-typed email address
- **Broadcast** to all pros on a given tier (Verified / Pro / Studio / Free)
- Pick the **from-inbox** (support@ / pros@ / partners@ / press@)
- Attach files (PDFs, images, etc.)
- Every send is logged as a `support_ticket` + outbound `support_message` so replies thread back into the existing queue

All outbound is treated as **transactional / service messages** — no unsubscribe footer, no consent gate. (We can layer marketing compliance later if needed.)

## New UI

A new "Compose" button in the `/admin/support` header opens a full-screen dialog with three tabs:

```text
┌─ Compose ──────────────────────────────────────────┐
│  [ 1-to-1 ]  [ Broadcast ]  [ Drafts ]             │
├────────────────────────────────────────────────────┤
│  From:   [ support@ ▼ ]                            │
│  To:     [ search trainers… or type email ]        │
│          • James Wilson (Pro · Manchester)         │
│          • + add another                           │
│  Subject:[                                       ] │
│  Body:   [ rich-ish textarea + Rephrase button   ] │
│  Files:  [ + attach ]  invoice.pdf (212 KB) ✕     │
│                                                    │
│  [ Save draft ]                  [ Send → ]        │
└────────────────────────────────────────────────────┘
```

**Broadcast tab** swaps the To-field for tier filters:
- Tier: ☑ Verified  ☐ Pro  ☐ Studio  ☐ Free
- Preview count: "Will send to 42 trainers"
- Same From / Subject / Body / Attachments
- Confirmation step ("Send to 42 recipients?") before dispatch

## Backend changes

**1. Storage** — reuse the existing `support-attachments` bucket (private). Admins upload via signed URLs; attachments are linked to the outbound message row.

**2. Trainer search server fn** — `searchTrainers({ q, tier? })` returns up to 20 `{ id, full_name, email, tier, primary_profession, city }`. Admin-only via `has_role`.

**3. Outbound compose server fn** — `sendAdminOutbound({ inbox, recipients[], subject, body, attachmentIds[], broadcast? })`:
   - For each recipient: find-or-create a `support_ticket` (subject + inbox + requester_email), insert an outbound `support_message` (`is_auto=false`, `direction='outbound'`), send via Mailgun reusing existing `mailgun-send.server.ts`, attach files.
   - Broadcast mode: same loop, one ticket per recipient (so replies thread individually), tagged `tags: ['broadcast', '<campaign-id>']`.
   - Idempotency via a generated `campaign_id` + recipient email.

**4. Schema migration** — small additions only:
   - `support_tickets.tags TEXT[]` already exists; we use it.
   - `support_messages.attachment_ids UUID[] DEFAULT '{}'` (new column) — links into existing `support_attachments`.
   - New `outbound_campaigns` table for broadcast tracking: `id, created_by, inbox, subject, recipient_filter JSONB, recipient_count, sent_count, failed_count, created_at`. Grants + RLS (admin-only).

**5. Inbound routing** — already in place (`mailgun.ts` webhook derives inbox from recipient). Replies to broadcast emails will land in the correct inbox queue automatically because the `Reply-To` is `<inbox>@repsuk.org` and `thread_key` matches the outbound ticket's Message-ID.

## Files to add / edit

- `supabase/migrations/<new>.sql` — `outbound_campaigns` table + `support_messages.attachment_ids` column
- `src/lib/support/outbound.functions.ts` — `searchTrainers`, `sendAdminOutbound`, `previewBroadcastCount`
- `src/lib/support/outbound.server.ts` — broadcast loop, attachment download/attach helper
- `src/components/admin/support/ComposeDialog.tsx` — the new compose UI (1-to-1 + Broadcast tabs)
- `src/components/admin/support/TrainerSearchCombobox.tsx` — async-search recipient picker
- `src/routes/admin_.support.tsx` — add "Compose" button in header
- `src/lib/support/mailgun-send.server.ts` — extend to accept attachment buffers

## Out of scope (call out, don't build)

- Unsubscribe / marketing consent (transactional-only per your choice)
- Scheduled sends / drip campaigns
- Open & click tracking
- Per-admin from aliases ("Cruz at REPs <…>") — single inbox-scoped from for now
- Rich-text/HTML body editor — plain text with line breaks first; we can add a Tiptap pass later

Ready to build when you say go.
