
## Goal

Run a top-to-bottom audit of the training-provider tier so it's production-ready before importing the real CSV of providers, and before I build the training-provider pricing page. No new features — this pass is about proving what's wired, killing what's dead, and fixing what's broken.

## Deliverable

A single audit report at `docs/training-provider-audit-2026-07-14.md` with, for every surface:

- **Status**: WORKS / BROKEN / DEAD / UNCLEAR
- **Evidence**: file paths, DB tables, admin screens exercised
- **Bugs found** + severity (blocker / high / medium / low)
- **Deprecated columns / tables / routes / components** to remove
- **Fix list**, ordered by severity, that I then execute in a follow-up build turn

At the end of the report: a green-light checklist that has to be all-green before the CSV import runs and before the pricing page is built.

## What gets audited (every training-provider touchpoint)

**1. Data model & naming**
- `professionals.account_type` — DB currently uses `organisation`; code and copy mix `organisation` / `training_provider` / `training-provider`. Pick one canonical value, migrate the rest.
- `professionals` columns actually populated for providers vs never used (e.g. `hourly_rate_pence`, `dbs_valid_until`, `trains_at_clients_home`, `primary_title_slug`, `secondary_title_slug`, `reps_level`, `years_experience`, `from_price_pennies`, `value_prop`, `bd_seed_thin`). Recommend dropping the ones that only apply to individuals.
- Certificates stack: `certificate_registrations`, `certificate_batches`, `certificate_templates`, `certificate_pricing`, `learners`, `courses` (0 rows — likely dead), `reps_courses`, `provider_regulated_permissions`, `course_accreditation_files`. Flag `courses` vs `reps_courses` overlap and any columns still referenced only by legacy code paths (`pdf-legacy.server.ts`, `cpd-legacy.tsx`, `cpd-v2.tsx`).
- Provider ops tables: `provider_domain_verifications`, `provider_change_requests`, `provider_name_requests` — confirm all three are actively read/written, or fold overlapping ones.

**2. Public surfaces**
- `/find-a-training-provider` — filters, pagination, empty state, SEO head.
- `/t/$slug` (index / enquire / review) — layout, verified badge logic, CTA wiring, redirect rule from `/t/$slug/route.tsx`.
- `/verify` and `/verify/$token` — now dark-themed; re-test valid, revoked, not-found, expired token, unknown token.
- `/cpd`, `/cpd-v2`, `/cpd-legacy` — decide which is canonical; delete the other two if dead.
- Header/footer entries, `HeaderCommandPalette` suggestions for providers.
- Public verify link + QR flow end-to-end from a certificate PDF.

**3. Provider dashboard (currently living inside `_authenticated/_professional/`)**
- Sidebar gating in `DashboardSidebar` + `nav-data.ts`: which items unlock for `account_type = organisation`, which stay hidden.
- Every provider page: `dashboard` (home), `dashboard/profile`, `dashboard/website`, `dashboard/verification`, `dashboard/students`, `dashboard/reviews`, `dashboard/settings`, `dashboard/qualifications`, `dashboard/cpd`, `dashboard/services` — for each, confirm it applies to providers or hide it.
- `ProviderWelcomeBanner`, `ProviderProfilePage`, `ProviderWebsitePage`, `ProviderGateWall`, `DashboardHome` (organisation variant) — visual + functional pass.
- Certificate registration flow: create learner → enrol on a REPS course → mark passed → batch checkout (Stripe) → PDF issued → dispatched → revoke/reinstate → learner email → public verify page. Every state transition tested against `certificate_registrations.status` values.
- Domain verification email round-trip via `/api/public/verify-provider-domain`.
- Name-change / change-request flows and their admin queues.

**4. Admin surfaces**
- `/admin/certificates` (Registrations Console) — filters, revoke/reinstate, PDF signed URL, verify link.
- `/admin/training-provider-import` — dry run + real run with a small CSV sample.
- `/admin/provider-names`, `/admin/verification` (provider queue tab in `AdminProviderQueueTab`), `/admin/members` provider filter.
- `set-training-provider-plan.functions.ts` + `providers.functions.ts` — every admin action fires an audit-log entry.

**5. Emails & PDFs**
- `learner-certificate-issued`, `verification-decision`, `insurance-blocked` for provider account_type — render, links, from-address, footer.
- Domain-confirm email path (`provider-domain.functions.ts`).
- Cert PDF (`pdf.server.ts`) vs `pdf-legacy.server.ts` — delete the legacy renderer once no code path references it.

**6. Billing**
- `billing.ts` entries for the provider tier — Stripe product/price IDs, VAT, cancel policy (must match `mem://constraints/cancel-dispute-policy`).
- Confirm no code still expects a free provider tier or "Verified" tier.

**7. Legal / trust**
- `legal/endorsement-terms` — includes the "no REPS logo on 3rd-party certs" clause (already added).
- `terms.tsx`, `privacy.tsx`, `cookies.tsx` — provider-specific paragraphs still accurate.
- Any remaining `CIMSPA` references (memory ban).

**8. Security / RLS**
- Run `security--run_security_scan` + `supabase--linter` and resolve every finding on provider-adjacent tables.
- Re-check that `certificate_registrations` no longer has a public anon SELECT policy (just fixed) and no other provider tables have a wide `TO anon` policy.
- Confirm `t/$slug` public read paths use narrow anon SELECT policies + safe columns only.

**9. Test data cleanup**
- Delete or clearly mark the 2 `organisation` test accounts, 4 test registrations, 1 test batch, 2 test learners, 1 test REPS course, 4 test permissions, 6 test change requests, 2 test domain verifications so the CSV import lands in a clean slate.

## Execution order

1. **Read-only audit pass** (this plan, once approved): populate the audit doc, list every bug and every dead column/route/component with severity. No code changes yet.
2. **Show you the audit doc** for approval, plus the proposed drop-list for columns/tables/routes.
3. **Blocker + high fixes**: migrations to normalise `account_type`, drop dead columns, delete legacy routes, fix any broken flows. Each fix verified against the flow it belongs to.
4. **Medium + low fixes**: naming, dead components, doc updates.
5. **Test-data purge migration** for the training-provider domain only (does not touch member data).
6. **Green-light checklist run** — every item ticked before I say ready.
7. Then, and only then, we do the CSV import and I build the training-provider pricing page.

## Guardrails

- No visual redesign of any locked page (homepage, /c/$slug, /t/$slug, /pro/$slug, city pages, marketing pillars, /about).
- No changes to member / individual-pro tier behaviour — audit stays inside the provider surface.
- No new features. Any "we should also add…" idea gets logged in the audit doc as a follow-up, not built now.
- Every schema change goes through a migration with GRANTs + RLS per the platform rules.
- Terminology stays "training provider" in user-facing copy — internal DB value we'll standardise on gets decided in step 1 of the audit.
