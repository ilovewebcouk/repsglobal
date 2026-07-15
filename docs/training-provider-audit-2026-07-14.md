# Training Provider tier — production readiness audit

**Date:** 2026-07-14
**Scope:** every training-provider surface, before we import the real CSV
of providers and before I build the training-provider pricing page.
**Method:** read-only sweep of routes, server fns, DB schema, Supabase
linter, memory rules. No code changes in this pass.

Legend: **BLOCKER** (must fix before CSV import) · **HIGH** (fix before
pricing page) · **MED** (fix soon) · **LOW** (cleanup, optional).

---

## 0. TL;DR

The training-provider tier is functionally wired end-to-end (dashboard →
students → registrations → basket → Stripe batch → PDF → dispatch →
public verify). It is **not** production-ready as-is. The main risks are
**naming drift** (`organisation` vs `training_provider` vs
`training-provider`), **dead code paths** (legacy CPD routes, legacy PDF
renderer, dead `courses` table, redirect-only `/dashboard/services`),
**unused columns on `professionals`** carried over from the individual-PT
schema, and **Supabase linter warnings** on 103 SECURITY DEFINER
functions we haven't hardened.

Nothing here requires visual redesign — locked pages stay locked.

---

## 1. Data model & naming

### 1.1 `professionals.account_type` — three names for one thing — **BLOCKER**

- **DB value:** `organisation` (2 rows, both test accounts). `training_provider` = 0 rows.
- **Code that reads `= 'organisation'`:** 9 files, including the sidebar (`DashboardSidebar.tsx:117,349`), dashboard home (`dashboard.tsx:98`), profile/settings/reviews/website org variants, `/t/$slug` redirect, admin providers list.
- **Code that reads `= 'training_provider'`:** `DashboardSidebar.tsx:74` — never true today because the DB never stores that value. Dead branch.
- **Code that reads `'training-provider'` (hyphen):** `src/lib/seo/legacy-redirects.functions.ts:20` — a URL slug only, safe to keep as string.

**Fix:** pick ONE canonical value and normalise. Recommend **`training_provider`** in the DB (matches every user-facing "training provider" phrase and the `admin/training-provider-import` route). Migration:

1. Add CHECK constraint / enum: `account_type IN ('individual','training_provider')`.
2. `UPDATE professionals SET account_type='training_provider' WHERE account_type='organisation';`
3. Rewrite the 9 code references + the dashboard `= "organisation"` branches in one commit.
4. Rename the `src/components/dashboard/organisation/*` folder → `training-provider/*` for consistency.

**Do NOT** rename the DB value to `organisation` — user-facing copy is "training provider" everywhere; leaving the DB word out-of-sync guarantees this bug recurs.

### 1.2 `professionals` columns unused by providers — **MED**

Columns on `professionals` that only make sense for **individual PTs** and have no meaning for a training provider. Recommend either (a) drop them, or (b) keep but explicitly document they're `NULL` for `account_type='training_provider'` and hide from the provider admin mirror.

Drop candidates:

| Column | Reason |
|---|---|
| `hourly_rate_pence`, `from_price_pennies`, `price_currency` | Providers don't have an hourly rate; they price certificates via `certificate_pricing`. |
| `dbs_valid_until` | DBS is for individuals working with clients directly. |
| `trains_at_home_studio`, `trains_at_clients_home`, `in_person_available`, `online_available` | Delivery mode is not a provider concept. |
| `primary_title_slug`, `secondary_title_slug` | Titles are individual REPs level titles (PT / Coach). |
| `reps_level` | Individual member level enum. |
| `years_experience`, `value_prop`, `headline`, `bio` | Belongs to individual profile card. Providers use `professionals.address`, `year_established`, `staff_count`, `awarding_bodies`. |
| `bd_seed_thin` | BD migration ghost column — memory bans this vocabulary. |
| `quality_score` | Individual PT ranking signal. |
| `social_instagram/linkedin/youtube/tiktok/x` | Providers use `website_url` + `contact_email`; keep just `social_linkedin` if we want it. |
| `specialisms`, `languages`, `city`, `country` | Providers use `address`, region derived from Companies House / import row. |
| `member_since`, `identity_status/verified_name/verified_dob/session_id/verified_at`, `stripe_identity_session_id` | Stripe Identity is individual-only. |

**Keep for providers:** `id`, `slug`, `is_published`, `verification`, `verification_status`, `verification_grace_until`, `cover_url`, `contact_phone`, `contact_email`, `website_url`, `address`, `year_established`, `company_number`, `company_registration`, `staff_count`, `awarding_bodies`, `reps_member_id`, `account_type`, `is_demo`, `suspended_at`, `suspension_reason`, `unpublished_reason`, `unpublished_at`, `created_at`, `updated_at`, `cert_uploaded_at`, `timezone`, `locale`.

Two roads: **(A)** hard-drop the columns (breaks re-verification code that still SELECTs them; risky), **(B)** create a `provider_profile` companion table for provider-only fields and stop overloading `professionals`. Recommend **(B)** long-term but out-of-scope for this pass — do **(A)** only for the 4-5 clearly-unused columns above (see fix list).

### 1.3 `courses` vs `reps_courses` — **HIGH**

- `courses` table: 0 rows, referenced by `professionals.functions.ts` and `AdminProviderQualificationsTab.tsx`.
- `reps_courses` table: 1 row (test), referenced by 7 files including the live certificate issue path.

`courses` is the pre-Phase-2 concept, replaced by `reps_courses` (the REPs-numbered course registry). **Recommend dropping `courses` + its references.** Only 2 code files touch it.

### 1.4 Provider ops tables — status — **MED**

| Table | Rows | Read by | Written by | Verdict |
|---|---|---|---|---|
| `provider_domain_verifications` | 2 (test) | provider-domain.functions.ts | same + verify-provider-domain.ts route | KEEP |
| `provider_change_requests` | 6 (test) | provider-changes.functions.ts | admin queue | KEEP |
| `provider_name_requests` | 1 (test) | provider-name.functions.ts, admin_.provider-names.tsx | admin | KEEP but overlaps `provider_change_requests`. Consider folding into the generic change_requests table with `kind='name_change'`. |
| `certificate_upload_sessions` | ? | ? | ? | Verify — may be dead if we no longer accept legacy PDF uploads. |
| `insurance_upload_sessions` | ? | insurance.functions.ts | same | KEEP |

### 1.5 `certificate_registrations` columns — **LOW**

All 26 columns currently serve a purpose. Two callouts:

- `unit_summary_pdf_path` is only populated by the newer PDF renderer — confirm `pdf-legacy.server.ts` isn't setting/reading a different column.
- `marked_passed_by` never surfaces in admin UI; consider showing it in the Registrations Console row detail.

---

## 2. Public surfaces

| Route | Status | Notes |
|---|---|---|
| `/find-a-training-provider` | **WORKS** | Filters, pagination, SEO head OK. Depends on `account_type='organisation'` gate — will need updating with §1.1 rename. |
| `/t/$slug` (index / enquire / review) | **WORKS** | Redirect to `/c/$slug` for non-organisation is correct. |
| `/verify` + `/verify/$token` | **WORKS** | Just re-themed dark + rebuilt on SECURITY DEFINER RPC. Retest matrix: valid, revoked, not-found, expired token (there is no expiry today — tokens don't expire; confirm intended). |
| `/cpd` | **WORKS** | Canonical. |
| `/cpd-v2` | **DEAD** — redirect-only stub → merge into `/cpd`. Delete file. |
| `/cpd-legacy` | **DEAD** — old copy, no traffic. Delete file. |
| `/legal/endorsement-terms` | **WORKS** | "No REPS logo on 3rd-party certs" clause is in. |
| `HeaderCommandPalette` provider suggestions | **WORKS** | Confirm the "Find a training provider" entry present and not gated on `training_provider` string. |

---

## 3. Provider dashboard (currently `_authenticated/_professional/`)

Sidebar in `DashboardSidebar.tsx`:

- `TRAINING_PROVIDER_NAV` constant is **never reached** because tier is never `'training_provider'` (see §1.1). Providers see the sidebar built via the `isOrganisation` branch instead. Dead constant.
- Provider sees: Home, Profile, Website, Verification, Students, Reviews, Settings.
- Individual-PT-only items are correctly hidden (Qualifications, Bookings, Payments, etc.).

### 3.1 Provider page-by-page

| Route | Component | Status | Notes |
|---|---|---|---|
| `/dashboard` | `ProviderDashboardHome` (organisation folder) | **WORKS** | Loads via `data?.accountType === "organisation" || tier === "training_provider"` — second clause is dead code today. |
| `/dashboard/profile` | `ProviderProfilePage` | **WORKS** | Verify it doesn't expose the individual-PT-only fields listed in §1.2. |
| `/dashboard/website` | `ProviderWebsitePage` | **WORKS** | Provider variant of the shopfront-website editor. |
| `/dashboard/verification` | `VerificationPage` + `ProviderGateWall` | **WORKS** | 3-pillar gate different from individual PT. |
| `/dashboard/students` | inline (dashboard_.students.tsx) | **WORKS** | 4 sub-views (Learners / Registrations / Basket / Certificates). Big file — worth a targeted correctness pass but no known bug. |
| `/dashboard/reviews` | `ReviewsPage` (organisation) | **WORKS** | |
| `/dashboard/settings` | `SettingsPage` (organisation) | **WORKS** | |
| `/dashboard/services` | redirect → `/dashboard/website#specialisms` | **DEAD stub** | For providers this redirect makes no sense (no services concept for providers). Either delete the route file, or route providers to `/dashboard` instead. |
| `/dashboard/qualifications` | shared | **QUESTION** — does this show up for providers? Confirm it's not linked in the provider sidebar and if visited manually, it 404s / redirects. |
| `/dashboard/cpd` | shared | **QUESTION** — same. |
| `/dashboard/enquiries` | shared | **WORKS** for providers who accept enquiries via /t/$slug/enquire. |
| `/dashboard/support` | shared | **WORKS** |

### 3.2 Certificate registration flow — end-to-end walk

1. **Add Learner** → `learners` insert. ✅ works.
2. **Enrol on REPS course** → `certificate_registrations` row `status='enrolled'`, `enrolled_at` set. ✅
3. **Mark passed** → `status='passed'`, `passed_at`, `marked_passed_by=uid`. ✅
4. **Add to basket → Stripe Checkout** → `certificate_batches` row, `stripe_checkout_session_id` set; per-cert `status='awaiting_issue'`. ✅
5. **Webhook payment succeeded** → issue PDFs via `pdf.server.ts`, `status='issued'`, `pdf_path` + `verification_token` set, learner email sent. ✅ (via `api/public/payments/webhook.ts`).
6. **Dispatch** → admin marks `dispatched_at`, `batch.status='dispatched'`, RM tracking fields. ✅
7. **Revoke** → new `adminRevokeCertificate` sets `status='revoked'`, reason, `revoked_by`. ✅
8. **Reinstate** → clears revoked fields, restores to `issued` or `dispatched`. ✅
9. **Public verify** → RPC `verify_certificate_by_token(_token)` returns safe subset. ✅ (just fixed).

**Potential gaps to test manually with a scratch batch:**
- Stripe **failed payment**: does batch stay `pending` or roll back? Confirm.
- Stripe **refund**: no code path revokes certs on refund today. **HIGH** — refund should auto-revoke.
- Learner **email bounce**: currently no retry / no admin surface.
- **Second dispatch** to same batch (RM label reprint): allowed today, no guardrail.

---

## 4. Admin surfaces

| Route | Status | Notes |
|---|---|---|
| `/admin/certificates` | **WORKS** — just rebuilt into Registrations Console. |
| `/admin/training-provider-import` | **UNCLEAR** — needs dry-run against a 5-row sample CSV before real import. |
| `/admin/provider-names` | **WORKS** |
| `/admin/verification` (provider queue) | **WORKS** via `AdminProviderQueueTab` |
| `/admin/members` provider filter | **WORKS** |

**Blocker checks:**
- Every admin write path in `providers.functions.ts` / `set-training-provider-plan.functions.ts` must insert into `admin_audit_log`. Spot-check.

---

## 5. Emails & PDFs

- `learner-certificate-issued.tsx`: verify links point to `https://repsuk.org/verify/<token>` (production domain), not preview.
- `verification-decision.tsx`: has provider-flavour copy — confirm decision reason strings are provider-appropriate.
- `insurance-blocked.tsx`: provider variant works.
- `pdf.server.ts` **vs** `pdf-legacy.server.ts` — grep shows nothing imports `pdf-legacy` outside itself and the route tree. **HIGH — delete `pdf-legacy.server.ts`.**
- Domain-confirm email path: **WORKS**.

---

## 6. Billing

`src/lib/billing.ts` — needs a training-provider tier entry with:
- Stripe product ID + monthly/yearly price IDs
- VAT: 20 % included (UK)
- Cancel policy: immediate termination (per `mem://constraints/cancel-dispute-policy`)
- Dispute policy: same as individual tiers.

**Not yet defined** — this is intentional; the pricing page work happens **after** this audit signs off.

Related dead concepts to remove:
- Any residual "Free provider" / "Verified provider tier" language — grep clean.

---

## 7. Legal / trust / copy

- CIMSPA references: grep clean.
- `terms.tsx`, `privacy.tsx`, `cookies.tsx`: contain provider-specific paragraphs. Re-read pre-launch (out of scope for this audit — deferred to launch checklist).

---

## 8. Security / RLS

- `certificate_registrations`: public anon SELECT policy **removed**, replaced with `verify_certificate_by_token` RPC. ✅
- Supabase linter (fresh run today): **104 findings** total:
  - 1 × INFO: `RLS Enabled No Policy` — one table has RLS on with no policy (effectively locked). Identify the table and either add a policy or disable RLS.
  - 38 × WARN: `Public Can Execute SECURITY DEFINER Function` — `anon` can call SECURITY DEFINER fns.
  - 65 × WARN: `Signed-In Users Can Execute SECURITY DEFINER Function` — `authenticated` can call SECURITY DEFINER fns.
  Not provider-specific — platform-wide. Recommend auditing the specific fn names against needed callers and `REVOKE EXECUTE ... FROM anon/authenticated` where the fn is only meant for `service_role`.
- `t/$slug` public path: uses `professionals` public SELECT policy — confirm the policy projects safe columns only or that the code SELECTs only safe columns.

---

## 9. Test data state (2026-07-14 snapshot)

| Table | Test rows |
|---|---|
| `professionals` (organisation) | 2 |
| `certificate_registrations` | 4 |
| `certificate_batches` | 1 |
| `learners` | 2 |
| `reps_courses` | 1 |
| `provider_regulated_permissions` | 4 |
| `provider_change_requests` | 6 |
| `provider_domain_verifications` | 2 |
| `provider_name_requests` | 1 |

All flagged as test / demo. Recommend a **single migration** that hard-deletes them (cascade) **immediately before** the CSV import.

---

## 10. Deprecated — safe to delete this pass

Deleting each of these is a mechanical change with no user impact:

1. `src/routes/cpd-v2.tsx` (redirect-only)
2. `src/routes/cpd-legacy.tsx` (dead copy)
3. `src/lib/certificates/pdf-legacy.server.ts` + its route-tree entry
4. `src/routes/_authenticated/_professional/dashboard_.services.tsx` (provider-inapplicable redirect)
5. `TRAINING_PROVIDER_NAV` unreachable branch in `DashboardSidebar.tsx` (once §1.1 renames land, this becomes the real branch — do the rename first, then remove the `organisation` branch and use `TRAINING_PROVIDER_NAV`).
6. `courses` table + the 2 files that read it, if replaced by `reps_courses` everywhere.

---

## 11. Fix list (ordered)

### Blocker (before CSV import)

1. Normalise `professionals.account_type` → `training_provider`; update 9 code sites + folder rename.
2. Add a Stripe-refund → auto-revoke path.
3. Confirm & delete the dead `courses` table (if no rows depend on it).

### High (before pricing page)

4. Delete `pdf-legacy.server.ts` + `cpd-v2.tsx` + `cpd-legacy.tsx` + `dashboard_.services.tsx`.
5. Drop clearly-unused `professionals` columns for providers (§1.2 short list — start with `bd_seed_thin`, `dbs_valid_until`, `stripe_identity_session_id`, `identity_verified_dob`, `hourly_rate_pence`, `from_price_pennies`, `reps_level`, `primary_title_slug`, `secondary_title_slug`, `quality_score`).
6. Purge test data + reset `provider_regulated_permissions`, `provider_change_requests`, `provider_name_requests`, `provider_domain_verifications`, `certificate_registrations`, `certificate_batches`, `learners`, `reps_courses` before CSV.
7. Audit `admin_audit_log` insert on every admin provider write.

### Medium

8. Fold `provider_name_requests` into `provider_change_requests` (`kind='name_change'`).
9. Address the RLS-enabled-no-policy INFO finding.
10. Harden SECURITY DEFINER function grants (revoke from anon/authenticated where inappropriate).

### Low

11. Style/copy: remove any residual "Verified provider tier" or "Free" language.
12. Show `marked_passed_by` in admin cert row detail.

---

## 12. Green-light checklist (must be all ✅ before CSV import + pricing page)

- [ ] `account_type` normalised to `training_provider` in DB + code (§1.1)
- [ ] Refund → auto-revoke path shipped and tested (§3.2)
- [ ] Legacy files deleted: `pdf-legacy.server.ts`, `cpd-v2.tsx`, `cpd-legacy.tsx`, `dashboard_.services.tsx`
- [ ] Unused `professionals` columns dropped (§1.2 short list)
- [ ] `courses` table dropped OR confirmed still needed with owner
- [ ] Test data purge migration reviewed and run
- [ ] `admin_audit_log` verified on every admin provider write
- [ ] Supabase linter INFO finding closed
- [ ] Public verify page smoke-tested against 4 states: valid, revoked, unknown token, malformed token
- [ ] End-to-end learner→PDF→dispatch→verify flow re-run on production Stripe test mode
- [ ] `billing.ts` provider tier entry drafted (waits for pricing page work but must be defined before publish)

---

## 13. Out of scope for this audit (deliberately deferred)

- Visual redesign of any locked page
- Individual-member tier changes
- New provider features (bulk-print, provider-side analytics, provider-facing exports)
- BD migration cleanup (memory bans that vocabulary anyway)
- Full RLS hardening pass across the whole DB
- CIMSPA legal copy re-read (own launch checklist)
- Editorial pass on `resources.ts` long-form articles

---

**Next step:** you review this doc, confirm the drop-list is OK, then I execute the Blocker + High fixes as separate migrations/commits and re-run the checklist before the CSV import.
