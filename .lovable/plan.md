## Correction to previous plan

Ditch the "Load from email template" dropdown for lifecycle emails. Replace it with a proper onboarding drip — a stage machine that evaluates each member daily and sends the next persuasion email based on where they're stuck.

Keep the picker only for `relaunch-announcement` (one-off broadcast). Retire `new-reps-rollout` from the picker; its copy becomes stage-1 email #1 of the drip, rewritten in the canonical template style.

## The cohort

Live numbers from the DB:
- **333** confirmed members
- **32** have ever signed in
- **301** confirmed-but-never-signed-in — the primary target

## Stage machine

One SECURITY DEFINER function `resolve_onboarding_stage(user_id)` returns the current stage from live truth (auth.users + professionals):

| Stage | Rule | Purpose |
|---|---|---|
| `not_signed_in` | `auth.users.last_sign_in_at IS NULL` | Get them to reset password + log in |
| `verify_incomplete` | signed in, but `verification_status != 'approved'` OR `identity_verified_at IS NULL` OR insurance missing/expired | Get them verified |
| `website_unpublished` | verified, but `websites.is_published = false` OR no website row | Get the site live |
| `complete` | signed in + verified + published | Exit — one congrats email, then done |
| `muted` | user opted out or hard-bounced | Never send |

Stage is derived, not stored — so if someone logs in tomorrow they instantly stop getting stage-1 nudges without any manual reclassification.

## Nudge table

```sql
CREATE TABLE public.onboarding_nudges (
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  stage text NOT NULL,           -- 'not_signed_in' | 'verify_incomplete' | 'website_unpublished' | 'complete'
  step smallint NOT NULL,        -- 1..N within the stage
  sent_at timestamptz NOT NULL DEFAULT now(),
  message_id text,
  PRIMARY KEY (user_id, stage, step)
);
```

Idempotent by PK. If a row exists we've sent it — never resend. If a user drops back into a stage (rare — e.g. insurance expires) they resume from `max(step)+1` in that stage, up to the cadence cap.

## Cadence (days since entering the stage)

- **not_signed_in**: day 0, 3, 8, 17, 30 → 5 emails, then stop
- **verify_incomplete**: day 0, 4, 10, 21 → 4 emails, then stop
- **website_unpublished**: day 0, 5, 14 → 3 emails, then stop
- **complete**: 1 congrats email, immediate, one-time

"Day 0" = first daily eval where the member sits in that stage without a prior send in it. Stage-entry timestamp is inferred from the earlier nudge log or `auth.users.confirmed_at` for the first stage.

Global rules:
- Max **1** onboarding email per member per day (across all stages)
- Never send after `suppressed_emails` hit
- Respect existing `notification_preferences` (add a new `onboarding_nudges` toggle)
- Every email has an "I don't want these" one-click unsubscribe → writes to `notification_preferences` (not the global suppression list — they still get transactional)

## Email templates (5 new, canonical style)

All rebuilt in the same shell as `verification-reminder` / `welcome-signup` (brandBar + `<Button>` + compact ~80 lines), each with sharp persuasive copy tailored to the exact block:

1. **`onboarding-log-in-1`** — "The new REPS is here — set your password" (replaces `new-reps-rollout`; must include forgot-password link because migration reset passwords)
2. **`onboarding-log-in-2`** — "Your trainer website is waiting" (day 3, angle: what they're missing)
3. **`onboarding-log-in-3`** — "Enquiries are going to verified pros" (day 8, social proof + FOMO)
4. **`onboarding-log-in-4`** — "Last nudge before we pause these" (day 17, permission-based courtesy)
5. **`onboarding-log-in-5`** — "One click to reset your password" (day 30, dead-simple single-CTA)
6. **`onboarding-verify-1..4`** — cadence variants of the existing verification-reminder, tuned by stage-day (already have `verification-reminder`; add 3 sibling variants with different angles: trust signal, enquiries lost, insurance expiry, final)
7. **`onboarding-website-1..3`** — publish your site (angle: preview / competitor visible / "your site is 80% done")
8. **`onboarding-complete`** — one-time "You're live" congrats + what to do next

Total new template files: ~10 (or reuse existing verification-reminder for verify-1 with an extra `stageDay` prop — decide during build).

Also: **rebuild `new-reps-rollout.tsx` and `relaunch-announcement.tsx` in the canonical shell** so all app emails look consistent. `new-reps-rollout` then becomes `onboarding-log-in-1` and is removed from the standalone registry entry.

## Cron + dispatch

New server route: `src/routes/api/public/hooks/onboarding-nudge-cron.ts`
- Auth: `apikey` header = anon key (same pattern as other crons under `/api/public/hooks/`), plus internal admin verification via `has_role`
- Body-less POST
- Loads all professionals, filters to `not muted` + `not suppressed` + `notification_preferences.onboarding_nudges != false`
- For each: `stage = resolve_onboarding_stage(uid)`, look up existing rows in `onboarding_nudges` for that stage, decide next `step` and whether the cadence window has elapsed, send if due
- Uses same Mailgun rail as the existing broadcast (respects daily-cap, pacing 75/run)

Schedule via `pg_cron` — daily 08:00 UTC:
```sql
SELECT cron.schedule('onboarding-nudges-daily', '0 8 * * *',
  $$SELECT net.http_post(url:='https://repsglobal.lovable.app/api/public/hooks/onboarding-nudge-cron', headers:='{"Content-Type":"application/json","apikey":"..."}'::jsonb, body:='{}'::jsonb)$$);
```

## Admin surface

New card at **Admin → Settings → Onboarding drip** (replaces the New REPS rollout cards for good):

- **Live cohort counts** by stage (not_signed_in: 301, verify_incomplete: X, website_unpublished: Y, complete: Z)
- **Sends in last 7 days** by stage/step
- **Preview** button — dry-run the cron, shows what would send today without sending
- **Trigger now** — fires the cron immediately (idempotent)
- **Per-user drill-down** (linked from the professionals list): shows current stage, sends history, next scheduled send, "Skip to next stage" and "Mute" overrides

**Nothing in Campaigns.** Campaigns picker keeps only `relaunch-announcement`.

## What we retire

- Delete `new-reps-rollout.tsx` (copy moves into `onboarding-log-in-1.tsx`)
- Delete the `new-reps-rollout` entry from `render-template.functions.ts` allowlist
- Remove `new-reps-rollout` from `TEMPLATES` registry
- Retire `relaunch-announcement`'s bespoke styling — rebuild in canonical shell

## What stays automated as-is (already correct)

Untouched: `verification-reminder` (existing daily cron), `insurance-renewal-due`, `insurance-blocked`, `renewal-card-needed`, `renewal-payment-failed`, `winback-lapsed`. Those handle **existing verified paying members**. This drip handles the **onboarding funnel gap** for members who haven't crossed the "logged in + verified + published" line yet.

## Files touched

New:
- `supabase/migrations/<ts>_onboarding_nudges.sql` — table + `resolve_onboarding_stage()` SECURITY DEFINER
- `src/lib/email-templates/onboarding-log-in-{1..5}.tsx`
- `src/lib/email-templates/onboarding-verify-{2..4}.tsx` (verify-1 reuses existing `verification-reminder`)
- `src/lib/email-templates/onboarding-website-{1..3}.tsx`
- `src/lib/email-templates/onboarding-complete.tsx`
- `src/routes/api/public/hooks/onboarding-nudge-cron.ts`
- `src/lib/onboarding/nudge-dispatcher.functions.ts` (dry-run, trigger-now, stage counts, per-user drill-down)
- `src/components/admin/onboarding-drip-card.tsx`

Modified:
- `src/lib/email-templates/registry.ts` — add new templates, remove `new-reps-rollout`
- `src/lib/campaigns/render-template.functions.ts` — remove `new-reps-rollout` from allowlist
- `src/lib/email-templates/relaunch-announcement.tsx` — rebuild in canonical shell
- `src/routes/admin_.settings.tsx` — mount `<OnboardingDripCard />`
- pg_cron schedule row

Deleted:
- `src/lib/email-templates/new-reps-rollout.tsx`

## Copy direction (persuasion tone)

Not "please log in". Every email leads with what they lose by not logging in and closes with one obvious action:
- Stage 1: "Your website is built. It's sitting there. Set your password to unlock it."
- Stage 2: "Enquiries route to verified pros. You're one document away."
- Stage 3: "Your profile is 80% done. Hit publish."
- Complete: "You're live. Here's the first three things top pros do in week one."

Short, one CTA per email, no unsubscribe theatrics, brandBar consistent with the rest of the product.

## Verification

1. Migration applies, `resolve_onboarding_stage(cruz.pt@icloud.com)` returns `complete`
2. Admin card shows 301 in `not_signed_in`, matches the live count
3. "Preview" dry-run lists the day-0 recipients + which template each gets
4. "Trigger now" sends to a demo account (`demo-verified@repsuk.org`) → row appears in `onboarding_nudges` → repeat trigger does not duplicate
5. Manually log in as a test member → next cron eval advances them past `not_signed_in` and no further stage-1 emails send

## Not in this plan (deliberate)

- **Per-recipient merge fields beyond `firstName`** — templates stay generic; personalisation with real magic-link password-reset URLs is a follow-up (needs token minting per recipient)
- **SMS / in-app** — email only
- **A/B testing of subject lines** — pick the best one now, iterate on live open rates after 2 weeks
