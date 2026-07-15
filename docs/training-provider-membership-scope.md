# Training Provider Membership — Full Scope

**Audience:** anyone (internal team, partner, investor, provider prospect) who needs to understand exactly what the REPs Training Provider membership is, what it includes, how it works, and how it is priced.

**Last updated:** 2026-07-15
**Status:** Tier is functionally wired end-to-end. Audit complete (see `docs/training-provider-audit-2026-07-14.md`). Ready for a small dry-run CSV import; full public launch pending pricing-page sign-off and the language cleanup in §3 of this document.

---

## 1. Executive summary

The Training Provider membership is REPs' paid annual plan for **organisations that deliver fitness, wellness, movement, nutrition, or coaching education**. For a flat annual fee it gives a provider:

1. A public provider website on `repsuk.org/t/your-brand`.
2. Unlimited **REPs-endorsed** course listings in the global course directory.
3. Rotation through the REPs homepage carousel seen by the 25,000+ professionals on the register.
4. A digital **REPs-endorsed** badge (embeddable, links back to a live REPS-verified profile).
5. A verified-review collection system with a Trustpilot-style widget and on-site star badges.
6. A full learner-certificate issuance pipeline (digital PDF + optional print-and-post via Royal Mail), with public token-based verification.
7. A provider dashboard: profile, website editor, learners, registrations, basket, certificates, reviews, settings.

It is fundamentally different from the individual REPs membership (Core / Pro / Studio). It is **organisation-scoped, not person-scoped**, and it is the only tier that can issue REPs-endorsed learner certificates.

---

## 2. Who it is for

- Independent course operators running level 2 / 3 / 4 style qualifications.
- CPD providers (short-course, workshop, digital course, in-person masterclass).
- Awarding-style organisations that want a public, verifiable register of their courses and learners.
- Facilities and academies with their own in-house curriculum.

It is **not** for:
- Individual personal trainers or coaches — they use the Core / Pro membership.
- Facilities that just want to list a gym — that is the (separate) gym directory listing.
- Anyone who wants REPs to act as an Ofqual-regulated awarding organisation. REPs is not an awarding body (see §3).

---

## 3. Language & positioning rules — read this first

> **REPs does not use the word "accredited" or "accreditation" in any user-facing surface.**
> The correct verb is **"endorsed"**; the correct noun is **"endorsement"**; a qualification we approve is a **"REPs-endorsed qualification"**.

Rationale:
- "Accredited" implies a formal regulatory relationship (UKAS, Ofqual, sector-specific accreditation bodies). REPs is a professional register and endorsement body, not a regulator.
- Using the wrong verb creates legal exposure and misleads learners about the nature of the qualification. It is a hard ban.

### 3.1 Approved language

| Use this | Not this |
|---|---|
| REPs-endorsed course | REPs-accredited course |
| REPs-endorsed qualification | REPs-accredited qualification |
| REPs endorsement | REPs accreditation |
| Endorsed by REPs | Accredited by REPs |
| REPs-endorsed Training Provider | REPs-accredited Training Provider |
| Endorsement badge | Accreditation badge |
| Endorsement decision / endorsement review | Accreditation decision |
| Recognised awarding body (when referring to Ofqual-regulated third parties) | Accredited awarding body |

### 3.2 Related copy rules already locked

- REPs is a **global** platform — never write "UK" / "United Kingdom" / "across the UK" as a qualifier. Brand is **"REPs"**, never "REPs UK".
- REPs does **not** charge a booking commission or booking fee — never write "15%", "booking fee", "flat plan", "Stripe surcharge".
- Never name **CIMSPA** or any other awarding body / registry as a partner unless they are a paying REPs partner. Use "Ofqual-regulated" or "recognised awarding body" instead.
- Never use the word "shop-front" / "shopfront" / "shop front". Use **"provider website"** (or **"coach website"** for the individual tier).

### 3.3 Known violations of the "endorsed not accredited" rule (to be fixed)

At the time of writing, the word "accredited" still appears in:
- `src/routes/training-providers.tsx` — the entire pricing page, hero, feature cards, FAQ and JSON-LD.
- `src/lib/billing.ts` — `ORG_TIERS.training_provider.label` (`"REPs-accredited Training Provider"`) and `blurb`.
- Some earlier admin route names (`/admin/training-provider-import` — safe, does not use the word).
- Some legal / endorsement-terms copy — needs re-read.

These are **copy fixes only**, not structural changes. They are tracked as a launch-blocker: all instances must be rewritten to "endorsed" before the pricing page goes live.

---

## 4. Membership pricing

| Item | Price | Notes |
|---|---|---|
| **Annual membership** | **£479 / year** | One flat fee. Unlimited REPs-endorsed course listings. All features in §5 are included — no per-course, per-listing, or per-badge fees. |
| **Learner certificate** | **£15 per issued certificate** | The only paid add-on. Charged per successful cohort issuance via Stripe Checkout (batched). Includes both the digital PDF + verification URL and the option to add print-and-post via Royal Mail (postage price not yet reintroduced separately — currently included). |
| **Bulk certificate pricing** | Negotiated | Cohorts of 50+ certificates — quoted per case. |

- Currency: GBP. VAT is added on top where applicable (UK VAT-registered providers receive a VAT invoice).
- Billing cadence: annual, up-front, via Stripe. There is no monthly option for the Training Provider tier.
- Renewal: auto-renews annually unless the provider cancels.
- **Cancellation policy:** immediate termination — no grace period, no proration, no cancel-at-period-end. The provider website is unpublished and courses are removed from the directory the moment cancellation is confirmed. Already-issued learner certificates remain valid and verifiable at their public URL for the lifetime stated on the certificate.
- **Refund policy:** the annual fee is refundable within **30 days** if REPs cannot endorse at least one of the provider's courses. After that window the membership runs for the full year and is not refunded on cancellation.
- **Dispute policy:** a chargeback / dispute triggers an immediate auth ban, profile hide, and Stripe subscription cancellation. See `mem://constraints/cancel-dispute-policy`.
- **Phase-1 onboarding:** there is no self-serve Stripe checkout yet for the Training Provider tier. An admin attaches an existing Stripe customer and calls `setTrainingProviderPlan` (`src/lib/admin/set-training-provider-plan.functions.ts`). Self-serve checkout is on the roadmap (§13).

---

## 5. What is included — feature by feature

### 5.1 Public provider website — `/t/{slug}`

- Mobile-first landing page at `https://repsuk.org/t/your-brand-slug`.
- Sections: hero, about, endorsed courses, verified reviews, enquiry form, verification badge, contact.
- Editable from `/dashboard/website` (the shared website editor, provider variant).
- Includes a dedicated enquire page: `/t/{slug}/enquire`.
- Route file: `src/routes/t.$slug.tsx`. A visit to `/t/{slug}` where the account is not a training provider redirects to the individual coach website `/c/{slug}`.
- SEO: title, description, and og-image are derived from provider data. Included in the sitemap.

### 5.2 Course directory + homepage carousel

- Every endorsed course is listed in the searchable **Find a Training Provider** directory (`/find-a-training-provider`).
- Providers rotate through the homepage carousel (`src/lib/directory/featured.functions.ts`).
- Filtering supports region, specialism, and delivery mode.
- No per-course fee — unlimited endorsed listings are covered by the annual membership.

### 5.3 Unlimited endorsed course & qualification listings

- Courses live in the `reps_courses` table (the REPs-numbered course registry). The older `courses` table is deprecated and scheduled for deletion.
- Each course is submitted for endorsement (see §6), reviewed by REPs, then published with its own detail page.
- No cap on the number of endorsed courses a provider can hold under one membership.

### 5.4 Digital REPs-endorsed badge + embed widget

- SVG / PNG badge assets available for each endorsed course.
- Badges are embeddable on the provider's own website, marketing PDFs, and course brochures.
- Every badge links back to a live REPs-hosted profile so a viewer can independently verify the endorsement.
- Rules: the badge must always be linked to its live profile — it cannot be shown as a static image without a link. This is enforced in the endorsement terms (`/legal/endorsement-terms`).
- The REPS logo may **not** appear on a provider's own third-party learner certificate — see §7 and the endorsement terms.

### 5.5 Welcome article / editorial slot

- Each new endorsed provider is given a short editorial slot on the REPs resources site introducing them to the community.
- Written by the REPs editorial team from onboarding data submitted by the provider.
- Optional — providers can opt out.

### 5.6 Verified learner review collection

- Trustpilot-style widget embeddable on the provider's own site.
- On-site star ratings and review counts on the provider profile and each course.
- Review-request emails are sent to learners after certificate issuance.
- Every review is tied to a real, verified learner enrolment record (`reviews.bd_review_id` maps to the learner registration) so reviews cannot be faked.
- Moderation: admin-side moderation queue at `/admin/reviews`.
- Docs: `mem://features/reviews-module`.

### 5.7 Learner certificate issuance

The headline feature. See §7 for the full walkthrough. In brief:
- Provider adds learners, enrols them on a REPs course, marks them passed, adds them to a basket, and pays £15/certificate via Stripe.
- REPs generates the PDF, sends it to the learner by email, and provides a public verification URL.
- Optional print-and-post pack via Royal Mail.

### 5.8 Learner records / register entry

- Every issued certificate creates a permanent, verifiable register entry.
- Learners can find themselves on the register via `/verify/{token}` or by looking themselves up.
- Provider retains full learner records inside `/dashboard/students`.

### 5.9 Provider dashboard

Sidebar (`src/components/dashboard/DashboardSidebar.tsx`, provider branch):

| Page | Route | Purpose |
|---|---|---|
| Home | `/dashboard` | KPI tiles: courses, learners, certificates issued, review score. |
| Profile | `/dashboard/profile` | Public-profile fields: name, address, contact, year established, staff count. |
| Website | `/dashboard/website` | Website editor (provider variant). |
| Verification | `/dashboard/verification` | 3-pillar provider verification (identity, insurance, endorsement). |
| Students | `/dashboard/students` | 4 sub-views: Learners, Registrations, Basket, Certificates. |
| Reviews | `/dashboard/reviews` | Verified review inbox + widget config. |
| Enquiries | `/dashboard/enquiries` | Inbound enquiries from `/t/{slug}/enquire`. |
| Settings | `/dashboard/settings` | Billing, account, domain verification. |

---

## 6. How a qualification is endorsed — end-to-end

1. **Application.** From the provider dashboard, a provider submits a course to the REPs course registry (`reps_courses`). Required fields: title, level, learning outcomes, assessment method, tutor competency evidence, insurance evidence, indicative duration, and delivery mode.
2. **Review.** REPs endorsement reviewers assess the submission against the published endorsement criteria (learning outcomes are measurable, assessment method is appropriate, tutor is competent, provider insurance is current, and — where relevant — Ofqual-regulated framing is not misused).
3. **Decision.** A decision (endorsed / more info needed / declined) is recorded and communicated by email (`verification-decision.tsx`).
4. **Publication.** On endorsement, the course is published on the provider website, in the directory, in the homepage carousel rotation, and the digital badge is minted.
5. **Ongoing.** Endorsement is renewed with the annual membership. Material changes to a course (new syllabus, changed assessment) trigger a re-review.

### 6.1 What endorsement means

- The course meets REPs' published quality bar for content, assessment, and tutor competence.
- The provider carries appropriate insurance and holds their published claims to fitness-industry standards.
- The learner will receive a certificate that is publicly verifiable via REPs.

### 6.2 What endorsement does **not** mean

- It is **not** Ofqual regulation. It is not a regulated qualification unless the provider separately holds Ofqual regulation from a recognised awarding body.
- It is **not** UKAS accreditation.
- It is **not** a legal permission to teach, practise, or issue regulated qualifications.
- Providers may **not** describe a REPs-endorsed course as "accredited" — see §3.

### 6.3 Endorsement terms

The full terms live at `/legal/endorsement-terms`. Key clauses:
- The REPS logo may not appear on a provider's own third-party learner certificates. It may only appear on certificates issued **through REPs** (see §7).
- Badges must always link to the live REPS profile.
- Endorsement is withdrawn immediately on membership cancellation, suspended verification, or upheld disputes.

---

## 7. How a certificate is issued — end-to-end

The full pipeline lives in `src/lib/certificates/*`. It is the same code path used for the current test batch and is production-ready.

### 7.1 Actors and tables

- `learners` — a learner record owned by the provider.
- `reps_courses` — the endorsed course registry.
- `certificate_registrations` — one row per learner + course enrolment. Statuses: `enrolled → passed → awaiting_issue → issued → dispatched` (with optional `revoked`).
- `certificate_batches` — a Stripe-linked batch of registrations paid for together.
- `certificate_pricing` — per-provider pricing (currently a flat £15).

### 7.2 The nine steps

1. **Add Learner.** Provider adds the learner in `/dashboard/students`. Inserts a row into `learners`.
2. **Enrol on a REPs-endorsed course.** Provider creates a `certificate_registrations` row with `status='enrolled'` and `enrolled_at` set.
3. **Mark passed.** Provider records the assessment outcome. `status='passed'`, `passed_at` set, `marked_passed_by=<staff_user_id>`.
4. **Add to basket → Stripe Checkout.** Provider selects one or more passed registrations and creates a `certificate_batches` row. Stripe Checkout is opened at £15 per certificate. Each registration is set to `status='awaiting_issue'`, `stripe_checkout_session_id` is stored.
5. **Payment succeeded webhook.** `src/routes/api/public/payments/webhook.ts` receives the event. For each registration in the batch:
   - `pdf.server.ts` renders the certificate PDF using the selected template (`templates.functions.ts`).
   - `issue.server.ts` persists the PDF path, sets `status='issued'`, generates a `verification_token`, records `issued_at`.
   - `learner-certificate-issued.tsx` email is sent to the learner with the PDF and a link to `https://repsuk.org/verify/{token}`.
6. **Public verification.** Anyone with the token can visit `/verify/{token}`. The RPC `verify_certificate_by_token` returns a safe subset (learner name, course, provider, issue date, status) — no PII beyond that. Registrations that have been revoked return a "Revoked" state, not a not-found.
7. **Optional dispatch (print & post).** If the provider requested a printed pack, `print-pack.server.ts` composes the print pack and `royal-mail.server.ts` books the Royal Mail label. Admin marks `dispatched_at`, `batch.status='dispatched'`, and stores the tracking reference.
8. **Revocation.** Admin can revoke a certificate via `adminRevokeCertificate`. `status='revoked'`, `revoked_reason`, `revoked_by`. The verify page shows a "This certificate has been revoked" state.
9. **Reinstate.** Admin can reinstate — revoked fields are cleared and status is restored to `issued` or `dispatched`.

### 7.3 What the learner sees

- An email from REPs with their certificate PDF attached and a "Verify online" button.
- The PDF is co-branded: **provider brand** as the issuer, **REPs endorsement mark** as the endorsement authority, and the verification URL + token printed on the certificate face.
- A public verify page at `/verify/{token}` that shows learner name, course, provider, issue date, and current status.

### 7.4 Guardrails

- The REPS logo does **not** appear on any certificate the provider issues outside this pipeline — it is only on the co-branded REPs-issued certificate.
- Every issued certificate has a permanent public URL. If the provider leaves REPs, previously issued certificates remain valid and verifiable for their stated lifespan.
- Refund → auto-revoke: a Stripe refund on a certificate charge automatically revokes the corresponding registration (fix scheduled; see audit §11).

---

## 8. Provider onboarding journey

1. **Application.** Provider contacts REPs via `/training-providers` → contact form.
2. **Admin creates the account.** An admin attaches an existing Stripe customer, calls `setTrainingProviderPlan`, and creates the `professionals` row with `account_type='training_provider'`.
3. **Provider signs in** via `/auth`.
4. **Provider verification** — three pillars (identity, insurance, endorsement) completed from `/dashboard/verification` behind the `ProviderGateWall`.
5. **Profile completion** — public profile filled in from `/dashboard/profile`.
6. **Website edit** — website customised from `/dashboard/website`.
7. **First course** — submitted for endorsement (§6).
8. **First cohort** — learners added, enrolled, marked passed, batched, paid, certificates issued (§7).

---

## 9. Discovery & visibility

- **Directory:** `/find-a-training-provider` — searchable, filterable, region + specialism aware.
- **Homepage carousel:** rotating strip on `/` featuring endorsed providers.
- **City pages:** endorsed providers appear on relevant `/in/{location}` pages.
- **SEO:** each provider gets a canonical `/t/{slug}` URL, indexed with structured data.
- **Badge on the provider's own site:** every embedded badge is a discovery entry point back into REPs.

---

## 10. Reviews system

- Learners are invited to review the provider after certificate issuance.
- Reviews are tied to a verified enrolment record — no unverified reviews are shown publicly.
- The provider gets a **reviews widget** (Trustpilot-style) they can embed on their own site.
- On-site star ratings show on the provider profile and each course listing.
- **Admin moderation** at `/admin/reviews`.
- Constraint: `reviews.bd_review_id` is a UNIQUE constraint so upserts work — see `mem://features/reviews-module`.

---

## 11. Trust & compliance guardrails

- **Endorsement wording** — hard ban on "accredited" (§3).
- **Verification** — provider must complete identity, insurance, and endorsement checks before publishing.
- **Insurance** — evidence uploaded via `insurance_upload_sessions`; expiry tracked; expiry triggers an unpublish + `insurance-blocked` email.
- **Domain verification** — a provider can prove ownership of their own domain via `provider_domain_verifications` to unlock domain-branded emails.
- **Change control** — public-facing changes (name changes, address changes) go through `provider_change_requests` and `provider_name_requests` for admin approval.
- **Audit log** — every admin write against a provider account inserts into `admin_audit_log`.
- **Data ownership** — the provider owns their learner data and their issued certificates.
- **Dispute policy** — a chargeback triggers auth ban + hide + subscription cancel. If the dispute is won, the provider is unbanned and a `dispute-won-resubscribe` email is sent. If lost, the account is closed via `_closeMembershipImpl`.

---

## 12. Comparison — REPs vs. the alternatives

| | REPs Training Provider | Generic course marketplace | Awarding body |
|---|---|---|---|
| Endorsement layer | Yes | No | Yes (regulated) |
| Public provider website | Yes | Usually no | No |
| Directory + carousel exposure to 25k+ pros | Yes | Varies | No |
| Certificate issuance (co-branded, verifiable) | Yes | No | Yes (their brand only) |
| Learner data ownership | Provider | Marketplace | Awarding body |
| Pricing | Flat £479/yr + £15/cert | Per-listing or revenue share | Per-learner registration fee |
| Setup cost | £0 | Varies | High (regulated setup) |

REPs sits **alongside** — not in place of — a recognised awarding body. Providers commonly hold both marks on the same course.

---

## 13. Roadmap / out of scope

Currently **not** part of the tier (but on the roadmap):
- Self-serve Stripe checkout for Training Provider signup (today: admin-attached).
- Live embeddable review widget (today: mock preview on the pricing page).
- Provider-facing bulk-export tooling.
- Provider-side analytics (funnel, ranked actions, at-risk learners).
- Multi-seat / multi-admin logins on a single provider account.

Explicitly **not** part of the tier and never will be:
- Ofqual-regulated awarding-organisation status.
- Booking commission / booking fees.
- Paid add-ons beyond per-certificate £15.

---

## 14. Glossary

- **Endorsement** — REPs' assessment that a course meets its published quality bar. Never call this "accreditation".
- **Endorsed course / REPs-endorsed course** — a course that has passed REPs endorsement review.
- **Verified review** — a review posted by a learner whose enrolment record exists in `certificate_registrations`.
- **Certificate** — a co-branded PDF issued through the REPs pipeline. Has a verification token and a permanent public URL.
- **Verification token** — an unguessable token embedded in every certificate and its URL. Verified via the `verify_certificate_by_token` RPC.
- **Provider website** — the public `/t/{slug}` page. Never called "shop-front".
- **Badge** — a digital endorsement mark embeddable on external sites, always linked to the live REPs profile.
- **Register entry** — the permanent record of an issued certificate on the REPs register, publicly searchable.

---

## Appendix A — Technical reference

**Routes**
- Public: `/training-providers`, `/find-a-training-provider`, `/t/$slug`, `/t/$slug/enquire`, `/verify/$token`, `/legal/endorsement-terms`.
- Dashboard: `/dashboard`, `/dashboard/profile`, `/dashboard/website`, `/dashboard/verification`, `/dashboard/students`, `/dashboard/reviews`, `/dashboard/enquiries`, `/dashboard/settings`.
- Admin: `/admin/certificates`, `/admin/training-provider-import`, `/admin/provider-names`, `/admin/verification`, `/admin/members`, `/admin/reviews`.
- Webhook: `/api/public/payments/webhook`.

**Server functions**
- `src/lib/certificates/certificates.functions.ts` — certificate CRUD.
- `src/lib/certificates/issue.server.ts` — issuance orchestration.
- `src/lib/certificates/pdf.server.ts` — PDF renderer.
- `src/lib/certificates/print-pack.server.ts` + `royal-mail.server.ts` — print & post.
- `src/lib/certificates/providers.functions.ts` — provider-scoped cert queries.
- `src/lib/directory/providers.functions.ts`, `search.functions.ts`, `featured.functions.ts` — directory + carousel.
- `src/lib/qualifications/qualifications.functions.ts` — qualifications register.
- `src/lib/admin/import-training-providers.functions.ts` — CSV import.
- `src/lib/admin/set-training-provider-plan.functions.ts` — admin plan attach.

**Tables**
- `professionals` (with `account_type='training_provider'`)
- `reps_courses` (canonical course registry — `courses` is deprecated)
- `learners`
- `certificate_registrations`
- `certificate_batches`
- `certificate_pricing`
- `provider_domain_verifications`
- `provider_change_requests`
- `provider_name_requests`
- `insurance_upload_sessions`
- `reviews`
- `admin_audit_log`

**Billing**
- `src/lib/billing.ts` → `ORG_TIERS.training_provider` (£479/yr, `amountPence: 47900`, Stripe lookup key `training_provider_annual`).
- Per-certificate: `CERTIFICATE_UNIT_PRICE_PENCE = 1500`, `CERTIFICATE_UNIT_PRICE_LABEL = "£15"`.

---

## Appendix B — Approved copy snippets

**Hero (pricing page)**
> Get your courses **REPs-endorsed**. Reach the 25,000+ pros on the register with a public provider website, unlimited endorsed course listings, verified learner reviews and co-branded certificates.

**Feature card — badge**
> **Digital REPs-endorsed badge.** Embed the endorsement badge on your own website, marketing PDFs and course pages — every badge links back to your live REPs profile for instant proof.

**Certificate footer**
> This certificate is issued by *{Provider Name}* and endorsed by REPs. Verify at repsuk.org/verify/{token}.

**Review request email**
> Congratulations on completing *{Course Name}* with *{Provider Name}*. Your certificate is attached and verifiable at the link below. If you have a moment, we'd love to hear how you got on — leave a verified review to help future learners.

**Welcome article opener**
> *{Provider Name}* has joined REPs as a **REPs-endorsed Training Provider**. Their catalogue — from *{example course}* to *{example course}* — is now searchable on the REPs directory, and every course they issue is verifiable on the REPs register.

---

*End of document.*
