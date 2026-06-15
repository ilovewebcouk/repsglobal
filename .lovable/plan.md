# Support queue — three fixes

## 1. Single close button (UI bug)

The drawer renders two X buttons because shadcn's `Sheet` already includes its own close button (top-right, white-on-secondary hover — that's the "orange circle" you're seeing on hover). We're adding a second custom `<X>` inside `SheetHeader`.

**Fix in `src/routes/admin_.support.tsx`:**
- Remove the custom `<button onClick={onClose}>` + `<X />` block from `SheetHeader` (lines ~389–395).
- Keep the built-in `SheetPrimitive.Close` from `sheet.tsx`.
- Re-style that built-in close button so the hover state matches the dark theme (subtle white background instead of the default `bg-secondary` which is rendering as that orange-ish pill). Done by overriding via a small className tweak on `SheetContent` or by adding a wrapper rule — cleanest is to update `src/components/ui/sheet.tsx` to use `hover:bg-white/10` instead of `data-[state=open]:bg-secondary`.

## 2. Mailgun inbound attachments

Right now `src/routes/api/public/email/inbound/mailgun.ts` parses the email body but ignores `attachment-count` / `attachment-N` fields, so the screen-printing artwork attachment never made it in. The `support-attachments` storage bucket and `public.support_attachments` table already exist and are unused.

**Backend (`src/routes/api/public/email/inbound/mailgun.ts`):**
- After creating the `support_messages` row, read `attachment-count` from the multipart form.
- For each `attachment-N` File field: upload to `support-attachments/{ticketId}/{messageId}/{filename}` using `supabaseAdmin.storage`.
- Insert a row into `support_attachments` (`message_id`, `filename`, `mime_type`, `size_bytes`, `storage_path`).

**Backend (`src/lib/support/tickets.functions.ts`):**
- In `getTicket`, join/select attachments per message and return them on the message rows.
- Add a new server fn `getAttachmentUrl({ attachmentId })` that returns a short-lived signed URL via `createSignedUrl(..., 300)`. Admin-only.

**Frontend (`src/routes/admin_.support.tsx` → `MessageBubble`):**
- Render an attachments row under each message body: filename + size, click opens the signed URL in a new tab. Image MIME types get an inline thumbnail.

**RLS:** `support_attachments` already has a policy; verify it allows admins to select. Add `service_role` grant and a `has_role(auth.uid(),'admin')` select policy if missing (single migration).

## 3. AI draft reply

Add an **"AI draft"** button next to "Reply to customer" / "Internal note" in the drawer composer.

**Frontend:**
- New button uses `Sparkles` icon; when clicked, calls a new server fn `draftSupportReply({ ticketId })` and streams the result into the `draft` textarea (with a small loading state).
- Button is only enabled in reply mode and when there is at least one inbound message.

**Backend (new `src/lib/support/ai-draft.functions.ts`):**
- Admin-gated `createServerFn` (`requireSupabaseAuth` + `has_role admin` check).
- Loads the ticket + last ~10 messages, builds a system prompt ("You are a REPS support agent — professional, concise, plain English. Reply on behalf of support@repsuk.org. Don't invent facts. End with 'Best, REPS Support'."), and a user prompt with the thread.
- POSTs to Lovable AI Gateway `/v1/chat/completions` with `google/gemini-2.5-flash`, returns the text. No streaming for v1 to keep it simple.

## Technical notes

- Mailgun parses attachment files with `attachment-count` + numbered fields when **not** using stored events; we use the live webhook so this path applies. Form fields are `File` objects on `await request.formData()`.
- Signed-URL TTL is intentionally short (5 min) since admins re-open the drawer frequently and we don't want long-lived links in DOM.
- AI draft does not auto-send; it only populates the textarea so the admin always reviews.
- No locked screens are touched. Admin `/admin/support` is admin-only and not in the locked-pages list.

## Out of scope

- Outbound attachments from admin reply (separate request).
- AI auto-categorisation / priority guessing.
- Persisting/regenerating drafts across sessions.
