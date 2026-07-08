
# Training-provider verification: two-stage flow

Replace the current provider verification (Identity + Insurance + Qualifications) with a purpose-built two-stage flow for training providers only. Trainer verification is unchanged.

## The flow

```text
Step 01 — Identity            Step 02 — Domain email
Stripe Identity (existing)    Confirm an email on the
                              provider's website domain
                                       │
                                       ▼
                              Admin reviews & approves
                              the domain itself
                                       │
                                       ▼
                              Provider is Verified
```

Both stages must pass for the provider to be marked Verified. Identity and domain can be completed in any order, but neither alone is sufficient.

## Rules (from your answers)

- **Domain source:** derived from the provider's website URL on their profile (`professionals.website`). Read-only in the verification UI — if it's blank or invalid, we prompt the user to set it in their profile first.
- **Scope:** one-time, provider-level. Once the provider is domain-verified, any staff on that account inherits it. Additional users don't re-verify.
- **Free domains blocked:** gmail.com, outlook.com, hotmail.com, yahoo.com, icloud.com, proton.me, protonmail.com, aol.com, gmx.com, live.com, msn.com, me.com, mail.com, yandex.com, zoho.com. Attempted use shows a clear "You need a business domain" message with a support link.
- **Admin gate:** even after the user confirms a matching email, the provider is *not* auto-verified. Status becomes `pending_admin_review`; an admin approves the domain in `/admin/verification` before Verified goes live.

## Data model

New table `provider_domain_verifications` (one row per provider):

```text
id, professional_id (unique), domain (text), email (text),
status ('unstarted' | 'email_sent' | 'email_confirmed' |
        'pending_admin_review' | 'approved' | 'rejected'),
email_sent_at, email_confirmed_at,
admin_reviewed_at, admin_reviewer_id, admin_notes,
confirmation_token_hash, confirmation_expires_at,
created_at, updated_at
```

RLS: provider members can select/insert their own row; admins full access via `has_role`. Public confirmation endpoint validates by token hash, not by session.

Trust state for providers becomes: `identity.approved && provider_domain.approved`. Insurance/qualifications ticks are ignored for the provider trust badge.

## Server functions & routes

- `getProviderDomainVerification` (auth) — returns current row + derived `expectedDomain` from `professionals.website`.
- `startProviderDomainVerification` (auth) — input `{ email }`. Validates: website is set, email domain === website domain (case-insensitive, strip `www.`), not in free-domain blocklist. Generates single-use token, stores hash + 24h expiry, enqueues transactional email (`provider-domain-confirm` template) to that address.
- `resendProviderDomainConfirmation` (auth) — rate-limited (1/min, 5/day).
- Public route `GET /api/public/verify-provider-domain?token=…` — validates token, marks `email_confirmed`, transitions to `pending_admin_review`, redirects to a branded confirmation page.
- Admin: extend `/admin/verification` queue with a new item type `provider_domain`; approve/reject writes back to `provider_domain_verifications` and updates `professionals.verification` when both stages are green.

## UI changes

`src/components/dashboard/organisation/VerificationPage.tsx`:

- Keep `IdentityProfileCard` as step **01**.
- Remove `InsuranceProfileCard`, `QualificationsCard`, and `NameProfessionCard` from this page.
- Add new `DomainEmailCard` as step **02** with these states:
  - **Website missing** → CTA to set website in profile.
  - **Unstarted / email_sent** → email input pre-suggested as `hello@<domain>` + Send / Resend, shows "We sent a link to X. Click it to confirm."
  - **email_confirmed / pending_admin_review** → amber pill "Awaiting admin review".
  - **approved** → emerald pill "Verified".
  - **rejected** → rose pill with admin notes + "Try a different email".
- Update Hero copy + `LayerChip`s: two layers for providers ("Verified", "Domain-confirmed"), not three.

Trainer verification page (`_trainer` branch) is untouched.

## Email template

New app email template `provider-domain-confirm` in `src/lib/email-templates/` with a single "Confirm your provider email" CTA linking to the public confirmation route. Registered in the template registry.

## Admin queue

`/admin/verification`:

- New filter/tab `Provider domain`.
- Workspace pane shows: provider name, website URL, confirmed email, domain match, confirmation timestamp, decision buttons (Approve / Reject with reason). Reject reasons: "Free email domain", "Domain doesn't match website", "Website not owned by this org", "Other".

## Migrations (in one file, in order)

1. `CREATE TABLE public.provider_domain_verifications (…)`
2. GRANTs to `authenticated`, `service_role`.
3. `ENABLE ROW LEVEL SECURITY`.
4. Policies: self-select/self-insert for organisation members; admin full access via `has_role`.
5. Trigger to `set_updated_at`.

No data backfill — existing providers start at `unstarted`.

## Out of scope

- Trainer flow (unchanged).
- Multi-domain providers (single domain per provider for now).
- DNS-record verification (email-only for v1).
- Automatic re-verification on website change (admin re-review only if the user edits their website after approval — flagged in admin, not blocked).
