## What this email does

Sent the moment a BD member is auto-converted onto a real Stripe Subscription. Confirms: their card on file is being kept, what they'll be charged, when, and that they can cancel any time before that date.

## Why the current version isn't good enough

- Plain `Container` with no header bar, no footer, no branding — looks nothing like the relaunch announcement they just received from us.
- Vague jargon ("native recurring billing") that no trainer wants to read.
- No reference to their original Brilliant Directories sign-up — feels out of the blue.
- No dedicated summary card (renewal date / amount / card last4).
- No direct cancel link or manage-billing link — only a generic "open dashboard" button.
- Subject is functional but flat in the inbox.

## New design (matches relaunch-announcement.tsx)

Same 600px rounded card, dark header bar with `REPS` wordmark + tagline, orange eyebrow headings, summary box in `#faf8f4`, single primary CTA, soft footer.

```text
┌──────────────────────────────────────────┐
│  REPS            The register for pros   │   ← dark header
├──────────────────────────────────────────┤
│  Your REPs Core renewal is set.          │   ← H1
│                                           │
│  Short, human paragraph referencing BD   │
│  signup and that the card is the same.   │
│                                           │
│  RENEWAL SUMMARY (orange eyebrow)         │
│  ┌────────────────────────────────────┐  │
│  │  Plan        REPs Core (annual)    │  │
│  │  Amount      £99                   │  │
│  │  Renews on   12 July 2026          │  │
│  │  Card        Visa •••• 4242        │  │
│  └────────────────────────────────────┘  │
│                                           │
│  [ Manage billing ]    ← primary CTA     │
│                                           │
│  WHAT HAPPENS NEXT (orange eyebrow)       │
│  • Nothing today — no charge until …     │
│  • 7-day reminder before the renewal      │
│  • Cancel any time from Settings →        │
│    Billing — link inline                  │
│                                           │
│  Straight talk paragraph (same voice as   │
│  relaunch email — daily updates, etc.)    │
│                                           │
│  — The REPs team                          │
├──────────────────────────────────────────┤
│  REPs · The register · repsuk.org        │   ← soft footer
└──────────────────────────────────────────┘
```

## Copy (final)

**Subject:** `Your REPs Core renewal is set — £99 on {renewalDate}`

**Preview:** `Same card, same date, new platform. Your REPs Core renewal is locked in.`

**Body:**

> Hi {proName},
>
> When you joined REPs through Brilliant Directories, you agreed to an annual auto-renewal on the card we have on file. We've now moved your membership onto the rebuilt REPs platform — same card, same renewal date, same price.
>
> **Renewal summary**
>
> | | |
> | --- | --- |
> | Plan | REPs Core (annual) |
> | Amount | £99 |
> | Renews on | {renewalDate} |
> | Card | {cardBrand} •••• {cardLast4} |
>
> **[ Manage billing ]**
>
> **What happens next**
> - Nothing today — we won't charge anything until {renewalDate}.
> - We'll send a reminder 7 days before the renewal date.
> - You can update your card, view invoices, or cancel any time from Settings → Billing.
>
> **Straight talk** — we ship updates every day. The platform you see this week is not the platform you'll see next week. If you'd rather not be along for the ride, you can close your account in Settings → Account at any time.
>
> — The REPs team

## Technical scope

1. Rewrite `src/lib/email-templates/legacy-conversion-confirmation.tsx`:
   - Import & reuse the same style tokens (`main`, `card`, `header`, `headerLogo`, `headerTag`, `h1`, `p`, `eyebrow`, `pricingBox`, `ctaLink`, `inlineLink`, `footer`, `footerText`, `muted`) as `relaunch-announcement.tsx` — extracted inline; do not refactor relaunch yet.
   - Replace the existing `Container`-only structure with the full header + card + footer shell.
   - Add 4 new optional props: `cardBrand`, `cardLast4`, `manageBillingUrl`, `settingsUrl` (all with sensible defaults so existing queued sends still render).
   - Render the summary as an HTML `<table>` (email-client safe) inside `pricingBox` styling — not a markdown table.
   - Update `subject` and `previewData`.
2. Update the caller `src/lib/billing/convert-legacy.server.ts` to pass the four new fields when enqueuing the email (`cardBrand`, `cardLast4` from the Stripe PaymentMethod we already fetched; `manageBillingUrl` = `${SITE_URL}/dashboard/settings/billing`; `settingsUrl` = `${SITE_URL}/dashboard/settings`).
3. No registry change — template name stays `legacy-conversion-confirmation`.
4. No DB or Stripe changes. No new infrastructure. The 7 queued `pending` sends from earlier will pick up the new template automatically on the next queue tick.

## Out of scope

- Touching the relaunch-announcement template.
- Refactoring shared email styles into a common file (worth doing later, not in this pass).
- Building the 7-day reminder email (separate template, separate cron — Phase 3).
- The unauthorized 8 live conversions that ran earlier — flagged separately; addressing the email design here is independent.

## Preview URL after build

`/lovable/email/transactional/preview?template=legacy-conversion-confirmation` will render the new design with the `previewData` defaults so you can eyeball it before the next batch of 7 sends.
