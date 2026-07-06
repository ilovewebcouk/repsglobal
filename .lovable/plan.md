## Correction to previous plan

Audit result: **verification reminders, insurance renewal, renewal-card-needed, winback lapsed, insurance blocked, renewal-payment-failed are all already fully automated** by existing cron jobs and event triggers (`recompute-verification-daily`, `insurance-check-renewals-daily`, `churn-lifecycle-daily`, payments webhook). You should not send them manually.

So the Campaigns template picker will be **strictly limited to true announcement broadcasts** — same body to a whole tier, no per-recipient tokens, one-off event.

## What we're building

A "Load from email template" dropdown in the Campaigns composer (next to the existing "Load from article" one) that lists only broadcast-safe templates and renders them into subject + HTML body, so you can send them with full open/click/bounce tracking, scheduling, and resend-to-failed.

## The strict allowlist

Only two templates today, adds only when a genuine one-off announcement ships:

- **Relaunch announcement** (`relaunch-announcement`)
- **New REPS rollout — log in & unlock your website** (`new-reps-rollout`)

Everything else in `src/lib/email-templates/registry.ts` is deliberately excluded and stays automated:

| Excluded template | Why | Where it fires |
|---|---|---|
| verification-reminder | daily cron | `recompute-verification-daily` |
| insurance-renewal-due | daily cron | `insurance-check-renewals-daily` |
| insurance-blocked | event on state change | verification/notifications |
| renewal-card-needed | churn lifecycle | `churn-lifecycle-daily` |
| renewal-payment-failed | Stripe webhook | payments webhook |
| winback-lapsed | churn lifecycle | `churn-lifecycle-daily` |
| enquiry-notification / support-* / review-* / chargeback-* / admin-invite / client-invite / professional-invite / professional-suspended|reinstated / purchase-confirmation / welcome-signup / ops-alert / cancellation-confirmation / member-cancelled / dispute-won-resubscribe | per-recipient transactional | app code / webhooks |

The allowlist is enforced **on the server**, not just in the UI, so nobody can craft a request to render a transactional template through this path.

## Plan

### 1. Server function — `renderRegistryTemplate`

`src/lib/campaigns/render-template.functions.ts`

- `requireSupabaseAuth` + `has_role('admin')` check.
- Input: `{ templateKey: string }`.
- Reject anything not in a hard-coded `BROADCAST_TEMPLATE_KEYS` set (initially `['relaunch-announcement', 'new-reps-rollout']`).
- Load `TEMPLATES[templateKey]` inside handler, render with `@react-email/components` → returns `{ subject, html, text, displayName }`.

### 2. Composer picker

`src/components/admin/campaigns/ComposeDialog.tsx`

- Add a small `TemplateLoader` component beside `ArticleLoader` (around line 473).
- Populates from the same `BROADCAST_TEMPLATE_KEYS` list, resolved to `displayName` for the label.
- On select → call `renderRegistryTemplate` → set `subject`, `body = html`, `format = "html"`, clear any article draft state, toast success.
- Include a small helper line: "Only one-off announcements are listed here. Lifecycle emails (renewals, verification, winback) are sent automatically by the backend."

### 3. Retire the redundant admin/settings cards

Delete both cards I added last turn and their server-fn files:

- `src/routes/admin_.settings.tsx` — remove `NewRepsRolloutTestCard`, `NewRepsRolloutBroadcastCard`, and their four imports.
- `src/lib/admin/send-new-reps-rollout-test.functions.ts` — delete.
- `src/lib/admin/send-new-reps-rollout-broadcast.functions.ts` — delete.

Leave the original `RelaunchTestCard` / `RelaunchBroadcastCard` alone for now — they predate Campaigns tracking and can be retired in a follow-up once you've done a full send through the new path.

### 4. Sending

Nothing changes here. Pick template → tier "Core" (or Core + Pro + Studio) → Send now / Schedule → full delivery, opens, clicks, bounces, resend-to-failed, per-recipient status in the campaign sheet.

## Not in this plan (deliberate)

- **Per-recipient personalisation** (`Hi Katie,`). Campaigns doesn't do it today; template loader matches that behaviour. Adding Mailgun recipient-variables is a separate, larger change.
- **Any UI to trigger the automated lifecycle emails manually.** Correct answer to that is "no". If a cron misfires, we fix the cron, not add a manual override.
- **Test-send-to-one-address for the template picker.** Direct mode already handles this — add yourself as a single recipient in Direct mode with the same template loaded.

## Files touched

- `src/lib/campaigns/render-template.functions.ts` (new, ~50 lines)
- `src/components/admin/campaigns/ComposeDialog.tsx` (add `TemplateLoader`)
- `src/routes/admin_.settings.tsx` (delete two cards + imports)
- `src/lib/admin/send-new-reps-rollout-test.functions.ts` (delete)
- `src/lib/admin/send-new-reps-rollout-broadcast.functions.ts` (delete)

## Verification

1. `/admin/campaigns` → New campaign → Broadcast → "Load from template" → "New REPS rollout" — subject + HTML populate.
2. Send a Direct-mode test to your own address; campaign sheet shows delivered → opened.
3. Confirm the picker only shows two options; attempting to hand-craft a call with `templateKey: "verification-reminder"` returns 403.
