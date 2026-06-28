# Finish the BD → Stripe migration

Three sequenced workstreams, each runnable from `/admin/ops/billing` and each fully idempotent so re-runs are safe. No locked Phase 1 screens are touched.

## Current state (as of this turn)

- 333 converted to live Stripe Subscriptions
- 6 already on a sub via the legacy renewal cron
- 17 auto-eligible (Stripe customer + card + future renewal) — not yet pushed through a batch
- 27 blocked (no Stripe customer at all) → need card capture
- 1 already mid magic-link, 1 lapsed >30d → both need reactivation copy
- 5 with a customer but no `next_due_at`, 20 manually skipped → leave alone, surface in a CSV for your review

## Workstream 1 — Convert the remaining 17

No new code; the existing `runConvertBatch` in `src/lib/billing/convert-legacy.server.ts` already handles this exact cohort. Action: open `/admin/ops/billing` → `BdRailSwapCard` → set batch=20, environment=live, tick the confirm, click "Convert 20 now". Re-runs are no-ops because converted rows are stamped with `converted_at` and skipped by the query.

Confirmation email (`legacy-conversion-confirmation`) already fires per row with the price-jump justification copy you signed off. I'll add the "if it gets you one client this year, it's paid for itself — plus it makes you look like a pro" line you mentioned in the last round, in the same paragraph as the £34 → £99 framing.

## Workstream 2 — Setup-link emails for the 27 card-less members

New, self-contained, doesn't touch locked screens.

### What gets built

1. **Migration** — extend `public.billing_setup_tokens` usage (table already exists, 13 cols) so a token can be minted for a BD member without an active `auth.users` row, keyed by `bd_member_id` + `email`. Add partial unique index to prevent duplicate live tokens per BD id.
2. **Server fn** `createBdSetupLink(bdMemberId)` in `src/lib/billing/convert-legacy.functions.ts` — mints a 30-day single-use token, builds `https://repsuk.org/billing/setup/<token>`.
3. **Public route** `src/routes/billing.setup.$token.tsx` — token → branded SetupIntent page using Stripe Elements (publishable key only). On success: attach PM to the existing Stripe customer (if any) or create one, then call the same `convertOne` path with `trial_end = next_due_at` (or now+7d if past-due), mark token consumed, fire `legacy-conversion-confirmation`.
4. **New email template** `legacy-setup-link.tsx` in `src/lib/email-templates/` — same visual language and voice as `legacy-conversion-confirmation` (founder-friend tone, dark header card, £99 renewal summary, "one client pays for it" justification, single CTA "Add your card"). Registered in `src/lib/email-templates/registry.ts`.
5. **Batch sender** `sendBdSetupLinks({ dryRun, limit })` server fn — paced through `sendViaMailgun` at 100ms intervals (same pattern as the relaunch broadcast) so we stay under the 100/hr Mailgun probation cap. Idempotent by `bd_member_id`.
6. **Admin UI** — new tile inside `BdRailSwapCard`: "Send setup-link emails (27)" with dry-run preview + live send, same confirm-checkbox safety pattern.

### What the recipient sees
Branded REPs email → click → token-gated SetupIntent page → card added → subscription created on the spot → confirmation email.

## Workstream 3 — Reactivation emails (2 members)

Same shape as Workstream 2 but with different copy and a different landing route behaviour: card capture creates the sub with `trial_end = now + 7 days` (no past-date anchoring) and the email is honest about the lapse.

1. **New email template** `legacy-reactivation.tsx` — "your membership is paused — reactivate to keep your profile live", same founder-friend voice, same £99 framing.
2. Reuses the Workstream 2 token + setup page; the only difference is the template choice and `migration_kind = 'reactivation'` stamped on the legacy row.
3. **Admin UI** — second small tile in `BdRailSwapCard`: "Send reactivation emails (2)".

## Order of operations (one approval = all three)

1. Run migration for the token-extension changes.
2. Build Workstream 2 (template + token + setup page + server fn + UI tile).
3. Build Workstream 3 (template + UI tile, reusing W2 plumbing).
4. Manual step (you, post-build): click "Convert 20 now" → then "Send 27 setup-link emails" → then "Send 2 reactivation emails", spaced so Mailgun probation cap isn't tripped.

## Out of scope (deliberate)

- The 5 "no `next_due_at`" rows and the 20 manually-skipped rows — I'll add a "Download CSV of the 25 remaining open rows" button in the same card so you can triage them by hand. No automated email goes to them.
- No changes to `/pricing`, `/auth`, dashboard chrome, or any locked Phase 1 screen.
- No new cron — Workstream 1 stays a manual admin action; the existing `legacy-renewal` cron is unaffected.

## Technical notes

- Stripe SetupIntent flow uses the publishable key client-side and the existing `createStripeClient(environment)` helper server-side; no new secrets.
- Token route is public (`/billing/setup/$token`) but gated by single-use cryptographic token — same pattern as `/r/$token` and `/renew/$token`.
- All three new server fns are `createServerFn` with `requireSupabaseAuth` + `has_role(admin)` for the admin-triggered batches; the public setup route uses anonymous SSR + token validation.
- Pacing uses `await new Promise(r => setTimeout(r, 100))` between sends, matching the relaunch broadcast.
