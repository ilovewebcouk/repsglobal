# Pass A — Enquiries & Leads (Pro vs Verified)

Scope is strictly enquiries + leads. Calendar, bookings, messages, and reviews are explicitly out of scope and wait for their dedicated mock-up passes.

## Tier model (locked for this pass)

- **Verified (£99/yr)** — trust layer only.
  - Profile is discoverable + verified badge.
  - Enquiry form on `/pro/$slug` sends an **email** to the pro.
  - Email comes from `notify.repsuk.org`, with the lead's email set as **Reply-To** so the pro replies from their inbox straight back to the lead. REPs is just the forwarder.
  - No dashboard inbox. No pipeline. No "Leads" or "Enquiries" sidebar entry.
- **Pro (£59/mo Founding)** — full operating system.
  - Same enquiry form on `/pro/$slug`, but submissions land **straight into the Leads pipeline** as `stage = new`. No intermediate "needs triage" inbox.
  - One surface: `/dashboard/leads`. The standalone `/dashboard/enquiries` route is removed.
  - Pro still gets a notification email (lighter, "new lead from {name} — open in REPs" CTA), but the source of truth is the pipeline.

## What changes

### 1. Submission flow (`/pro/$slug` enquiry form)

Server function reads the pro's tier:
- Verified → insert minimal record (for analytics/audit), send forwarder email to pro (Reply-To = lead), done.
- Pro → insert full `enquiries` row, immediately create matching `leads` row at `stage = new`, send pro a "new lead" notification email.

Lead form, validation, and `/pro/$slug/enquire` UI do not change visually.

### 2. Routes & sidebar

- Delete `src/routes/_authenticated/_professional/dashboard_.enquiries.tsx`.
- Delete enquiries-only components (`EnquiryDetailPane`, `EnquiryList`, `EnquiryStatStrip`, `UpgradeNudge`) — fold any reusable bits into leads.
- Sidebar: remove "Enquiries" item for everyone. "Leads" item shows for Pro only (tier-aware, already wired via subscription).
- Verified pros who hit `/dashboard/leads` directly → redirect to `/dashboard` with a small upsell card ("Leads pipeline is a Pro feature").

### 3. Leads page polish (the 10/10 bit)

`/dashboard/leads` keeps the structure we just shipped. Two fixes:
- **Double-H1 bug** — page H1 becomes "Leads" only. Section labels ("Your pipeline", "Selected lead") demote to `h2` with the existing eyebrow styling. Same fix applied to the (about-to-be-deleted) enquiries route on the way out, in case any shared component is reused.
- **New-lead surfacing** — `stage = new` leads from the last 24h get a subtle "New" pill + a count in the stage chip, so a pro logging in sees fresh leads without having to hunt.

### 4. Email templates

Two app-email templates via the scaffolded transactional pipeline:
- `enquiry-forward-verified` — to the pro, Reply-To = lead's email, body contains the full enquiry. This IS the workflow for Verified.
- `lead-notification-pro` — to the pro, short, single CTA "Open lead in REPs" deep-linking to `/dashboard/leads?lead={id}`. The pipeline is the workflow.

Both use the existing brand template shell. No marketing copy.

### 5. Copy / pricing alignment (enquiries + leads only)

- `/pricing`, `/for-professionals`, `/features/visibility`, `/features/shop-front`, `/features/operations`, `/features/growth`, comparison matrices: audit any line that promises Verified pros a "leads inbox", "pipeline", "dashboard for enquiries", etc. Rewrite to "enquiries forwarded straight to your inbox" for Verified, "full leads pipeline" for Pro.
- No visual redesign of those locked pages — copy-only edits inside existing components.

## Out of scope (parked, do not touch)

- `/dashboard/calendar`, `/dashboard/bookings`, `/dashboard/messages`, `/dashboard/reviews`
- Verified vs unverified review distinction
- Folding leads into a unified Messages inbox (that's Phase 2.1 once the messages mock-up lands)
- Stripe/billing changes
- Any other locked marketing page redesign

## Technical notes

- New table work: none. `enquiries` and `leads` (`lead_activity`, `lead_proposals`) already exist.
- Server fn: extend the existing enquiry-submit `createServerFn` to branch on tier; add a tier check by reading `subscriptions` + `professionals.tier`.
- Forwarder email Reply-To header: set in the React Email `template` send call via the `replyTo` field on the send route payload.
- Memory update: write `mem://phase/2.0-verified-scope` to reflect the locked split (Verified = trust + email forward only; Pro = full pipeline + everything else).

## Definition of done for Pass A

- Submitting an enquiry on a Verified pro's profile lands in their email with working Reply-To, and creates no pipeline row beyond the audit record.
- Submitting on a Pro's profile creates a `new` lead visible on `/dashboard/leads` within seconds, plus a notification email.
- `/dashboard/enquiries` no longer exists. Sidebar no longer shows "Enquiries". Verified pros don't see "Leads".
- No page has two H1s.
- Marketing/pricing/comparison copy no longer promises Verified pros a leads inbox.

After this ships, the next pass picks up `/dashboard/messages` from your mock-up and folds Pro lead conversations into it.
