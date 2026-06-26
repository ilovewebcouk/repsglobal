## Full verification QA plan — trainer view, admin view, notifications

### Brutal diagnosis

The current verification experience is split-brained:

1. **Education & CPD looks empty during admin “view as Jordan”** because `myCertificates` still uses plain `requireSupabaseAuth`, so the server reads the signed-in admin’s certificates instead of the impersonated trainer’s certificates.
2. **Insurance can look empty / not pending for the same reason** because `myInsurance` also uses plain auth instead of the impersonation-aware middleware.
3. **Verification says “Qualifications: Not started”** because `getTrustState` only counts `approved` rows. Submitted certificates and “changes requested” rows are invisible to the summary, so pending qualifications are treated like they do not exist.
4. **The dashboard verification card has a bad fallback**: it guesses qualifications are “In review” based on unrelated identity/insurance activity rather than actual qualification rows.
5. **Expired insurance is computed inconsistently**: some UI computes expiry at render time, but the trust model and notification rail do not guarantee the trainer sees “Your insurance expired — upload a new one.”
6. **Notifications are not complete**: insurance nudges exist, but qualification review decisions are not wired into trainer bell/email events, and the bell is disabled for admins even when an admin is impersonating a trainer.
7. **Impersonation chrome is hiding trainer context**: `getImpersonationStatus` does not return the trainer email, and `useEffectiveIdentity` replaces the tier with “Viewing,” which makes QA harder.

### What “world-class 10/10” should do

For the trainer dashboard, every page should use the same source of truth:

- **Identity**: Stripe/manual status from `professionals.identity_status`.
- **Insurance**: latest insurance row, with `expired` computed from `expiry_date < today`; expired is a blocking state, not “pending” and not empty.
- **Qualifications**: all relevant `verification_submissions` statuses, not just approved.

The trainer should see:

- Expired insurance: red state, exact expiry date, clear “Upload renewed certificate” CTA, bell notification.
- Submitted qualification: amber “Pending review,” visible in Verification and Education & CPD.
- Changes requested: amber/red “Action needed,” admin note visible.
- Rejected qualification: visible, not silently hidden.
- Approved qualification: green, title unlocked.

### Build plan

#### 1. Fix impersonation data reads

Files:
- `src/lib/verification/insurance.functions.ts`
- `src/lib/cpd/cpd.functions.ts`

Changes:
- Swap `myInsurance` from `requireSupabaseAuth` to `requireSupabaseAuthWithImpersonation`.
- Swap `myCertificates` from `requireSupabaseAuth` to `requireSupabaseAuthWithImpersonation`.
- Keep upload/save/delete functions on normal auth unless deliberately allowing admins to mutate trainer data.

Acceptance:
- While viewing as Jordan, Education & CPD shows Jordan’s uploaded certificates.
- Verification insurance card shows Jordan’s latest insurance row instead of “upload certificate” when he already has one.

#### 2. Fix impersonation identity chrome

Files:
- `src/lib/admin/impersonation.functions.ts`
- `src/hooks/use-effective-identity.ts`

Changes:
- In `getImpersonationStatus`, fetch the impersonated trainer’s auth email via `supabaseAdmin.auth.admin.getUserById`.
- Return `email` in the active impersonation payload.
- In `useEffectiveIdentity`, stop forcing `email: null` and stop forcing `tierLabel: "Viewing"`.
- Show the actual subscription label: `Verified`, `Pro`, or `Studio`.

Acceptance:
- Sidebar card/header clearly show the trainer being viewed, with their real trainer tier label.

#### 3. Make `getTrustState` a real single source of truth

File:
- `src/lib/verification/trust.functions.ts`

Changes:
- Query all trainer verification submissions with statuses:
  - `submitted`
  - `changes_requested`
  - `approved`
  - `rejected`
- Extend `TrustState.qualifications` with:
  - `pendingCount`
  - `changesRequestedCount`
  - `rejectedCount`
  - `totalCount`
- Keep `count` as approved count for backwards compatibility.
- Insurance status remains computed from latest insurance row, but expired must always win over `active`/`pending` if the expiry date is in the past.

Acceptance:
- A trainer with submitted certificates but no approved certificates shows “Pending review,” not “Not started.”
- A trainer with expired insurance shows `insurance.status = "expired"` everywhere.

#### 4. Fix Verification page qualification status

File:
- `src/routes/_authenticated/_professional/dashboard_.verification.tsx`

Changes:
- `QualificationsCard` should render:
  - Green `Verified` when approved count > 0.
  - Amber `Pending review` when pendingCount > 0.
  - Amber/red `Changes requested` when changesRequestedCount > 0.
  - Red/neutral `Not approved` when only rejected rows exist.
  - Neutral `Not started` only when total count is 0.
- Copy should point to Education & CPD and describe exactly what is happening.

Acceptance:
- Jordan’s Verification page no longer says “Qualifications: Not started” if a certificate exists in review.

#### 5. Fix dashboard hub verification summary

File:
- `src/components/dashboard/hub/index.tsx`

Changes:
- Stop guessing qualification status from identity/insurance activity.
- Use the new counts in `trust.qualifications`.
- Insurance detail for expired should say: `Expired {date} — upload renewed certificate`.

Acceptance:
- Dashboard summary mirrors the Verification page exactly.

#### 6. Improve insurance card copy and state

File:
- `src/components/dashboard/verification/TrustBlock.tsx`

Changes:
- Include `insured_name` in `InsuranceRow` type and display it.
- For expired insurance, show a red warning panel:
  - “Your insurance expired on {date}. You are not fully verified until you upload a current certificate.”
  - CTA: “Upload renewed certificate” (not generic “Replace certificate”).
- For pending insurance, show “Pending admin review.”
- For rejected insurance, show the admin note and renewal CTA.

Acceptance:
- Jordan sees the problem immediately in the insurance section without waiting for admin nudges.

#### 7. Wire qualification review notifications

Files:
- `src/lib/verification/notifications.functions.ts`
- `src/lib/verification/verification.functions.ts`

Changes:
- Add events:
  - `qualification.approved`
  - `qualification.rejected`
  - `qualification.changes_requested`
- Add notification titles/previews for these events.
- In `reviewVerification`, after updating a submission, call `notifyVerificationEvent` with:
  - professional id
  - submission id in context
  - qualification title
  - admin note where relevant
  - `alsoEmail: true` for rejected / changes requested / approved if desired.
- Do not update `professionals.verification = "verified"` from qualification approval alone; full verified remains ID + qualification + in-date insurance.

Acceptance:
- Trainer gets bell notification when qualification is approved, rejected, or changes requested.

#### 8. Make the bell work while admin is viewing as trainer

File:
- `src/components/dashboard/NotificationsBell.tsx`

Changes:
- Use `useEffectiveIdentity` or impersonation status to enable verification notifications while impersonating.
- Keep admin support notifications available for real admin mode, but when impersonating trainer pages, the verification rail should query the impersonated trainer via the impersonation-aware server function.
- Update subtitle copy from “Reviews, support tickets, and inbound emails” to include verification.

Acceptance:
- In “Viewing as Jordan” mode, the bell can show Jordan’s verification notifications.

#### 9. Align Education & CPD empty state

File:
- `src/routes/_authenticated/_professional/dashboard_.cpd.tsx`

Changes:
- Once `myCertificates` returns impersonated rows, the current page should populate.
- Add explicit copy for pending/changes requested so it does not look empty when there are no approved titles.

Acceptance:
- If a certificate exists but is pending, the certificate list is not empty and the top card says pending review.

#### 10. Optional migration cleanup for notification idempotency

File:
- New migration under `supabase/migrations/`

Changes:
- Add a unique expression index for qualification events if repeated decisions need idempotency by `submission_id`.
- If using generic `context`, index `(professional_id, event, context->>'submission_id')` for qualification notifications.

Acceptance:
- Re-reviewing or retrying does not spam duplicate trainer bell rows.

### QA checklist

- Admin views as Jordan → Verification page shows Jordan data, not admin data.
- Admin views as Jordan → Education & CPD shows Jordan certificates.
- Expired insurance row → red expired state, renewal CTA, no “pending” language.
- Pending insurance row → amber pending state.
- Submitted certificate row → pending review in both Verification and CPD.
- Changes requested row → action-needed state with admin note.
- Approved qualification + expired insurance + approved ID → still only 2/3, not fully verified.
- Bell shows insurance expiry/renewal notification for trainer.
- Bell shows qualification decision notification for trainer.
- Public REPS Verified badge still requires all three: ID approved, qualification approved, in-date insurance.