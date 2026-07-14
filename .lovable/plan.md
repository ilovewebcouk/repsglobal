# Provider endorsement terms + Ofqual-field guard + logo-gate on issuance

Three linked changes plus a brutal-honest list of what else the terms should cover.

## 1) Provider Endorsement Terms — versioned + acceptance-tracked

**Public page: `/legal/endorsement-terms`** — canonical, versioned document. Every acceptance stores the version string it agreed to, so future changes force re-consent.

### The terms (v1) — plain-English clauses providers must accept

Wording draft I'll ship (compact, brutal, no legalese):

1. **REPS-issued certificates only.** You will not print, issue, watermark or attach a REPS badge, logo, wordmark, "REPS-endorsed", QR code, verification URL, certificate number, or any REPS-mimicking mark on any certificate you produce yourself. The only certificate that endorses a REPS-endorsed qualification or course is the certificate REPS issues.
2. **No unendorsed advertising.** You will not describe, advertise, list, imply or market any qualification or course as "REPS-endorsed", "REPS-accredited", "REPS-approved", "REPS-recognised", "REPS partner" or similar unless it is currently endorsed by REPS and shown on your public REPS profile. Withdrawn or pending items must be removed from all channels within 7 days.
3. **Endorsement statement, verbatim.** Where a course requires the REPS endorsement statement to appear on a public page, it must be displayed exactly as provided by REPS, on the URL you submitted, for as long as the endorsement is live. Removing, altering, or hiding it is a breach.
4. **Correct wording on submissions.** You confirm every field submitted for endorsement uses the exact title, level, credential type, awarding body (if any), Ofqual number (if any), delivery mode and assessment method that matches the real product you deliver. Marketing puffery, invented levels, or mismatched titles are a breach.
5. **Provider name is the endorsed entity.** REPS endorses **you, under the trading name on file**. You will not change your trading name, transfer the endorsement to another legal entity, sell/lease/sublicense it, or allow any third party to deliver under your endorsement. Legitimate name changes require written REPS approval before use — a fresh review may be required.
6. **Learner records are truthful.** You will only register learners who have genuinely completed and passed the course you delivered. Bulk-issuing to non-attendees, back-dating, or issuing to people you have not personally assessed is a breach and may be reported to Action Fraud.
7. **Reasonable requests.** You will respond to REPS audit or clarification requests within 10 working days, including sample assessment evidence, learner attendance records, and public-page checks.
8. **Suspension consequences (public interest notice).** A material breach results in **permanent suspension from REPS**. On suspension:
   - your profile, reviews and history remain publicly visible;
   - a clear public notice is shown on your profile and every endorsed-course page stating you have been suspended from REPS, with the date;
   - all previously-issued REPS certificates remain valid (learners keep their credential);
   - you may not reapply under a different trading name, company, or director without written REPS approval.
   REPS retains and displays this record indefinitely because it is in the public and learner interest. You waive any right to have this record removed on request.
9. **Data & Ofqual claims.** The Ofqual number field is used exclusively for Ofqual-regulated qualifications. Populating it with anything else (e.g. an internal reference, awarding-body ID, or a number you don't hold current approval for) is a breach.
10. **Governing law & changes.** Terms are governed by the laws of England and Wales. REPS may update these terms; material changes require re-acceptance before your next endorsement submission.

Rendered on a public route styled with existing marketing primitives (`SectionHeading`, prose block), plus a printable single-column layout. Linked from provider dashboard + qualifications submission dialog + course submission dialog.

### Acceptance capture

- **Existing tick box** ("I agree to display the REPS endorsement statement, verbatim…") is kept — it's clause 3.
- **New required tick box** in both submission dialogs (regulated qualifications *and* course endorsement requests):
  > I have read and accept the [REPS Endorsement Terms (v1)](/legal/endorsement-terms). I understand a breach results in permanent suspension and a permanent public notice on my REPS profile.
- Submission is blocked until both boxes are ticked.
- Store on the two request tables:
  - `provider_regulated_permissions.endorsement_terms_version` (text) + `endorsement_terms_accepted_at` (timestamptz).
  - `reps_courses.endorsement_terms_version` + `endorsement_terms_accepted_at`.
  - Add matching columns to server functions + Zod validators; require them on submit.
- Admin review surface displays the accepted version + timestamp inline with each request.

## 2) Ofqual number — only for Ofqual qualifications, never a stray label

Two fixes so the field only appears where it belongs:

- **Modern PDF renderer (`src/lib/certificates/pdf.server.ts`)**: `ofqual_number` is already blanked when null, so field-map text draws nothing. Add an explicit guard: if `input.ofqualNumber` is null/empty, skip drawing that field entirely and also skip any accompanying "Ofqual No." label positioned in the field map (I'll audit `field_map_json` for a static label — if present, either remove from the template or gate its draw on the value being non-empty). Confirmed the legacy renderer (`pdf-legacy.server.ts`) already gates on `if (input.ofqualNumber)` — no change needed there.
- **Issuance layer (`issue.server.ts`)**: only populate `ofqualNumber` for Ofqual-regulated qualification registrations (`provider_regulated_permissions` path). For `reps_courses` (non-regulated) registrations, force `ofqualNumber = null`, never fall back to `reps_course_number` or anything else. I'll re-read that file to make it explicit.
- **Template editor QA**: no Ofqual label baked into the artwork PNG — only editor-driven text.

## 3) Certificate issuance blocked until provider logo uploaded

Server-side gate, not just a UI hint — providers can't get to Stripe without a 160×60 logo on file:

- **`createCertificateBatchCheckout` in `certificates.functions.ts`**: after `assertProviderIsOrganisation`, load `profiles.certificate_logo_url` for the caller. If null → return `{ error: "You must upload your provider certificate logo (exactly 160 × 60 px) before you can issue certificates. Add it in Certificates → Certificate branding." }`. No batch created, no Stripe session, no state change.
- **Provider basket UI** in `dashboard_.students.tsx`: read `getMyProviderBranding` alongside the basket query; when no logo, disable the "Check out" button and show an inline callout with a scroll-to-branding-card link. Server-side check is still authoritative.
- **Belt-and-braces at issuance (`issue.server.ts`)**: if a batch reaches issuance with no logo on the provider profile, mark the batch as `blocked_no_logo` (new status value) and email the provider instead of rendering. This handles edge cases where the logo is removed between checkout and issuance.

## Brutal-honest additions I'd fold into the terms

Things you didn't mention but will bite later if they aren't in v1:

- **Refund policy on suspension**: unissued certificates in-flight at suspension → refunded; already-issued certificates → no refund, credential stays valid. State this explicitly.
- **Chargebacks / disputes**: opening a fraudulent chargeback on a paid batch = automatic breach.
- **Assessor identity**: the person named as assessor/tutor must actually have delivered/assessed. Ghost-signing is a breach.
- **Learner consent**: provider warrants they have consent to submit learner name/email to REPS for verification and QR-verifiable certificate hosting.
- **Sanctions/right to work**: provider warrants they aren't operating under a UK regulator ban, insolvency, or disqualification, and will notify REPS within 14 days if that changes.
- **Impersonating REPS**: no fake "REPS Head Office", no forwarding customer contact as if from REPS, no using `@repsuk.org` lookalikes.
- **Ownership of the mark**: the REPS name, logo, verification style, badge, and certificate design are REPS property; a limited licence to reference "REPS-endorsed" ends automatically on suspension or withdrawal.
- **Right to withdraw endorsement at any time**: with reasonable notice for administrative reasons; without notice for breach.
- **Public register is the source of truth**: if your public REPS profile says a course isn't endorsed, it isn't endorsed — no matter what a screenshot or old page says.
- **Anti-circumvention**: reapplying via a shell company, spouse, employee, or "successor" entity to escape a suspension is itself a breach — REPS will link and re-suspend.

I'll bake all of these into the v1 document (numbered clauses 11–20) unless you want any dropped.

## Files touched

- New: `src/routes/legal.endorsement-terms.tsx` (public page, `head()` with noindex? — happy either way; I'll default to indexable so it's citable).
- Edit: `src/routes/_authenticated/_professional/dashboard_.qualifications.tsx` — add second tick box in both dialogs, link to terms page.
- Edit: `src/lib/qualifications/qualifications.functions.ts` + `src/lib/cpd/cpd.functions.ts` — new fields on Zod + write path.
- Edit: `src/components/admin/verification/AdminProviderQualificationsTab.tsx` (+ course review surface) — show version + timestamp.
- Edit: `src/lib/certificates/pdf.server.ts` — Ofqual label gate; `issue.server.ts` — Ofqual population rule + no-logo block.
- Edit: `src/lib/certificates/certificates.functions.ts` — logo gate in `createCertificateBatchCheckout`.
- Edit: `src/routes/_authenticated/_professional/dashboard_.students.tsx` — disable Check-out when no logo.
- Migration: two `endorsement_terms_*` columns on `provider_regulated_permissions` and `reps_courses`; optional new `certificate_batches.status` value `blocked_no_logo`.

## Out of scope
- Automated suspension workflow / admin "suspend provider" button — assume manual for now.
- Public "suspended providers" registry page — separate build.
- Formal legal review by counsel — REPS should still have a solicitor sight-check before v1 goes live; the page will carry a "v1 — pending legal review" tag until you tell me to remove it.

Confirm and I'll ship.
