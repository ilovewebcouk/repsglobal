# Connect repsuk.org to the Lovable app (staging first)

## Approach

Keep your current Brilliant Directories site live on `repsuk.org` untouched. Point a new `staging.repsuk.org` subdomain at this Lovable app so you can:

- Use the app on a real branded URL
- Set up branded email (e.g. `notify@repsuk.org`) without touching the live site
- Later, when ready to launch, swap the root domain over and retire the staging subdomain

## Steps

### 1. Publish the app
Lovable requires the project to be published before any custom domain (including a subdomain) can be attached. I'll prompt you to click Publish — backend stays the same, just makes the app available at a public URL.

### 2. Add `staging.repsuk.org` as a custom domain
In **Project Settings → Domains → Connect Domain**, enter `staging.repsuk.org`. Lovable will show DNS records to add.

Because your DNS is on **Cloudflare**, in the Connect Domain dialog I'll tell you to expand **Advanced** and tick **"Domain uses Cloudflare or a similar proxy"** — this switches the setup from A-record to **CNAME-based** verification, which is the only thing that works reliably behind Cloudflare's proxy.

### 3. Add the records in Cloudflare
You'll add (Lovable shows the exact values):
- A `CNAME` for `staging` → Lovable's target host
- A `TXT` record `_lovable` for ownership verification
- Set the `staging` CNAME to **DNS only** (grey cloud) during verification — you can re-enable the orange proxy after SSL is issued, if you want

Your existing `repsuk.org` A records and MX/email records stay exactly as they are — Brilliant Directories keeps serving the live site.

### 4. Set up email on a delegated subdomain
For branded email I'll use Lovable Emails, which delegates a **sending subdomain** (e.g. `notify.repsuk.org`) to Lovable nameservers via `NS` records in Cloudflare. Lovable then manages SPF/DKIM/MX inside that subdomain.

Important: this only affects `notify.repsuk.org`. Your root `repsuk.org` MX records (the inbox you currently receive mail on) are **not touched**. Emails will send as `something@notify.repsuk.org` — if you'd rather they appear as `@repsuk.org`, that's possible too but needs more care around your existing SPF/DMARC on the root; happy to do that variant if you prefer.

### 5. Later: cutover to the root domain
When you're ready to launch:
1. Add `repsuk.org` and `www.repsuk.org` as custom domains on the Lovable project (same Cloudflare CNAME flow)
2. In Cloudflare, repoint the root A/CNAME away from Brilliant Directories to Lovable's target
3. Mark `repsuk.org` as **Primary** in Lovable so `www` and `staging` redirect to it
4. Remove `staging.repsuk.org` from the project once you're happy

Data migration from Brilliant Directories (exporting member/listing data into this app's database) is a separate workstream — we'll plan that when you're closer to cutover.

## What I need from you to start

1. Confirm you want to **publish the app now** (required before any domain can attach)
2. Confirm the staging subdomain should be **`staging.repsuk.org`** (or pick another, e.g. `app.repsuk.org`, `beta.repsuk.org`)
3. Confirm the email sending subdomain should be **`notify.repsuk.org`** (or pick another, e.g. `mail.`, `send.`, `hello.`)

Once you confirm, I'll walk you through Publish → Connect Domain → Cloudflare records → email setup in order, one step at a time.

## Technical notes

- Cloudflare requires CNAME-flattening / proxy-mode setup on Lovable's side — do not use the default A-record (`185.158.133.1`) flow; it can fail SSL issuance when Cloudflare proxies the record.
- NS delegation for the email subdomain means a third-party email provider cannot also verify on the same subdomain — if you later want e.g. Mailchimp on `notify.repsuk.org`, you'd need a different subdomain.
- SSL is auto-provisioned by Lovable once DNS verifies; can take a few minutes to a few hours.
- No code changes are needed for any of this — it's all DNS + project settings.
