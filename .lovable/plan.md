# Training Provider Membership — Full Scope Document

Create a single, self-contained reference document at:

`docs/training-provider-membership-scope.md`

Written for a reader who knows nothing about the tier. No code changes.

## Source material I'll consolidate

- `docs/training-provider-audit-2026-07-14.md` (module audit)
- `src/routes/training-providers.tsx` (public pricing page copy)
- `src/lib/billing.ts` (£479/yr + £15/certificate)
- `src/lib/certificates/*` (issue, pdf, print-pack, royal-mail, templates, providers)
- `src/lib/directory/providers.functions.ts` + search + featured
- `src/lib/qualifications/qualifications.functions.ts`
- `src/lib/admin/import-training-providers.functions.ts` + `set-training-provider-plan.functions.ts`
- Provider dashboard components (`src/components/dashboard/organisation/*`)
- Public routes `t.$slug.tsx`, `c.$slug.tsx` (provider website)

## Document structure

1. **Executive summary** — one-paragraph "what it is" for a total newcomer.
2. **Who it's for** — training providers, awarding-style organisations, course operators.
3. **Language & positioning rules (must-read)**
   - Explicit rule: REPs **never** uses the word "accredited" / "accreditation". We use **"endorsed"** / **"REPs-endorsed qualification"**.
   - Explicit rule: no "UK" qualifier; brand is "REPs" not "REPs UK".
   - Approved phrasing bank + banned phrases with rationale.
4. **Membership pricing**
   - £479/year, unlimited course listings, all features included.
   - £15 per issued certificate (add-on, per learner).
   - No booking fees, no commission, no paid add-ons beyond certificates.
   - Billing cadence, renewal, cancel = immediate termination policy.
5. **What's included — feature by feature**
   For each: what it is, why it matters, how the provider uses it, where it lives in the product.
   - Public provider website (`/t/$slug`) — layout, customisation, tier capabilities.
   - Course directory listing + homepage carousel placement.
   - Unlimited course/qualification listings.
   - Digital REPs-endorsed badge + embeddable widget.
   - Welcome article / editorial slot.
   - Verified learner review collection (Trustpilot-style widget + on-site badges).
   - Certificate issuance (digital + optional print & post via Royal Mail).
   - Learner records / qualification register entry.
   - Admin dashboard (organisation view): home, settings, courses, learners, certificates, reviews.
6. **How a qualification is endorsed (end-to-end)**
   - Application → REPs review → endorsement decision → published as "REPs-endorsed".
   - What endorsement means vs does not mean (regulatory framing; never "accredited").
   - Ongoing standards / review cadence.
7. **How a certificate is issued (end-to-end)**
   - Provider enters/uploads learner + qualification.
   - Template selection (`templates.functions.ts`).
   - Preview → issue (`issue.server.ts` → `pdf.server.ts`).
   - Learner receives digital certificate + verifiable URL.
   - Optional Royal Mail print-and-post pack (`print-pack.server.ts` + `royal-mail.server.ts`).
   - Billing: £15 per issued certificate.
   - Certificate verification page for public lookup.
8. **Provider onboarding journey** — signup → admin sets plan → profile completion → first course → first certificate.
9. **Discovery & visibility** — directory, search, city pages, homepage carousel, badge widget on their own site.
10. **Reviews system** — collection request, verification, moderation, public display, embeddable widget.
11. **Trust & compliance guardrails** — endorsement wording, banned claims, review verification, data handling.
12. **Comparison vs alternatives** — pulled from `training-providers.tsx` compare table.
13. **Roadmap / out-of-scope** — self-serve Stripe checkout, live reviews widget embed, awarding-body-level features.
14. **Glossary** — endorsed, verified review, certificate, qualification, provider website, badge, register.
15. **Appendix A** — key routes, server functions, tables (technical reference).
16. **Appendix B** — approved copy snippets (hero, badge, certificate footer, review request email).

Length target: ~2,500–3,500 words, in Markdown, ready to hand to a non-technical stakeholder.

## Out of scope
No code, migration, or copy changes to the live product in this step. Pure documentation.
