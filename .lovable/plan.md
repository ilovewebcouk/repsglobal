
# Member cancel & delete — end-to-end

Goal: when a member emails support asking to cancel (or be deleted), an admin can do it in one place, with a reason captured, an audit-log entry, an email confirmation back to the member, and a system note dropped into the ticket — without hopping between `/admin/support`, `/admin/professionals`, and `/admin/members/$userId`.

---

## 1. Member 360 — add "Delete account" (destructive)

File: `src/routes/admin_.members.$userId.tsx`

- Replace the disabled "Permanently delete (soon)" stub at line ~301 with a real `AlertDialog`, matching the pattern already used on `/admin/professionals` `DeleteMemberDialog`:
  - Reason `<Textarea>` (required, ≥ 8 chars).
  - Typed-confirmation input: must type the member's email to enable the destructive button.
  - Red destructive `AlertDialogAction` "Delete account permanently".
- On confirm, call the existing `deleteProfessional` server fn (`src/lib/admin/professionals.functions.ts`) with `{ professional_id, reason }`. After success: toast, `router.navigate({ to: '/admin/professionals' })`, and invalidate the members + professionals queries.
- Self-delete and last-admin guards already live in `deleteProfessional` — no server change needed for this step.

## 2. Cancel actions — reason + confirmation email

File: `src/lib/admin/billing-actions.functions.ts`

Extend inputs (not new functions) so we capture intent and notify the member:

- `setMemberCancelAtPeriodEnd` → add optional `reason: string | null`. Persist on the audit log entry (already does); pass to email.
- `cancelMemberSubscriptionNow` → already accepts `reason`; keep.
- After Stripe + mirror succeed, send a branded Mailgun email via the existing `sendTransactionalEmailServer` pipeline (same path used by `legacy-conversion-confirmation` and `contact-autoresponse`).

New React Email templates in `src/lib/email-templates/`:

- `membership-cancellation-scheduled.tsx` — subject "Your REPs membership is set to cancel on {date}". Body explains they keep access until renewal date, what happens after, and a one-line "changed your mind? reply to this email" CTA. Uses the warm "founder-friend" tone already locked in `src/lib/support/ai-draft.functions.ts`.
- `membership-cancelled-now.tsx` — subject "Your REPs membership has been cancelled". Confirms immediate cancellation, no further billing, profile is unpublished/archived where relevant, and how to come back.
- `membership-cancellation-removed.tsx` — sent when admin toggles `cancel_at_period_end` back off ("Good news — your REPs membership will continue").
- `account-deleted.tsx` — sent from `deleteProfessional` after `auth.admin.deleteUser` succeeds, to the (now-archived) address. Confirms deletion, GDPR erasure summary, and support contact.

All four templates register in `src/lib/email-templates/registry.ts` and use the existing Mailgun sender (no infra changes — Mailgun connector already wired and used by `sendViaMailgun`).

UI: the `BillingActions` confirm dialogs in `admin_.members.$userId.tsx` get a `Textarea` for reason (required for `cancel_now` and `delete`, optional for `schedule_cancel` / `resume`). The reason is shown in the toast and persisted via the audit log.

## 3. One-click cancel from a support ticket

File: `src/routes/admin_.support.tsx` (ticket detail panel) + new `src/components/admin/support/MemberCancelMenu.tsx`.

For any ticket linked to a known `user_id` (or whose `from_email` matches a `profiles.email`):

- Resolve subscription state via the canonical `computeMemberBillingRow` (already the single source of truth) and render a compact card above the reply composer:
  - Header: tier pill + status pill + renewal date (reuses the same `BillingPane` formatting so it can't diverge from Member 360).
  - Action dropdown "Cancel membership…" with 3 items: **Cancel at period end**, **Cancel immediately**, **Delete account**.
- Each item opens the matching `AlertDialog` (reason required, typed confirm for delete) and calls the same server fns from §2.
- On success:
  1. The corresponding confirmation email goes to the member (from §2).
  2. A system message is inserted into the ticket via `support_messages` (kind = `system_event`, body = "Admin cancelled subscription at period end — reason: …"). This is a new server fn `insertSupportSystemEvent` in `src/lib/support/messages.functions.ts` that uses `supabaseAdmin` and writes with `author_kind = 'system'`.
  3. Ticket status auto-advances to `awaiting_member` (or `resolved` if delete) — opt-in via a checkbox in the dialog, default on.
- "Open Member 360" link in the card header for the full workbench when the admin needs more context.

## 4. Audit + consistency

- Every action above writes to `admin_audit_log` with `action ∈ { member.schedule_cancel, member.resume_subscription, member.cancel_subscription_now, member.delete_account }`, target `user_id`, and the captured reason.
- No change to the resolver — UI keeps reading from `computeMemberBillingRow` so the ticket card, professionals list, and Member 360 header pills update together after invalidation.

## Acceptance

- From a support ticket, an admin can cancel (period-end / now) or delete a member in three clicks, capture a reason, and the member receives a branded Mailgun email — without leaving `/admin/support`.
- Member 360 has a real Delete dialog with typed-confirmation; the "soon" stub is gone.
- Each cancel/delete leaves: an `admin_audit_log` row, a system message inside the originating ticket, and an entry in `email_send_log`.
- Header pills on Member 360 and the row on `/admin/professionals` reflect the new state instantly (existing query invalidation).

## Out of scope

- Self-serve cancellation in the trainer dashboard (still routes through support today — separate plan).
- Refund issuance (manual in Stripe; we only cancel).
- Win-back automation after delete (covered by churn module).
