# Verification QA — Phase 2.1 hardening (locked)

## Decisions locked
- **Name-match rule:** subset match. `"James Wilson"` ↔ `"James Robert Wilson"` ✅, `"Jane Doe"` ↔ `"John Smith"` ✗.
- **Revoke semantics:** identity and qualifications are revoked separately, because they grant different things.

## Step 1 — Sidebar tier leak ✅ DONE
`dashboard_.verification.tsx` now passes `tier={useTrainerTier()}` into `<DashboardShell>`. The other four routes were already correct.

## Step 2 — Name-match gate on auto-approve

In `handleIdentityEvent` (`src/routes/api/public/payments/webhook.ts`), after pulling `verified_outputs.first_name/last_name`:

- Load `profiles.full_name` for the pro.
- Normalise both (lowercase, trim, strip punctuation, drop titles "Mr/Mrs/Ms/Dr/Prof", collapse whitespace).
- Subset match: pass if first + last on doc both appear as whole words in the profile name (or vice versa).
- On mismatch: write `status='needs_more_info'` (not `approved`), set `stripe_reason` to `"Name on ID (\"<doc>\") does not match your REPS profile name (\"<profile>\"). Update your profile to match your legal name, or restart the check with the correct ID."`.

The pro card already renders `stripe_reason` in an amber banner with a "Restart ID check" button — no UI work needed.

## Step 3 — Admin: approved + history view + identity tab + revoke

### Server fns (new)
- `listVerifications({ statuses })` in `verification.functions.ts` — replaces the hard filter; `listPendingVerifications` becomes a thin alias.
- `revokeQualification({ submissionId, reason })` in `verification.functions.ts`:
  - Updates `verification_submissions.status='rejected'` (or new `revoked` value if we want to keep the distinction — see Open below), sets `admin_note = "REVOKED: <reason>"`.
  - Writes a `verification_decisions` row with `decision='rejected'`, `notes`, `reviewer_id`.
  - **Deletes `pro_titles` WHERE `source_submission_id = submissionId`** — the titles came from this qualification, so they go with it.
  - If the pro has no other approved submissions, also flips `professionals.verification_status` back to `unverified`.
  - Admin-only (`has_role` check).
- `listIdentityChecks({ statuses })` in `identity.functions.ts` — admin index of all `identity_documents`.
- `adminOverrideIdentity({ identityId, decision, reason })` in `identity.functions.ts` — manual approve / reject / needs-more-info on a Stripe identity record. Stamps reviewer + reason in `admin_note`.

### Admin UI (`src/routes/admin_.verification.tsx`)
- Replace `All / Mine / SLA risk` pills with status pills: **Pending · Approved · Rejected · Changes requested**. Default = Pending.
- Workspace pane for an *approved* case: reviewer, decision time, granted titles (from `pro_titles` where `source_submission_id = case.id`), public profile link, and a **Revoke qualification** button → confirmation dialog requiring a reason (calls `revokeQualification`).
- New top-level tab on the same page: **Identity checks**. Table of `identity_documents` rows (name / status / vendor / submitted / reviewed). Status filter + search. Per-row actions: Approve / Reject / Mark needs-info (manual override, with reason). Note in the UI: "Identity does not grant titles — those come from qualifications."

No schema changes required. `pro_titles.source_submission_id` already has `ON DELETE CASCADE`, but we'll delete explicitly to keep the submission row for audit.

## Step 4 — Pro "in review" copy polish

In the identity card's pending state (`dashboard_.verification.tsx`):
- Add `"Usually takes 1–5 minutes — refresh or check back shortly."`
- If `created_at` >10 min ago, surface `"Taking longer than expected? Contact support."` link.

## Open question (small)
**Should I add a new `'revoked'` value to the `verification_submission_status` enum**, so revoked cases are visibly distinct from a fresh rejection in the admin list? Either:
- (a) Reuse `'rejected'` — simpler, no schema migration, but you can't filter "revoked after approval" separately from "rejected first time".
- (b) Add `'revoked'` — one-line ALTER TYPE migration, cleaner audit trail, slightly more work.

Say (a) or (b) and I'll execute Steps 2 + 3 + 4 in one pass.