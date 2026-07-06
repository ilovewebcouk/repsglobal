
# Phase 1 — Training Provider Membership

Language: the provider's public page at `/providers/$slug` is their **website** on REPs. Same word we use for the trainer website at `/c/$slug`. The banned word is never used again — in code, copy, comments, routes, components, or memory.

Locks in your three decisions:

1. **Manual admin onboarding**, tied to an existing Stripe customer ID (no CSV import — ~20 providers).
2. **Trustpilot-shaped reviews** with email verification, immediate publish, flag → evidence → takedown workflow, and a two-tier "Verified purchase" vs "Open" display.
3. **Full provider website** at `/providers/$slug`, styled after the locked `/c/$slug` coach website, with accredited courses (badge + REPs ID), reviews, and about — a REPs-hosted website for the provider.

Phase 1 does NOT build: provider self-serve dashboard, Stripe checkout for orgs (admin attaches existing customer instead), CSV import, SVG badge generator, Trainer↔course link on pro profiles, Companies House automation.

---

## 1. Data model (new tables, all under `public`)

- `organisations` — the training provider entity
  - `slug` (unique), `name`, `legal_name`, `companies_house_number`, `website_url`, `logo_url`, `cover_url`, `about_md`, `city`, `country`, `contact_email`, `contact_phone`
  - `status`: `draft | active | suspended | cancelled`
  - `stripe_customer_id` (nullable, unique) — pasted by admin from existing Stripe customer
  - `subscription_id` → `subscriptions.id` (nullable) — attaches to the existing subscriptions table (extended, see §3)
  - `published_at`, `verified_at`
- `organisation_users` — link `auth.users` ↔ organisations with role (`owner | manager`). Not exposed in UI in Phase 1 (no self-serve), but scaffolded so Phase 2 dashboard doesn't need a migration.
- `courses` — one row per accredited course
  - `organisation_id`, `title`, `slug` (unique within org), `summary`, `description_md`, `duration_hours`, `delivery_mode` (`in-person | online | hybrid`), `level`, `price_from`, `external_url`
  - `reps_course_id` (human-readable REPs ID, e.g. `REPS-C-000123`, generated on approval)
  - `status`: `pending | accredited | rejected | expired`, `accredited_at`, `accredited_by`, `expires_at`
- `course_accreditation_files` — supporting docs (syllabus PDF, awarding body letter). Storage bucket `course-accreditations` (private).
- `provider_reviews` — public reviews of an organisation
  - `organisation_id`, `rating` (1–5), `title`, `body`, `author_display_name`, `author_email_hash`, `author_ip_hash`, `user_agent_hash`, `asn`
  - `verification_source`: `open` (email double opt-in) | `verified` (invite token from `provider_review_requests`)
  - `status`: `pending_email | published | flagged | evidence_requested | removed`
  - `email_verified_at`, `flagged_at`, `evidence_requested_at`, `evidence_deadline_at`, `removed_at`, `removed_reason`
- `provider_review_requests` — invite tokens providers can send to past students (mirrors existing pro `review_requests` pattern) → drives the "Verified" badge.
- `provider_review_evidence` — files uploaded by reviewers when a review is flagged. Bucket `provider-review-evidence` (private, admin-only read).
- `provider_review_flags` — audit trail (who flagged, when, reason).

All tables: RLS enabled, GRANT block per project rules, `updated_at` triggers, admin-only status writes via SECURITY DEFINER RPCs.

## 2. Manual admin onboarding flow

Route: `/admin/training-providers`

- **List** — all organisations, filter by status, search by name / CH number / Stripe customer ID.
- **Create** — single form:
  1. Paste **Stripe customer ID** (`cus_...`). Server fn hits Stripe API, previews customer email + name + active subscription in the modal before save.
  2. Fill name, legal name, CH number, website URL, city, contact email.
  3. On save: creates `organisation` row (`status: draft`), links `stripe_customer_id`, and if the Stripe customer has an active sub, attaches/creates a matching `subscriptions` row with `tier: training_provider` (see §3).
- **Edit** — all fields, logo/cover upload, about markdown, publish/unpublish.
- **Courses tab** — add course, mark accredited (generates `REPS-C-XXXXXX`), attach syllabus PDF, set expiry.
- **Reviews tab** — deep link into `/admin/reviews?scope=providers` (§4).

## 3. Billing — extend existing `subscriptions`

- Add `training_provider` to the tier set in `src/lib/billing.ts` at £499/yr (product + price IDs via env — you paste them once from your existing Stripe dashboard).
- Add `owner_type` (`user | organisation`) and `owner_id` (uuid) columns to `subscriptions`; backfill existing rows to `owner_type='user'`, `owner_id=user_id`.
- Existing per-user subs keep working unchanged. Org subs use `owner_type='organisation'`.
- Webhook: on `customer.subscription.updated/deleted`, if the customer matches an `organisations.stripe_customer_id`, update that org's `subscription_id`/status.
- No Stripe Checkout for orgs in Phase 1 — subs already exist in Stripe; admin just attaches them.

## 4. Reviews — Trustpilot-shaped

**Public submit** at `/providers/$slug/review`:
- Name, email (required, double opt-in), rating, title, body.
- Rate limits: 1 review / email / provider; 3 reviews / email / day platform-wide. IP + UA + ASN hashed and stored (never displayed).
- On submit → `status: pending_email`, verification email sent. Click confirms → `status: published` immediately.
- Invite-token URL (`?t=...` from `provider_review_requests`): skips email verification, publishes as `verification_source: verified`.

**Public display** on `/providers/$slug`:
- Two-tier: `Verified` badge on invite-sourced reviews; open reviews shown without badge. Both visible; default sort "most recent".
- Aggregate rating shows both counts.

**Provider flag → admin queue** (Phase 1 admin-only; provider self-service flagging is Phase 2):
- Admin flags on behalf of a provider from `/admin/reviews`.
- Flagged reviews show "under review" publicly (still visible with badge).
- Admin can request evidence from the reviewer → email with upload link → 14-day deadline → auto-remove if no response.
- Admin can force-publish (clear flag) or remove with reason.

**Moderation UI** — new tab in existing `/admin/reviews`:
- Scope filter: `professionals | providers | all`.
- Same table shape as pro reviews, extra columns: verification source, IP cluster hint (grouped by ASN + signup-week to surface coordinated attacks), evidence status.

**Legal**:
- New `/legal/reviews` page: reviewer T&Cs (identity disclosure under court order), provider T&Cs (no solicitation of fake reviews), takedown SLA.
- Linked from every review submission form.

## 5. Provider website — `/providers/$slug`

Modelled on the locked `/c/$slug` coach website (dark, sticky sub-nav, outcome-led hero, section body). Reuses existing primitives — no new design system.

Section stack (top → bottom):

1. **Sticky header + sub-nav** — reuses the `SectionNav` pattern from `/c/$slug`. Anchors: Courses, Reviews, About, Contact.
2. **Hero** — cover image + logo + name + one-line pitch + rating stars + "REPs-accredited since 2024" chip + primary CTA "See accredited courses".
3. **Trust strip** — verified since date, accredited-course count, average rating, students trained (optional field).
4. **Accredited courses** — grid of course cards, each with:
   - Title, duration, delivery mode, level, price from
   - **REPs course ID** (`REPS-C-XXXXXX`) as pill
   - **Accreditation badge** (SVG component; the standalone downloadable badge generator is Phase 2)
   - "View syllabus" link if PDF attached
   - "Enquire on provider site" → outbound link to their URL (UTM-tagged)
5. **Methodology / about** — free-form markdown from `about_md`.
6. **Reviews** — aggregate rating, filter (verified / open / all), review cards, "Write a review" CTA → `/providers/$slug/review`.
7. **About the provider** — legal name, CH number, city, external website, verified date.
8. **FAQ** — 4–6 static FAQs on REPs accreditation (what it means, how to verify, complaints process → `/verify/provider/$id`).
9. **Final CTA** — reuses `FinalCta` primitive: "Looking for an accredited trainer? Browse REPs professionals."

Also: `/verify/provider/$membershipId` public verification page (like the pro one) — live DB status, screenshot-proof.

## 6. Public routes

- `/providers` — searchable index (name, city, delivery mode, rating).
- `/providers/$slug` — the provider website.
- `/providers/$slug/review` — public review submission (open + email-verified).
- `/providers/$slug/review?t=$token` — invite-token flow (verified badge).
- `/verify/provider/$membershipId` — provider verification page.
- `/verify/course/$repsCourseId` — course verification page (provider, accredited date, expiry, syllabus link).
- `/legal/reviews` — review T&Cs.

## 7. Language

- "REPs-accredited" (per your call).
- Course badges: "REPs-accredited course · REPS-C-000123".
- Provider badges: "REPs-accredited training provider · since Jun 2026".
- The public page for a provider is a **provider website** (never the banned word).

---

## Memory updates (first thing on build-mode switch)

- New: `mem://constraint/word-ban-shopfront` — hard ban on the word in any casing/spacing, in code, copy, memory, routes, and comments.
- Rewrite the Core index line 14 and `mem://design/coach-shopfront` entry (line 45) to use "website" — rename the memory file to `mem://design/coach-website`. Same for `mem://design/locked-shop-front` (line 54) → `mem://design/locked-features-website`.
- Rename legacy files `src/routes/features.shop-front.tsx` and `src/routes/_authenticated/_professional/dashboard_.shop-front.tsx` to `.website.tsx` variants opportunistically (a `features.website.tsx` already exists — reconcile in the same pass).

---

## Open questions before Phase 1 ships

1. **Accreditation rubric** — what's the actual checklist admin uses to mark a course `accredited`? (Awarding body, syllabus hours, assessment method, tutor qualifications, insurance?) Drives the admin course-review form fields.
2. **Course expiry policy** — do accreditations expire annually with the provider's membership, every 2 years, or only on syllabus change? Drives `expires_at` default.
3. **Reviewer identity on public display** — first name + last initial ("James W."), full name, or reviewer's choice at submit time?
4. **Provider dashboard scope for Phase 2** — flag reviews, edit about, send review invites, view enquiry stats. Confirm the order.

---

## Technical notes

- All new tables follow `<public-schema-grants>` (GRANT + RLS + policies in the same migration).
- Public review submission is a **server route** at `/api/public/reviews/provider` (rate-limited + Turnstile) — not a server function, because it's called from an unauthenticated form.
- Email verification uses a signed token (like existing `review_requests`), stored as `email_verification_token_hash`.
- Stripe customer lookup uses the existing Stripe secret in a server function guarded by `requireSupabaseAuth` + `has_role('admin')`.
- All admin actions write to `admin_audit_log`.
- IP / UA / ASN stored as SHA-256 hashes with a server-side pepper — never plaintext, never displayed, used only for clustering in the admin view.
- Course badge SVG in Phase 1 = a single static component with dynamic ID text; the downloadable/embeddable badge generator is Phase 2.

Approve this and I'll start with the memory rewrite + word-ban enforcement, then migrations, admin CRUD, then the public `/providers/$slug` website.
