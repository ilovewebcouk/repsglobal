## Policy (the rule going forward)

A professional's public profile is **never hidden** by REPs. Like Trustpilot, once you're on the register you stay on the register — reviews, history and all. What changes is the **trust badge**.

Any of the following drops a pro to **Unverified** (badge removed, public profile remains live):
- Admin suspension (manual trust action — fraud flag, complaint under review, etc.)
- Stripe chargeback / dispute received
- Failed payment that exhausts recovery (final dunning step)
- Insurance expired with no replacement
- Identity / qualification revoked

A pro can re-earn **Verified** by resolving the underlying issue (pay, re-submit ID, upload valid insurance) — automatic where possible, admin-reviewed where not.

A pro can **never self-unpublish** to escape reviews. The only path to full removal is admin-only and reserved for: death, legal order, proven impersonation, GDPR erasure request that we're legally required to honour.

---

## Changes

### 1. Rename + repurpose the "Suspend" action (the dialog in your screenshot)

In `src/routes/admin_.professionals.tsx` and its row-action menu:
- Rename **Suspend & notify** → **Mark unverified & notify**
- Dialog title: "Mark Derek Paterson as Unverified?"
- Dialog body: *"Their public profile stays live. The Verified badge will be removed and they'll receive an email with the reason below. They can re-verify at any time."*
- CTA button: **Mark unverified**
- Remove all copy/logic about "removed from the public directory"
- Add a small "Restore to verified" action on the row when status = unverified-by-admin (admin override only, with audit log)

### 2. Server: new trust-state transition (no profile hiding)

New server fn `markProfessionalUnverified` in `src/lib/admin/professionals.functions.ts`:
- Requires `requireSupabaseAuth` + admin role check
- Sets `professionals.verification = 'unverified'`
- Writes reason + actor + timestamp to `verification_decisions` (existing table)
- Writes `admin_audit_log` entry
- Writes member timeline event
- Sends `verification-revoked` email (new template, mirrors the existing removal-reason tone)
- **Does NOT** touch `is_published`, `slug`, profile content, services, gallery or reviews

Retire / hide the old "suspend (unpublish)" path — keep the underlying capability as an **admin-only "Hard remove (legal/erasure)"** action behind a separate, confirm-twice dialog with a fixed reason category (`legal_order | impersonation | gdpr_erasure | deceased`). This is the only path that ever sets `is_published = false`.

### 3. Auto-drop to Unverified on billing events

In `src/routes/api/public/payments/webhook.ts` (Stripe webhook):
- On `charge.dispute.created` → call shared `transitionToUnverified(userId, reason: 'chargeback')`
- On final failed-payment lifecycle step in `src/routes/api/public/hooks/lifecycle-cron.ts` (after recovery emails exhausted) → call same helper with `reason: 'payment_failed_recovery_exhausted'`

Shared helper lives in `src/lib/verification/trust-transitions.ts`:
```text
transitionToUnverified(userId, reason)
  → updates professionals.verification
  → writes verification_decisions row (system actor)
  → writes admin_audit_log
  → writes timeline event
  → emails the pro (template per reason)
  → never modifies is_published
```

Mirror the existing insurance-expiry trigger pattern (`recompute_pro_verification`) so the DB stays the single source of truth for the `verification` column.

### 4. Auto re-promote when the issue clears

Extend `recompute_pro_verification` trigger so when:
- chargeback `dispute.closed` resolves in our favour, OR
- failed payment is recovered (new successful charge), OR
- valid insurance is uploaded, OR
- admin clicks "Restore to verified"

…the pro flips back to `verified` automatically **only if** ID + Qual + Insurance + active billing are all green again. Otherwise stays `unverified` with the live reason.

### 5. Public profile behaviour (`/pro/$slug`)

- Profile remains fully visible at all verification states (no 404, no "removed")
- The green Verified pill (`src/routes/pro.$slug.index.tsx`) just doesn't render when status ≠ verified — already how it works, no change needed
- Add a subtle line under the name when status = `unverified`: *"Not currently verified by REPs"* with a link to `/help/verification/overview`. Reviews stay visible. Services stay visible.

### 6. Directory / search

In `src/lib/directory/featured.functions.ts` and `src/lib/directory/search.functions.ts`:
- Featured carousels: keep the existing `verification = 'verified'` filter (Featured is a privilege of trust)
- Main search results: **include unverified pros** but sort verified above unverified and show the Unverified pill on their card

### 7. UI status tab in admin

`src/routes/admin_.professionals.tsx`:
- Existing tabs stay (`All`, `Payment failed`, `Renewal due`, `Demos`)
- Add tab **`Unverified`** that surfaces every pro currently in `unverified` state with the reason badge (admin-suspended / chargeback / payment / insurance / identity / qualification)
- Row pill colour stays amber for `Unverified`, matches existing token

### 8. Help + emails

- New help article `src/content/help/articles/verification-revoked.tsx` explaining the policy and how to re-earn verified
- New email template `src/lib/email-templates/verification-revoked.tsx` (reason-aware)
- Update `verification-rejected.tsx` and `troubleshoot-signin.tsx` cross-links

### 9. Docs

Update `.lovable/mem/design/locked-reviews.md` and `docs/admin-v2/06-verification-trust-and-safety.md` with the no-self-unpublish + auto-unverify policy. Add memory entry `mem://policy/trust-no-self-removal`.

---

## Technical details

- Migration adds an enum value `unverified_reason` (postgres enum) covering: `admin_suspended | chargeback | payment_failed | insurance_expired | identity_revoked | qualification_revoked` and a `professionals.unverified_reason` column (nullable).
- Trigger `recompute_pro_verification` extended to read the new column when deciding whether to clear it on re-promotion.
- All new server fns go through `requireSupabaseAuth` + admin role check; `transitionToUnverified` is internal-only (not exported from a route).
- Hard-remove path keeps `is_published = false` capability but moves it behind a separate confirm-twice modal so it can't be hit by accident from the row menu.
- Reviews table untouched — no review ever gets hidden as a side-effect of any of this.
