## Preview draft Core invite emails

Add a **Preview** button on every row of `/admin/core-invites` (draft, sent, claimed — anything not revoked). Clicking it opens a side sheet that renders the exact email the trainer will (or did) receive — same template, same real data (name, activation link, anniversary date, £34 price), not generic placeholder data.

### What you'll see

- Subject line at the top
- Recipient email
- The full rendered HTML email, exactly as it goes out, in an isolated iframe so the email's own styles don't leak into the admin page
- "Send now" button in the sheet footer for drafts (so preview → send is one flow)

### Technical bits

1. **New server function** `previewCoreInvite({ id })` in `src/lib/admin/core-invites.functions.ts`:
   - Admin-gated (same `requireRole(["admin"])` guard as the others)
   - Looks up the invite by id, resolves trainer name, builds the same `templateData` block (`fullName`, `activateUrl`, `anniversaryLabel`, `priceLabel: "£34"`) that `sendCoreInvite` builds
   - Renders the `core-manual-invite` template via `@react-email/render` server-side
   - Returns `{ subject, recipientEmail, html }`
   - Does NOT enqueue, log, or send anything — pure render
2. **UI in `src/routes/admin_.core-invites.tsx`**:
   - Add a "Preview" ghost button on every row next to Send/Resend/Revoke
   - Opens a `Sheet` (right side, wider — `sm:max-w-2xl`) with a header showing subject + recipient, and a `<iframe srcDoc={html} sandbox="" />` filling the body
   - For draft rows, footer contains "Send now" that calls the existing `sendCoreInvite` then closes the sheet
3. **Reuses** the existing `core-manual-invite.tsx` template and its registry entry — no template changes.

### Out of scope

- No live preview inside the "New invite" drawer (you picked row-only)
- No changes to the send/enqueue path
- No new DB tables or migrations
