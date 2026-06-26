## Goal

Lift insurance verification to the same AI-assisted standard as qualifications, and close the trainer-notification gap so a pro is never left with a silent "stuck" verification.

For Jordan's case specifically: he should have been told the moment he uploaded the expired certificate; failing that, he should be told the moment an admin opens his case and can't verify; failing that, a scheduled renewal nudge should reach him before expiry.

## Brutal-honest current state (for context, not action)

- AI extraction exists on both insurance and qualifications (Gemini 2.5 Pro).
- Qualifications also have Ofqual cross-check, name-match, AI persisted on the row.
- Insurance has none of: persistence, expiry guard, low-cover guard, name-match, trainer notification, renewal nudge.
- No trainer-facing notification fires when verification is blocked.

## Scope

### 1. Insurance: persist AI signals on the row

Migration on `insurance_policies`:
- `ai_extraction jsonb` — full Gemini result + confidence
- `ai_checked_at timestamptz`
- `trust_signals jsonb` — `{ expired, expires_soon, low_cover, name_match, provider_known }`
- `insured_name text` — extracted name on the certificate
- `name_match boolean` — comparison to `professionals.identity_verified_name`

No new tables. Existing RLS already covers admin + owner reads.

### 2. Insurance: run AI at submit time and act on it

Refactor `saveInsurance` (`src/lib/verification/insurance.functions.ts`):
- After upload, call `runInsuranceAi(...)` server-side (don't trust client-supplied fields blindly).
- Compute trust signals:
  - `expired` = `expiry_date < today`
  - `expires_soon` = within 30 days
  - `low_cover` = `cover_amount_gbp < 1_000_000` (industry minimum £1m PL)
  - `name_match` = fuzzy-match `insured_name` vs `identity_verified_name` (reuse cert helper)
  - `provider_known` = provider name in a small allow-list (Insure4Sport / Hiscox / Westminster / Protectivity / Tribe / Fitpro / Sportscover etc.)
- **If `expired`**: reject the save with a clear error (`"Certificate expired on {date} — please upload your current cover."`). Trainer sees the message inline; nothing is written to `insurance_policies`.
- **Otherwise**: persist row with `ai_extraction`, `trust_signals`, `insured_name`, `name_match`, `ai_checked_at`.

Admin verification page (Step 2) reads the new fields and shows the same chip pattern as the Ofqual panel:
- Green: "AI: provider verified · £5m cover · name matches"
- Amber: "AI: name mismatch — printed as {insured_name}"
- Red: "AI: cover below £1m" / "AI: expires in 6 days"

### 3. Qualifications: surface AI on the admin card

Already extracted, already persisted — just bring its summary chips alongside the Ofqual chips already shown. No DB work.

### 4. Trainer notifications (bell + email)

New helper `notifyVerificationEvent(proId, event)` writing to existing notification rails. Events:

| Event | Trigger | Bell + Email |
|---|---|---|
| `insurance.rejected_expired` | Server rejects an expired upload at submit | ✅ |
| `insurance.flagged` | Row saved with red trust signals (low cover / name mismatch) | ✅ |
| `insurance.expires_soon` | Cron at 60/30/7/0 days before expiry (once per threshold; uses `verification_renewal_nudges` table already in DB) | ✅ |
| `qualification.flagged` | Submission saved with `name_mismatch` or Ofqual `not-found` | ✅ |
| `verification.blocked_by_insurance` | Admin opens a case where ID + qual pass but insurance missing/expired → auto-fire once per pro per 14 days | ✅ |

Bell uses existing review/support notification table pattern (`review_notifications`-style). Email uses the existing `contact-autoresponse` pipeline with two new React Email templates: `verification-blocked.tsx` and `verification-renewal-due.tsx`. Copy matches the standardised tone we shipped for review removals.

### 5. Renewal cron

Single pg_cron job daily at 09:00 UTC calling a new SQL function `insurance_check_renewals()` which:
- Scans `insurance_policies` where `status = 'active'`
- Computes days-to-expiry; inserts into `verification_renewal_nudges` for thresholds not yet sent
- Enqueues an email per insert via `enqueue_email('transactional', ...)` (existing pgmq queue)
- Idempotent via the existing `verification_renewal_nudges` primary key

### 6. Admin verification UX (small)

In `src/routes/admin_.verification.tsx` Step 2:
- New "Nudge trainer to renew" button (visible when insurance is expired or within 14 days) → calls `notifyVerificationEvent(proId, 'verification.blocked_by_insurance')` on demand. Disabled-and-greyed for 14 days after firing.
- Status banner at the top of the page: "Blocked: insurance expired on {date}. Trainer was notified {relative time}." So you can always see whether the trainer knows.

## Out of scope

- Re-architecting Stripe Identity (already works).
- Changing the public "REPS Verified" badge rule (stays ID + qual + in-date insurance).
- Auto-approving insurance without admin sign-off. AI accelerates; humans still confirm.
- Buying insurance through REPs / partnerships.

## Acceptance

- Pro uploads an expired certificate → save fails inline with a clear message; no row is created; nothing for admin to do.
- Pro uploads a valid certificate with £500k cover → row saved, AI flag visible to admin, pro receives "your cover is below the industry minimum" email.
- 30 / 7 / 0 days before expiry, pro receives a renewal reminder email and a bell notification — exactly once per threshold.
- Admin opens Jordan's case today → can hit "Nudge trainer to renew", which sends the email + bell; banner records the nudge.
- All three gates green → existing approve button works unchanged.
