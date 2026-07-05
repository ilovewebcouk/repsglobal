## What I audited

Every email call site in the codebase, split into three buckets:

**A. Already on the Lovable queue (correct — logged in Cloud → Emails):**
- Sign-up welcome (`welcome-signup`)
- Purchase confirmation, cancellation, chargeback (Stripe webhook)
- Enquiry notification + autoresponse, proposal-sent
- Admin/professional/client/team invites
- Verification reminder / submission / decision
- Renewal card-needed, renewal payment-failed, win-back
- Review reply, review removed
- Support outbound, support reply (user-initiated ticket updates)
- Ops alerts, lifecycle/churn touches
- **Auth emails** — signup confirm, magic link, **password recovery**, invite, email change, reauth — go through `src/routes/lovable/email/auth/webhook.ts` into the `auth_emails` queue and appear in Cloud → Emails with `template_name = 'recovery'`, etc. (This was set up in the previous turn; retrying Simon's reset after publish will land a `recovery` row.)

**B. Transactional but bypassing the queue (BUG — invisible in Cloud → Emails):**
1. `review-request` — `src/lib/reviews/reviews.functions.ts:340` renders the React Email template then calls `sendViaMailgun` directly. Sends, but no `email_send_log` row, no retry, no suppression check.
2. `member-cancelled` — `src/lib/admin/close-membership.server.ts:66` same pattern.

**C. Legitimately NOT on the queue (leave as-is):**
- `src/lib/support/mailgun-send.server.ts` — support ticket replies need Mailgun-specific `Message-ID` / `In-Reply-To` headers for inbound threading; the generic queue payload doesn't carry those. Support already has its own send log surface.
- `send-relaunch-broadcast` / `send-relaunch-test` — marketing broadcast, correctly outside the transactional queue.
- `newsletter` inbox (from the earlier no-reply work) — marketing.
- `connectivity.functions.ts` and events webhook — diagnostics, not sends.

## Fix

Replace the two direct `sendViaMailgun` calls in bucket B with `sendTransactionalEmailServer({ templateName, recipientEmail, idempotencyKey, templateData })`. Both templates are already registered in `src/lib/email-templates/registry.ts` (`review-request`, `member-cancelled`), so no template work is needed — just swap the transport.

Result: after the change, every transactional email in the app flows through `/lovable/email/transactional/send` → `transactional_emails` pgmq queue → `process-email-queue` → Mailgun, with a row in `email_send_log` visible in **Cloud → Emails** (status `pending` → `sent`/`dlq`/`suppressed`), plus automatic retry and suppression handling.

## Files touched
- `src/lib/reviews/reviews.functions.ts` (~lines 340–380): remove the inline render + `sendViaMailgun`; call `sendTransactionalEmailServer` with `templateName: 'review-request'`, `idempotencyKey: 'review-request-<token>'`, `templateData: { proName, reviewUrl, serviceLabel, clientName }`.
- `src/lib/admin/close-membership.server.ts` (~lines 55–80): same swap for `member-cancelled`, idempotency `member-cancelled-<userId>-<timestamp bucket>`.

No template edits, no schema changes, no new routes.

## Important — the unsubscribe footer

You asked for "no unsubscribe on transactional emails". I can't remove it, and I'd push back on doing so even if it were toggleable:

- Lovable's shared queue processor **auto-appends** a one-line unsubscribe footer to every email marked `purpose: 'transactional'`. That's baked into the platform routing, not the template.
- It's there for legal reasons (UK PECR / GDPR / CAN-SPAM). Even transactional mail must offer a way out, and stripping it risks Mailgun reputation damage and complaints landing us in `suppressed_emails`.
- The footer only unsubscribes the recipient from *marketing* mail. Genuinely transactional templates (password reset, purchase confirmation, verification decision, chargeback, support reply) will keep sending even after a user "unsubscribes" — the platform respects transactional intent.

So the correct answer is: the footer stays, but it's harmless — it does not stop a suspended member getting their suspension email or a customer getting their receipt.

## Out of scope
- Support-reply Mailgun path (needs threading headers).
- Marketing / relaunch broadcast (correctly outside transactional).
- Any UI changes to Cloud → Emails.
