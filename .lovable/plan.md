
## Goal

Make the app-email library easy to scan: group every template by **who receives it**, rename anything ambiguous, and order the registry so related emails sit together. No template copy, styling, or send-logic changes — just file locations, template keys, and display names.

All existing send call sites (`sendTransactionalEmail({ templateName: '...' })`) will be updated to the new keys in the same pass so nothing breaks.

## Proposed audience groups

```text
src/lib/email-templates/
├── auth/                      # Supabase auth (system)
│   ├── signup, magic-link, recovery, invite, email-change, reauthentication
│
├── trainer/                   # Individual professionals (members)
│   ├── onboarding/            # existing sequences, renamed
│   ├── invite/                # professional-invite, admin-invite
│   ├── verification/          # verification-reminder, verification-decision, insurance-blocked, insurance-renewal-due
│   ├── billing/               # purchase-confirmation, cancellation-confirmation, renewal-card-needed,
│   │                          # renewal-payment-failed, member-cancelled, winback-lapsed,
│   │                          # chargeback-*, dispute-won-resubscribe
│   ├── reviews/               # review-request, review-reply, review-removed
│   ├── enquiries/             # enquiry-notification, proposal-sent
│   ├── moderation/            # professional-suspended, professional-reinstated
│   └── lifecycle/             # welcome-signup, relaunch-announcement
│
├── provider/                  # Training providers (course/CPD companies)
│   ├── provider-domain-confirm
│   ├── certificates-ready
│   └── certificates-shipped
│
├── learner/                   # End learners of CPD courses
│   └── learner-certificate-issued
│
├── client/                    # Trainer's clients (portal)
│   └── client-invite
│
├── public/                    # Anyone (contact form, support)
│   ├── contact-autoresponse
│   ├── support-reply
│   └── support-outbound
│
└── ops/                       # Internal/admin
    └── ops-alert
```

## Naming clean-ups (rename keys + displayName only)

| Current key | New key | Reason |
|---|---|---|
| `professional-invite` | `trainer/invite-to-join` | "professional-invite" vs "admin-invite" is confusing |
| `admin-invite` | `trainer/admin-console-invite` | Clarifies it's the admin-console grant |
| `member-cancelled` | `trainer/billing/subscription-cancelled` | Aligns with cancel policy |
| `winback-lapsed` | `trainer/lifecycle/winback` | |
| `relaunch-announcement` | `trainer/lifecycle/relaunch` | |
| `verification-reminder` | `trainer/verification/reminder` | |
| `verification-decision` | `trainer/verification/decision` | |
| `provider-domain-confirm` | `provider/domain-confirm` | |
| `certificates-ready` | `provider/certificates-ready` | |
| `certificates-shipped` | `provider/certificates-shipped` | |
| `learner-certificate-issued` | `learner/certificate-issued` | |
| `onboarding-log-in-*` | `trainer/onboarding/login-*` | Hyphenation |
| `onboarding-signup-log-in-*` | `trainer/onboarding/signup-login-*` | |
| `onboarding-verify-*` | `trainer/onboarding/verify-*` | |
| `onboarding-website-*` | `trainer/onboarding/website-*` | |
| `onboarding-signup-verify-1` | `trainer/onboarding/signup-verify-1` | |
| `onboarding-complete` | `trainer/onboarding/complete` | |

`displayName` on every template gets a consistent prefix so the dashboard preview list groups visually:
- `Trainer · Billing — Purchase confirmation`
- `Provider · Certificates ready`
- `Learner · Certificate issued`
- `Public · Contact autoresponse`
- etc.

## Registry order

`TEMPLATES` in `src/lib/email-templates/registry.ts` will be re-sorted to match the folder tree (auth → trainer sub-groups in send-order → provider → learner → client → public → ops), with section-comment banners so the file reads like a table of contents.

## Send-site updates

`rg "templateName: '"` will surface every caller; each is updated to the new key in the same pass. Expected touch points (approx.): `src/lib/verification/*`, `src/routes/api/public/payments/webhook.ts`, provider domain functions, onboarding scheduler, certificate issuance flows, contact/support routes. No behaviour change — only string literals.

## Explicitly out of scope

- Template copy, subjects, styling, preview data — untouched.
- Auth templates (`signup`, `magic-link`, etc.) stay where they are unless we agree to move them into `auth/`; they're referenced by the auth webhook route.
- No new templates, no deletions.

## Deliverable

1. Files moved into the new folder tree.
2. `registry.ts` re-imported, re-ordered, keys renamed, section banners added.
3. All call sites updated to new keys.
4. `displayName` fields normalised with audience prefixes.
5. Typecheck clean.

Ready to switch to build mode on your approval — say the word and I'll do it in one pass.
