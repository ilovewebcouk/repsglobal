## Audit findings — Simon Cumming password reset

I checked what actually happened when you triggered the reset for `simon.cumming@gmail.com`:

- **Supabase Auth accepted the request.** `auth.users.recovery_sent_at` is stamped `2026-07-05 13:28:52 UTC`. So the call from `/forgot-password` worked — the request reached Auth.
- **No row exists in `email_send_log`** for any password-reset / recovery / magiclink / signup template — for Simon or anyone else. The only `simon.cumming` rows are old marketing/legacy sends (`relaunch-announcement`, `legacy-conversion-confirmation`).
- **No auth email webhook is scaffolded.** There is no file at `src/routes/lovable/email/auth/webhook.ts`. Domain status confirms it: `notify.repsuk.org` is verified, but under the domain report it says *"No authentication emails yet"*.
- **No Member 360 activity for password resets** exists either — nothing in the admin member page reads `recovery_sent_at` or an auth event, so support has no visibility.

### What this means

Auth emails (recovery, magic link, signup confirm, invite, email change, reauth) are currently going through **Supabase's default built-in email path**, not through your Mailgun-backed `notify.repsuk.org` queue. That path has very tight built-in rate limits (a few per hour, project-wide) and doesn't use your verified sender — so:

- Emails frequently silently fail to be delivered.
- Nothing lands in `email_send_log`, so we can't tell whether they left the platform.
- Support can't see anything in Member 360.

That matches Simon's report exactly: request accepted, no email arrives, no trace anywhere.

The `/forgot-password` page code itself is fine — no bug there.

### Plan

1. **Scaffold the Lovable auth email templates + webhook** (`email_domain--scaffold_auth_email_templates`). This creates `src/routes/lovable/email/auth/webhook.ts` plus the six auth templates (signup, magiclink, recovery, invite, email_change, reauthentication), and switches Supabase's Auth Hook to enqueue into `auth_emails`. From then on every recovery send:
   - Goes out from `notify.repsuk.org` via your Mailgun setup (no more Supabase 2-per-hour rate cap).
   - Writes a row to `email_send_log` (`template_name = 'recovery'`, status transitions `pending → sent`/`failed`/`dlq`).
2. **Brand the scaffolded templates** to match the REPs dark look (background stays `#ffffff` per platform rule), so the recovery email doesn't look generic.
3. **Add password-reset visibility to Member 360** (`/admin/members/$userId`):
   - Show "Last password reset requested" from `auth.users.recovery_sent_at` (via a SECURITY DEFINER RPC — we can't read `auth.users` directly from the client).
   - Show the last few recovery send attempts from `email_send_log` where `recipient_email = member.email AND template_name = 'recovery'` (status + timestamp + error_message).
   - This gives support a one-glance answer to "did they request it / did it send / why did it fail".
4. **Retry Simon's reset** once the webhook is live and confirm a `recovery` row lands in `email_send_log` with `status = 'sent'`.

### Out of scope (calling out on purpose)

- Not touching the `/forgot-password` UI — it's working correctly.
- Not touching the newsletter no-reply work from the previous turn.
- Not addressing the pre-existing `welcome-signup` DLQ backlog (336 rows) — separate issue; happy to do it next if you want.

Approve and I'll run the scaffold, brand the templates, wire the Member 360 panel, and re-test on Simon's account.
