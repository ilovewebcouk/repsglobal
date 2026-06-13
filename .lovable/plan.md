## What changes

### 1. Kill the "1 of 3 verification checks" strip
- Remove `TrustStatusStrip` from `/dashboard/profile`.
- Identity and Insurance become numbered profile-completion items, sitting alongside Photo, Basic info, Bio, etc. — one single progress model on the page (the existing Profile Completion meter), not two competing ones.
- Qualifications stay out of this page entirely; they live in Education & CPD and only surface as a small status row (or a chip inside the relevant completion item) that deep-links there.

### 2. Slot Identity + Insurance into Profile Completion
- Extend the completion checklist source of truth so it tracks two new items:
  - `identity_verified` — true when Stripe Identity returns `verified`.
  - `insurance_on_file` — true when there's an approved (or pending-review) insurance policy with a future expiry.
- Both items get the same numbered card treatment as the existing profile steps (e.g. 05 Identity, 06 Insurance), with status pill: Not started / In review / Verified / Expiring soon / Expired.
- The Profile Completion percentage now reflects them, so finishing verification literally moves the same meter — no parallel "1 of 3" UI.

### 3. Insurance: AI-scan upload, same flow as certificates
Mirror the existing `UploadCertificateDialog` → AI extract → user confirms → admin reviews pattern, but for insurance docs.

User flow on the Insurance card:
1. Two entry points on one button group:
   - **Upload document** (PDF / JPG / PNG, same as certificates)
   - **Scan with phone** — opens a dialog showing a QR code; phone opens a mobile upload page, snaps/uploads the photo, it lands back in the desktop dialog in real time.
2. File goes to the existing `insurance-docs` bucket via the existing `uploadVerificationAsset` server fn.
3. New server fn `extractInsuranceFromDoc` calls the Lovable AI Gateway (vision) and returns a structured draft: provider, policy number, cover amount (GBP), start date, expiry date, insured name.
4. Pre-filled confirm form (same shape as `saveInsurance` input today) — user edits any field, submits.
5. Row written as `status: 'pending'`, admin reviews in the existing admin verification queue; on approval the profile-completion item flips to Verified.

### 4. QR "scan with phone" handoff
- New short-lived upload session row (`insurance_upload_sessions`: id, professional_id, status, doc_path, created_at, expires_at — 15 min TTL).
- Desktop dialog creates a session, renders QR pointing at `/u/insurance/$sessionId` (mobile-only public-feeling route, gated by the unguessable session id + the session being `pending` and unexpired; no auth required on the phone).
- Mobile page: camera capture or file picker → uploads via a server fn that validates the session id, stores to `insurance-docs/<professional_id>/...`, writes `doc_path` onto the session, marks `uploaded`.
- Desktop dialog polls (or realtime-subscribes to) the session row; when `uploaded`, it pulls the doc, runs AI extract, and drops the user into the confirm form.

### 5. Copy + status
- Insurance card copy: "Public liability insurance — required to take clients through REPs. Upload your certificate or scan it with your phone; we'll read it for you."
- No tier framing, no "Pro only" — verification is universal for paying members.
- Expiring-soon nudge (≤ 30 days) and Expired state both show on the same card with a one-click "Replace document".

### 6. Cleanups while we're in there
- Delete `TrustStatusStrip` usage (component can stay for now, just not mounted).
- Stripe Identity return URL stays `/dashboard/profile?stripe_identity=complete#identity` — Identity card scrolls into view + refetches.
- No changes to qualifications UI on the profile page beyond a tiny "Qualifications managed in Education & CPD →" link inside the trust area (or removed entirely if you'd rather it just live in the sidebar).

## Technical details

- Files most affected:
  - `src/routes/_authenticated/_professional/dashboard_.profile.tsx` — drop strip, add Identity + Insurance as numbered completion cards, wire to completion %.
  - `src/components/dashboard/verification/TrustBlock.tsx` — split into `IdentityProfileCard` (keep) + `InsuranceProfileCard` (rewrite around new upload+AI flow). Remove `TrustStatusStrip` from render tree.
  - New `src/components/verification/InsuranceUploadDialog.tsx` modelled on `UploadCertificateDialog` (upload tab + QR tab + confirm step).
  - New `src/components/verification/InsuranceQrHandoff.tsx` (QR + polling).
  - New mobile route `src/routes/u.insurance.$sessionId.tsx` (public, session-gated).
  - New `src/lib/verification/insurance.functions.ts` additions: `createInsuranceUploadSession`, `getInsuranceUploadSession`, `submitInsuranceFromMobile`, `extractInsuranceFromDoc` (Lovable AI vision call).
  - `src/lib/profile/dashboard-profile.functions.ts` (or wherever completion % is computed) — include `identity_verified` and `insurance_on_file` in the checklist.
- New table `public.insurance_upload_sessions` with RLS: owner can read/update their own; the mobile submit path uses a server fn with service role after validating the session id and that the session is `pending` + unexpired (no auth on the phone). GRANTs as per project rules.
- AI extraction goes through the Lovable AI Gateway (no new API key); reuses the pattern already in `cpd.functions.ts` for certificate extraction.
- Admin review reuses the existing `admin_.verification.tsx` queue — insurance rows already flow through it.

## Does this make it 10/10?

Yes — provided we also:
- keep one progress model on the page (Profile Completion only),
- make the QR handoff feel instant (realtime/poll + auto-advance to confirm),
- and treat the AI extract as a draft the user confirms, never as ground truth.

If you're happy with this, I'll switch to build mode and start with the schema + insurance upload dialog, then wire it into the profile page and remove the trust strip.