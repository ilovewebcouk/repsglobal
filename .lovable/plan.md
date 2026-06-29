## Problem

There are **57 professionals without a live Stripe subscription** showing as "Plan: Free" in `/admin/professionals`. 

- **52 are BD legacy imports** who never completed Stripe conversion  
  - 22 have a recorded `legacy_stripe_link.access_expires_at` in the past (fully expired)  
  - 27 have no expiry recorded (effectively expired — no Stripe linkage ever completed)  
  - 3 are still inside their honoured BD access window (future-dated `access_expires_at`)
- **5 are non-BD** (admin account, demo account, test signups — these stay)

These 49 expired accounts should not exist on the platform at all. The public visibility gate already hides them from search, but they clutter the admin register.

## Plan

### 1. Identify the exact 49 user IDs to delete
Query the canonical set:
- BD-claimed professionals (`bd_member_seed.claimed_user_id IS NOT NULL`)
- With NO active/trialing/past_due subscription in `public.subscriptions`
- With `legacy_stripe_link.access_expires_at <= now()` OR `access_expires_at IS NULL`
- Exclude `cruz.pt@icloud.com` (sole admin), `demo-verified@repsuk.org`, and any `email_confirmed_at IS NULL` test signups from the deletion set

### 2. Build a safe batch-deletion server function
Create `src/lib/admin/batch-cleanup.functions.ts`:
- Accepts a list of `user_id`s + a single `reason: "admin_delete"`
- For each ID, calls the **existing** `cancelAndDeleteMember` canonical function (already handles Stripe cancel → archive email → delete auth user → audit log)
- Since these 49 have **no live Stripe subscription**, `cancelAndDeleteMember` will skip Stripe cancellation (no sub to cancel), archive the contact, send the "member-cancelled" email, delete the auth user, and write the audit log
- Returns a report: `deleted: string[]`, `failed: {user_id, error}[]`
- Rate-limit internally (max 5/sec) to avoid hammering auth or Mailgun

### 3. Run the batch (admin-protected)
Call the batch fn from the admin surface with the 49 IDs. Log the full result to `admin_audit_log`.

### 4. Verify
Re-query the database to confirm:
- The 49 IDs no longer appear in `auth.users`, `profiles`, `professionals`
- The 3 still-in-window BD pros remain untouched
- The admin Professionals KPI count drops from 391 → 342 (or 391 → 342 + 3 grace-period = 345)

### 5. (Optional) Add a "No subscription" filter chip to `/admin/professionals`
So any future edge cases can be found and actioned without a manual query.

## Safety

- The canonical `cancelAndDeleteMember` already archives the email to `mailing_list_contacts` before deletion, so the contact is not lost for future campaigns.
- It already sends a cancellation email via Mailgun.
- It already writes an admin audit log entry.
- No schema changes required.
- The 3 BD pros still in their honoured window are explicitly excluded from the batch query.

## Deliverable

49 expired BD legacy pros permanently removed from the platform. Admin register reflects only paying members + the 3 still in grace period.