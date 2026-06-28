---
name: trust-no-self-removal
description: REPs is a Trustpilot-style public register. Profiles are NEVER hidden as a trust action — only the Verified badge changes.
type: policy
---

REPs does not hide professional profiles as a trust action. Once on the
register, a pro stays on the register (reviews, history, profile content all
remain public). What changes is the **Verified** badge.

Drops a pro to **Unverified** (display label for `verification = 'pending'`):
- Admin "Mark as unverified" (replaces the old "Suspend" action). Reason
  captured in `professionals.suspension_reason`; `suspended_at` set; email
  sent via `professional-suspended` template; `is_published` is NOT touched.
- Stripe chargeback received (handled at row mapper via `billingState`).
- Failed payment after recovery exhausted (handled via `billingState`).
- Insurance expired, ID/qual revoked (existing `recompute_pro_verification`
  trigger keeps DB column in sync).

The admin row mapper in `src/lib/admin/professionals.functions.ts` forces
`status = 'pending'` (UI label "Unverified") whenever `billingState !== 'ok'`
or `suspended_at` is set. Billing pills (Payment failed / Renewal due) render
alongside the Unverified pill.

Only path that ever sets `is_published = false` is reserved for legal /
GDPR-erasure / impersonation / deceased cases — not the row menu. The
"Suspend professional" dialog has been renamed "Mark as unverified" and no
longer mentions removing from the public directory.

Reviews are never hidden as a side-effect of any trust action.
