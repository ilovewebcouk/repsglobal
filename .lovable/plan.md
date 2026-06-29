# Cancellation & Deletion — One Hard Rule

**Rule:** no one stays on REPs without an active subscription. Every cancel path ends in **account deletion**, with the email preserved on a mailing list so we can email them again later.

---

## 1. New table: `mailing_list_contacts`

Append-only archive of every deleted member. Used by `/admin/campaigns` and future broadcasts.

Columns: `email` (unique), `full_name`, `profession`, `city`, `former_user_id`, `last_tier`, `deleted_at`, `deletion_reason` (enum: `admin_cancel_immediate` | `admin_cancel_period_end` | `admin_end_trial` | `admin_delete` | `member_request`), `deletion_notes`, `marketing_opt_in` (default `true`, respects `suppressed_emails`), `source` (`cancellation` | `manual`).

RLS: admin-only read/write. Standard `GRANT`s + `service_role`.

`/admin/campaigns` recipient picker gains a **"Former members"** source that reads this table (filtered by `marketing_opt_in = true` AND not in `suppressed_emails`).

---

## 2. Canonical action: `cancelAndDeleteMember`

New server fn in `src/lib/admin/billing-actions.functions.ts` (admin + `has_role` check). Runs as one atomic flow:

1. **Stripe** — cancel subscription immediately (`stripe.subscriptions.cancel`, `invoice_now: false, prorate: false`).
2. **Archive** — insert row into `mailing_list_contacts` (snapshot name/email/profession/city/tier/reason/notes).
3. **Email** — enqueue `member-cancelled` Mailgun template (warm, founder-friend tone, mirrors `/admin/support` drafts; links to `https://repsuk.org`). Explains the account is closed, thanks them, leaves the door open.
4. **Delete** — cascade-delete from `public` tables (professionals, profiles, reviews, services, shop_fronts, photos, locations, gyms, subscriptions, etc.) then `supabaseAdmin.auth.admin.deleteUser(userId)`.
5. **Audit** — write `admin_audit_log` entry with reason + actor.

Wrapped so a Stripe or DB failure aborts before deletion (no orphaned half-states).

---

## 3. Three Billing tab actions — re-mapped

In `src/routes/admin_.members.$userId.tsx` `BillingActions`, all three buttons now require a **reason dropdown + free-text notes** before confirming (shadcn AlertDialog).

| Button | New behaviour |
|---|---|
| **End trial now** | Calls `cancelAndDeleteMember` with reason `admin_end_trial`. No charge attempt. Trial-enders are kicked off, not converted. |
| **Cancel at period end** | Calls `cancelAndDeleteMember` immediately with reason `admin_cancel_period_end`. (Per your answer: no grace, delete now.) The "schedule for later" path is removed from the UI entirely so it can't be picked by mistake. |
| **Cancel immediately** | Calls `cancelAndDeleteMember` with reason `admin_cancel_immediate`. |

After success: invalidate queries, toast "Account closed & archived to mailing list", redirect to `/admin/members` (the user no longer exists).

---

## 4. Support-ticket cancel flow

In `/admin/support` ticket view, add a **"Cancel this member's account"** card (visible only when the ticket author is a member). One click → opens the same AlertDialog (reason pre-filled `member_request`, notes pre-filled with the ticket subject + link). On confirm: runs `cancelAndDeleteMember`, posts a system message into the ticket ("Account closed at member's request — archived to mailing list"), auto-resolves the ticket.

---

## 5. Self-serve "Delete my account" (member side)

Out of scope for this stage — flag it for a follow-up. For now, members request via support and admin actions it.

---

## 6. Files touched

- **NEW** migration: `mailing_list_contacts` table + RLS + grants.
- **NEW** `src/lib/email-templates/member-cancelled.tsx` (+ register).
- **EDIT** `src/lib/admin/billing-actions.functions.ts` — add `cancelAndDeleteMember`; remove the old `endMemberTrialNow` / `setMemberCancelAtPeriodEnd` / `cancelMemberSubscriptionNow` exports (or make them thin wrappers that call the canonical fn).
- **EDIT** `src/routes/admin_.members.$userId.tsx` — rewire `BillingActions`, add reason dialog, redirect on success.
- **EDIT** `src/routes/admin_.support.tsx` (ticket view) — add cancel card.
- **EDIT** `src/routes/admin_.campaigns.tsx` — add "Former members" recipient source reading `mailing_list_contacts`.

---

## 7. Build order

1. Migration (table + grants).
2. `cancelAndDeleteMember` server fn + email template.
3. Member 360 Billing UI rewire (reason dialog + 3 buttons → one fn).
4. Support-ticket cancel card.
5. Campaigns "Former members" source.

Reply **"go"** for all 5, or **"stage N"** to phase it.