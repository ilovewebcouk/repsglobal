# Newsletter → scoped into existing Campaigns

Everything runs through the current `/admin/campaigns` composer and Mailgun pipeline. No parallel system, no separate UI.

## What changes

### 1. New audience: "Newsletter subscribers"
Adds a fifth audience alongside `free / verified / pro / studio / former`:
- `newsletter` — anyone who confirmed opt-in via the public signup form, minus anyone unsubscribed or suppressed.

Wired into the same `resolveTierRecipients()` used by broadcast + scheduled sends, so all existing behaviour (tracking, resend-failed, scheduling, per-recipient status) applies automatically.

### 2. Public double opt-in signup
- Small `<NewsletterSignup />` form (email + consent checkbox) placed at the bottom of article pages under `/resources/*` and optionally the site footer.
- Submitting sends a Mailgun confirmation email with a one-click confirm link (`/newsletter/confirm?token=…`). Only after confirming does the address become sendable.
- Confirmation page shows success / already-confirmed / expired states.
- Reuses the existing `/email/unsubscribe` token flow so subscribers can unsubscribe from any campaign footer — single source of truth for opt-out.

### 3. Composer additions (minor)
- Audience picker gets a "Newsletter subscribers" chip (broadcast mode only).
- Optional "Load from article" button: pick a published article from `src/lib/resources.ts`, and the composer pre-fills subject (article title), preheader (excerpt), and body (hero image + intro + CTA button back to the full article on repsuk.org). You still edit before sending.
- No new send path — uses the existing Mailgun send, throttling, tracking, and failed-resend flow.

### 4. Compliance basics
- Consent timestamp + source URL captured on signup.
- Suppression list (existing `suppressed_emails`) checked before send — already handled by the current pipeline.
- CAN-SPAM/UK-GDPR: physical address + unsubscribe link auto-appended to any campaign sent to the `newsletter` audience (small footer partial in the email renderer).

## Technical details

**New table** `public.newsletter_subscribers`:
- `id uuid pk`, `email citext unique`, `status text` (`pending|confirmed|unsubscribed|bounced`), `confirm_token uuid`, `confirmed_at`, `unsubscribed_at`, `source_url`, `source` (`article|footer|admin_import`), `created_at`, `ip inet`, `user_agent text`.
- Grants: `service_role` all; no `anon` or `authenticated` — all writes/reads go through server functions.
- RLS enabled, admin-only SELECT policy via `has_role`.

**Server functions** (`src/lib/newsletter/subscribers.functions.ts`):
- `subscribeToNewsletter({ email, sourceUrl })` — public, rate-limited by IP, inserts `pending` row, sends confirm email via existing `mailgun-send.server`.
- `confirmNewsletterSubscription({ token })` — public, flips to `confirmed`.
- Admin: `listNewsletterSubscribers`, `importNewsletterSubscribers` (CSV paste, confirmed status, for existing manual list).

**Audience resolver update** (`src/lib/campaigns/outbound.functions.ts` + `outbound-extras.functions.ts` + `scheduled-runner.server.ts`):
- Extend `Tier` type to include `"newsletter"`.
- In `resolveTierRecipients()`, add a branch that selects `email, null as name` from `newsletter_subscribers where status = 'confirmed'`.
- Extend the Zod enums in both `.functions.ts` files.

**Composer** (`src/components/admin/campaigns/ComposeDialog.tsx`):
- Add "Newsletter subscribers" chip in the audience row.
- Add "Load from article" secondary action → dialog listing `resources.ts` articles → prefills subject/body.
- Body renderer for article emails: reusable `src/lib/campaigns/article-email.tsx` returning `{ text, html }` for Mailgun.

**Public routes**:
- `src/routes/newsletter.confirm.tsx` — confirmation landing.
- Signup form component mounted inside existing `<ResourceArticle />` layout.

**Migration**:
Single migration creating the table, grants, RLS, admin SELECT policy, and an index on `(status)` and `lower(email)`.

## Out of scope (flagged for a follow-up if you want)
- Segmented sends within newsletter (e.g. by article topic interest).
- Open/click analytics dashboard specific to newsletter (existing per-recipient status is enough for v1).
- Auto-send on article publish (v1 stays manual — you press Send from the composer).

## Answer to your immediate need
Once merged, sending the Website Editor article as a newsletter = open `/admin/campaigns` → New campaign → audience "Newsletter subscribers" → "Load from article" → pick "Introducing the REPs Website Editor" → review → Send. Same tracking, resend-failed, and scheduling as today's campaigns.
