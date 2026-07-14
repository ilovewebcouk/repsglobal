# Training Provider Bulk Import + Portal Launch

Goal: let you paste a CSV of existing training providers, create their accounts, link their Stripe customer IDs, and send a branded "Portal is now live" email with a password-set link. Also ship a public resource article explaining the new portal.

Everyone imported must complete full REPS provider verification (identity + docs) before any certificate can be issued — the existing verification gate is already in place; we just make it explicit in the email and the article.

## What gets built

### 1. Admin bulk importer (paste CSV → run)

New route `/admin/training-providers/import` with:
- Textarea to paste CSV (columns: `email, stripe_customer_id, provider_name, website?`).
- Preview table showing parsed rows + validation state per row (email format, duplicates already on REPs, missing fields).
- "Run import" button → calls a new server fn `importTrainingProviders` which processes each row:
  1. If the email already has an auth user → link the Stripe customer ID and send the announcement email only (skip account creation).
  2. Otherwise: Supabase `generateLink({ type: "invite" })` (same as existing `createProvider`) → creates auth user + returns password-set link.
  3. Upsert `profiles.full_name` and `professionals` row with `account_type = "organisation"` and derived slug.
  4. Upsert `subscriptions` row with `tier = "training_provider"`, `status = "active"`, and `stripe_customer_id = <supplied>`.
  5. Send the new "Portal is live" branded email with the password-set link embedded.
  6. Log `admin_audit_log` action `provider.bulk_import`.
- Result summary: how many created / linked-only / failed, with per-row errors.

Server fn lives in `src/lib/admin/import-training-providers.functions.ts` (extends the existing `createProvider` pattern).

### 2. New app-email template: `provider-portal-is-live`

`src/lib/email-templates/provider/portal-is-live.tsx` — React Email, brand-styled to match existing provider templates, sections:
- Welcome / "The new REPs training-provider portal is live for you"
- What's new: dashboard, endorsement submissions, in-portal certificate issuance, learner registrations, verified provider badge on public listings
- **Verification requirement** — must complete identity + document verification before any certificate can be issued
- Primary CTA button → the password-set link
- Sign-in reminder: same email address you already use
- Support link (support@repsuk.org)

Registered in `src/lib/email-templates/registry.ts`. Triggered from the importer via existing `sendTransactionalEmailServer`. Not user-triggerable.

### 3. Public resource article: "The new REPs training-provider portal"

New entry in `src/lib/resources.ts` (slug `new-training-provider-portal`), rendered by existing `resources.$slug.tsx`. Sections:
- Intro — what the portal is and who it's for
- Endorsement workflow — how REPs endorses a regulated qualification or a course
- Certificates — how the platform issues, verifies (QR + verify URL), and prints on official REPS stock (no third-party badges permitted per endorsement terms)
- Verification requirement (identity + documents) before first certificate
- Provider website + directory listing
- FAQ / next steps

Featured image = the certificate photo you uploaded (`certificate_resource.jpg`), added as a Lovable Asset. The unit-summary image (`unit_summary_resource.jpg`) will illustrate the certificates section inside the article.

You've already agreed to ship the images as-is (Scott McKay signature visible on the certificate footer).

### 4. No new DB tables

- Auth users, `professionals`, `subscriptions`, and `admin_audit_log` all already exist.
- Stripe customer ID goes on `subscriptions.stripe_customer_id` (already the canonical column).
- No migration needed unless a column is missing on inspection — I'll confirm during implementation and only migrate if truly required.

## Technical details

- Email uses the existing app email infrastructure (React Email templates + `/lovable/email/transactional/send`); no auth-email hook changes.
- Password-set link comes from Supabase `generateLink({ type: "invite" })` — same mechanism the existing `createProvider` uses; it delivers the user to `/pricing` or a chosen post-set page, then Supabase logs them in.
- For rows where the email is already on REPs, we do NOT rotate their password. We link Stripe + send the announcement email (no reset link, just a "sign in as usual" CTA).
- Every imported provider is `account_type = organisation`, tier `training_provider`, subscription `active`. That gives them the portal without going through Stripe checkout.
- The existing verification gate on certificate issuance and the "no logo, no certs" rule already enforce your "must pass verification" requirement — we don't need to add a second gate, but we make it explicit in the email + article.

## What I need from you next

Once this plan is approved, I'll implement it, then you paste the CSV in the following format so I can run the import:

```
email,stripe_customer_id,provider_name,website
alex@example.com,cus_XXXXXXXX,Example Fitness Academy,https://example.com
...
```

`website` is optional; leave blank if unknown.

## Out of scope for this plan

- Replacing the "Scott McKay" signatory on the live PDF certificate templates in storage (you chose "Ship as-is"; happy to open this as a follow-up).
- A generic re-runnable CSV importer for other account types (this one is scoped to training providers).
- Marketing-email fan-out beyond the one triggered announcement per imported row.
