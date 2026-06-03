# Set up Lovable Emails on `notify.repsuk.org`

Goal: send auth + app (transactional) emails from `notify@repsuk.org` (visible From may appear as `@repsuk.org`), without touching your live Brilliant Directories MX records on the root domain.

## How it works

Lovable delegates a subdomain (`notify.repsuk.org`) to Lovable nameservers via `NS` records in Cloudflare. Lovable then manages SPF / DKIM / MX inside that subdomain only. Your root `repsuk.org` inbox + Brilliant Directories DNS stay untouched.

## Steps

1. **Open email setup dialog** — you click "Set up email domain", enter `notify.repsuk.org`, and Lovable shows the exact `NS` records to add.
2. **Add NS records in Cloudflare** — for host `notify`, set to Lovable's nameservers (e.g. `ns3.lovable.cloud`, `ns4.lovable.cloud`). DNS-only (grey cloud) — NS records cannot be proxied.
3. **Wait for DNS verification** — usually minutes, can take up to 72h. You can monitor in Cloud → Emails. Scaffolding below does not need to wait.
4. **Provision email infrastructure** — creates the send queue, suppression list, unsubscribe tokens, send log, and the queue processor cron. One-time, fully automated.
5. **Scaffold auth email templates** — branded versions of signup confirmation, password reset, magic link, invite, email change, reauthentication. Styled to REPs tokens (orange brand, locked radii, white body bg). Replaces default Lovable auth emails once DNS verifies.
6. **Scaffold app (transactional) email infrastructure** — creates the send route, preview route, unsubscribe API + branded unsubscribe page, and a sample template registry. From this point any app trigger (contact form, booking confirmation, lead notification, client invite, etc.) can send via one helper.
7. **Wire `client-invite` template to live infra** — your code already has `src/lib/email-templates/client-invite.tsx` and a `sendTransactionalEmailServer` helper currently pointing at a placeholder `notify.dogboss.io`. I'll switch `SITE_NAME` / `SENDER_DOMAIN` / `FROM_DOMAIN` in `src/lib/email/send.server.ts` (and the matching constants in `src/routes/lovable/email/transactional/send.ts`) to `repsglobal` + `notify.repsuk.org`, so existing invite sends go out branded as `notify@repsuk.org` (display: `REPs <noreply@repsuk.org>`).

## What gets sent from where

- **Auth emails** → from `noreply@notify.repsuk.org`, displayed as `REPs <noreply@repsuk.org>`
- **App emails** (invites, confirmations, notifications) → same sender
- **Reply-to** → can be set to `hello@repsuk.org` or similar if you want replies to land in your existing inbox

## What I need from you to proceed

1. Confirm sending subdomain is **`notify.repsuk.org`** (and visible address `notify@repsuk.org`).
2. Confirm display name should be **"REPs"**.
3. (Optional) Confirm reply-to address — leave blank to use the sending address.

Once you confirm, I'll open the email setup dialog and walk through Cloudflare NS records, then run infra setup + auth + app scaffolding in sequence.

## Technical notes

- NS delegation means no other email service (Mailchimp, Resend, SendGrid) can verify on `notify.repsuk.org` while it's delegated to Lovable — use a different subdomain if you ever need that.
- Root `repsuk.org` MX records (your current inbox + Brilliant Directories) are not touched.
- DMARC on the root: if you have a strict `p=reject` DMARC on `repsuk.org`, sends from a delegated subdomain still align via DKIM, so this is normally fine. If your DMARC is custom I'll review it before sending.
- No code changes are needed for steps 1–6. Step 7 edits `src/lib/email/send.server.ts` and `src/routes/lovable/email/transactional/send.ts` only.
