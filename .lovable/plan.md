# Postage fee + Royal Mail Click & Drop integration

## Delivery model (confirmed)

- **E-certificates** → emailed directly to the **student** (learner email on the registration). Provider gets a bundled "certificates issued" notification.
- **Printed certificates** (UK batches) → posted to the **training provider** in one Royal Mail shipment per batch. Provider distributes internally.
- Non-UK providers → digital only. No postage charged.

## Pricing model

Two admin-editable flat fees, both snapshotted at checkout:

- `unit_price_pennies` — per certificate (existing)
- `postage_fee_pennies` — **per UK batch**, charged once regardless of certificate count (new)

Rationale: one shipment per batch. Snapshotting means historic batches keep their original prices when either fee changes.

## Courier: Royal Mail Click & Drop API

Integrate directly — user already has a Click & Drop account.

**Auth**: Single API token from Click & Drop → Settings → Integrations → Create API application. Stored as `ROYAL_MAIL_CLICK_DROP_API_KEY` (I'll request via `add_secret` at build time).

**Base URL**: `https://api.parcel.royalmail.com/api/v1`

**Endpoints we use**:
- `POST /orders` — create order with recipient address, weight, service code (default `TPN` = Tracked 48, `TPS` = Tracked 24). Returns `orderIdentifier` + `trackingNumber`.
- `POST /orders/{orderIdentifier}/label?documentType=postageLabel&includeReturnsLabel=false` — returns base64 label PDF.
- `GET /orders/{orderReference}` — poll for status if needed.

**Service selection**: admin-configurable default (Tracked 24 vs Tracked 48) in pricing panel. Per-batch override in dispatch dialog.

## Database changes

Migration: extend existing tables (no new tables needed for v1).

**`certificate_pricing`**:
- `postage_fee_pennies int not null default 500`
- `default_rm_service_code text not null default 'TPN'` (Tracked 48)

**`certificate_batches`**:
- `postage_fee_pennies_snapshot int not null default 0`
- `rm_service_code text` (snapshot at dispatch)
- `rm_order_identifier text` (Click & Drop order ID)
- `rm_order_reference text` (our reference, = batch id)
- `tracking_number text`
- `tracking_url text`
- `label_pdf_path text` (Storage path in `certificates` bucket)
- `shipped_at timestamptz`
- `ship_to_address jsonb` (snapshot of provider address at batch creation — line1, line2, city, postcode, country, contact name, phone)

`dispatched_at` (existing) = "handed to Royal Mail / label generated".

## Server functions (`src/lib/certificates/`)

**New `royal-mail.server.ts`** (server-only helper, `.server.ts` naming keeps it out of client bundles):
- `createRoyalMailOrder({ batchId, recipient, serviceCode, weightGrams })` → calls Click & Drop, returns `{ orderIdentifier, trackingNumber }`.
- `generateRoyalMailLabel(orderIdentifier)` → returns base64 PDF, we upload to `certificates` bucket at `batches/{batchId}/label.pdf`.
- `buildTrackingUrl(trackingNumber)` → `https://www.royalmail.com/track-your-item#/tracking-results/{n}`.
- All calls include error handling that surfaces the RM error body verbatim (per gateway-style error rules).

**Extend `certificates.functions.ts`**:
- `getCertificatePricing` / `setCertificatePricing` — include `postageFeePennies` and `defaultRmServiceCode`.
- `createBatchCheckout` — UK batches add postage as a second Stripe line item ("Postage & tracked delivery — Royal Mail"). Snapshot both fees on the batch row. Also snapshot `ship_to_address` from the provider profile at this point.
- `adminMarkBatchDispatched` — replace current signature with `{ batchId, serviceCode? }`. Handler:
  1. Load batch + snapshotted address.
  2. Call `createRoyalMailOrder`.
  3. Call `generateRoyalMailLabel`, upload PDF to storage.
  4. Update batch with `rm_order_identifier`, `tracking_number`, `tracking_url`, `label_pdf_path`, `shipped_at`, `status = 'dispatched'`.
  5. Send `certificates-shipped` email to provider.
- New `adminDownloadShippingLabel({ batchId })` → returns signed URL to `label.pdf`.
- New `getBatchTracking({ batchId })` — provider-scoped, returns tracking status for dashboard.

## Admin UI (`/admin/certificates`)

**Pricing tab** — three fields:
- Certificate unit price (£)
- Postage per batch (£) — "Charged once per UK batch. Non-UK batches are digital only."
- Default Royal Mail service — dropdown: Tracked 48 (TPN) / Tracked 24 (TPS)

**Print queue tab** — replace plain "Mark dispatched" button with a dialog:
- Shows recipient address (from snapshot)
- Service dropdown (defaults to admin default)
- "Create label & mark dispatched" → triggers Click & Drop flow, shows spinner, on success shows tracking number + "Download label PDF" button.
- Error state surfaces RM error message verbatim (e.g. invalid postcode, missing phone).

CSV export gains `service`, `tracking_number`, `rm_order_identifier`, `shipped_at`.

**Batches tab** — show carrier + tracking link + label download for dispatched batches.

## Provider UI (`/dashboard/students` → Certificates tab)

Per batch:
- Digital-only → "Emailed to students on {date}"
- UK, awaiting print → "Being prepared for dispatch"
- UK, shipped → "Shipped via Royal Mail {Tracked 24/48} on {date} • Track parcel →" (links to `tracking_url`)

## Emails

Split `certificates-ready` into two flavours + add one new template:

- `certificates-ready-digital` — "Your students have received their certificates" (list learner names).
- `certificates-ready-printed` — "Your certificates are being printed and dispatched shortly."
- **New `certificates-shipped`** — "Your certificates are on the way • Tracking: {url} • Expected: 1–2 working days (Tracked 24) or 2–3 (Tracked 48)."
- **New `learner-certificate-issued`** — sent directly to each learner with signed URL to their PDF and verification link. Fires on issuance for both digital and printed batches (learners still get the digital PDF even when printed copies are en route).

## Address requirements

Before a UK provider can check out a batch, verify they have a complete postal address on file (line1, city, postcode, contact name). If missing, block basket checkout with an inline "Add postal address" CTA linking to their profile. `ship_to_address` is snapshotted from the profile at batch creation time so later profile edits don't rewrite history.

## Secrets to add at build

- `ROYAL_MAIL_CLICK_DROP_API_KEY` — via `add_secret`. Instructions to user: Click & Drop → Settings → Integrations → Create API application → copy the API key.

## Out of scope for v1

- Automatic delivery-confirmation webhooks (Click & Drop supports webhooks; defer until we have volume that justifies it).
- International tracked shipping.
- Multi-parcel batches (assume one A4 envelope per batch; add weight override on the batch if a batch >50 certs).
- Refunding a shipment / voiding a label after generation.

## Open decisions before build

1. **Default service** — Tracked 48 (~£3.50 cost) or Tracked 24 (~£4.90)? I'd default to **Tracked 48** and price postage at **£6.50** to leave margin + packaging.
2. **Learner email of digital PDF** — confirmed sending directly to learner, yes?
3. **Provider address field** — is there already a postal address on `professionals` / provider profile, or do we need to add it as part of this migration? (I'll audit before building.)
