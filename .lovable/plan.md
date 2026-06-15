## Slice 7 — "Send sign-up link" for leads without a REPs account

After Slice 6, the convert flow refuses to run when `sender_user_id IS NULL` (anonymous enquiry) and only shows a tooltip telling the Pro to "send them a sign-up link first" — but there's no button to actually do that. This slice wires the missing button on the lead detail sheet, reusing the existing `createClientInvite` server function and `client_invites` table.

### Server (`src/lib/leads/leads.functions.ts`)

Add `sendLeadSignupLink` server function (POST, `requireSupabaseAuth`):

- Input: `{ enquiryId: string }`
- Load enquiry, assert `professional_id = auth.uid()`, assert `sender_user_id IS NULL` (no-op if already linked), assert `sender_email IS NOT NULL`.
- Call the existing invite path inline: insert into `client_invites` with `professional_id`, `email = enquiry.sender_email`, `full_name = enquiry.sender_name`, random `token_hash`, `status = 'pending'`. (Re-implement the 6-line insert here instead of importing `createClientInvite` to avoid a server-fn-from-server-fn call and keep the activity log atomic.)
- Insert into `lead_activity`: `type = 'invite_sent'`, payload `{ email, invite_id, expires_at }`.
- Return `{ acceptUrl, expiresAt }` (build `acceptUrl` from `PUBLIC_SITE_URL` like `createClientInvite` does).
- Also extend `LeadDTO` / `LeadQueryResult` with `last_invite_sent_at: string | null` derived from `client_invites` (latest pending invite where email matches `sender_email` for this pro). Use a side-query in `listLeads` keyed by `(professional_id, lower(email))` so the chip can reflect "Invite sent 2d ago" without an extra round-trip.

No new migration needed (table + RLS already exist; `lead_activity` accepts free-form `type` strings already).

### UI

**`src/components/leads/LeadDetailSheet.tsx` (`ConvertRow`):**

When `!canConvert`:
- Replace the disabled "Convert to client" button with a two-line block:
  - Heading: "Client needs a REPs account"
  - If `lead.last_invite_sent_at` is null → primary button "Send sign-up link" (calls the new server fn). On success, toast "Sign-up link sent" and invalidate `["leads"]` + `["lead-activity", lead.id]`.
  - If `lead.last_invite_sent_at` exists → muted state "Sign-up link sent {timeAgo}" + secondary ghost "Resend link" button (same mutation).
- Keep the existing converted/canConvert branches unchanged.

**`src/components/leads/LeadActivityTab.tsx`:**

Add a new `invite_sent` row renderer:
- Icon: `MailPlus` (lucide) in an orange-tinted circle to match the note row's accent.
- Copy: "Sent sign-up link to {email}" with `{timeAgo}` underneath.

### Edge cases

- Anonymous enquiry with no email at all → server fn throws "No email on file"; UI shows tooltip explaining the Pro needs to capture the email manually (out of scope to add an email field here).
- Pro spam-clicks "Resend" → server fn is idempotent enough (each call creates a fresh invite row + activity row). No throttle in this slice; we'll add a 5-min cooldown later if it becomes a problem.
- Lead's email already belongs to an existing REPs user → the invite still sends; once they click and sign in, `accept_client_invite` links them and the next conversion attempt works. No special-case branch.

### Files

- edit `src/lib/leads/leads.functions.ts` (new `sendLeadSignupLink` fn + extend `LeadDTO` with `last_invite_sent_at` + extend `listLeads` query)
- edit `src/components/leads/LeadDetailSheet.tsx` (replace disabled-button branch with send/resend UI)
- edit `src/components/leads/LeadActivityTab.tsx` (new `invite_sent` row variant)

### Out of scope

- Actually sending the invite email via the queue (kept consistent with `createClientInvite`, which returns the URL and lets the caller decide how to deliver it).
- "Copy link" UI for the Pro to share the URL manually (can be added later).
- Cooldown / throttle on resend.
- Tracking invite *acceptance* on the lead row — when the client accepts and signs in, `sender_user_id` will be linked through a separate path (not wired in this slice).
