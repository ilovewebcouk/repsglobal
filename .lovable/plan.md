## Phase 2.0.2 — The "10/10" pass

Three workstreams, shipped in order. Nothing else moves until each one is signed off.

---

### A. AI Credits Wallet (foundation — must ship first)

Every AI action across the platform draws from a per-pro credit balance. Without this, scoring leads, generating bios, AI portraits, taglines and (later) SMS will eat margin.

**Allowances on tier activation (one-time grant + monthly refill)**

| Tier | Sign-up grant | Monthly refill | Purpose of grant |
|---|---|---|---|
| Verified £99/yr | 150 credits | 30 / month | AI portrait (40) + bio (10) + tagline (5) + profile polish, leaves headroom |
| Pro £59/mo | 400 credits | 200 / month | Profile setup + ~200 lead scores/drafts/month |
| Studio £149/mo | 1,500 credits | 800 / month | Multi-trainer setup + heavy lead volume |

**Credit cost table (single source of truth in `src/lib/credits.ts`)**

| Action | Credits |
|---|---|
| Lead score (Gemini Flash) | 1 |
| AI reply draft (mailto, lead drawer) | 2 |
| AI bio (long-form) | 8 |
| AI tagline | 3 |
| AI portrait generation (one image) | 40 |
| Backfill batch (per lead) | 1 |
| Future: SMS / voice | reserved (not enabled in 2.1) |

**Behaviour**
- Refill on the 1st of every month (or anniversary of subscription start). No rollover beyond a 2-month ceiling (prevents hoarding then a 6-month dry spell).
- When balance < cost of next action → action button switches to **"Top up to use"** with a sheet showing top-up packs.
- Hard stop, never silent overage.

**Top-up packs (Stripe one-time prices, charged to saved card)**

| Pack | Price | Credits |
|---|---|---|
| Small | £10 | 200 |
| Medium | £25 | 600 (best value badge) |
| Large | £50 | 1,500 |

**New surfaces**
- `/dashboard/settings/usage` — Wallet page: current balance, this-month usage chart, top-up buttons, transaction history.
- Header chip on every dashboard page: `⚡ 412 credits` → click opens the wallet sheet.
- In-flow gate: any AI button shows a small `· 2` credit cost next to it.

---

### B. Drop Cal.com — Native calendar is canonical

- Remove every mention of Cal.com from copy, docs, marketing pages, comparison tables.
- The calendar mock-up you just attached **is** the booking system. It becomes the locked source of truth for `/dashboard/calendar`.
- Pro & Studio booking links = `/c/{slug}/book` (native, driven by the pro's own availability rules — already partly modelled in `professional_locations` and the `Availability` widget in the mock).
- Verified tier: no booking link. Their public profile has the existing "Enquire" CTA only. Optional future enhancement (not in this phase): a single text field "External booking URL" that renders a secondary CTA — gated behind a feature flag, not built now.
- Memory update: lock the calendar mock-up as `mem://design/locked-calendar` after this phase ships so it can never be redesigned without an explicit request.

This work is small: it's a copy-and-feature-flag pass, not a code rebuild. Native `/c/{slug}/book` is **out of scope for 2.0.2** — it goes in 2.1.

---

### C. Leads page — Full rebuild from a new mock

Current `/dashboard/leads` is a 7. To get to 10 it needs a new mock, not a polish pass. Process:

1. **Generate 3 design directions** for the Leads page using `design--create_directions` (uses the attached Calendar mock as the dark-dashboard visual reference so it sits in the same family). Each direction commits to:
   - A KPI strip (4 tiles, real sparklines)
   - Stage chip bar with counts (`All 38 · New 12 · Qualified 9 · Booked 4 · Converted 8 · Lost 5`)
   - Main work area — table OR kanban OR hybrid (this is the variable)
   - **AI Insight rail** — hero card per selected lead with: circular score ring (0–100), intent band chip, predicted £ value, 3 tappable "Next action" chips (Reply with AI · Book call · Send programme), confidence bar, "Why this score" expandable
   - Bottom row — 3 real charts (Recharts): conversion funnel, source mix donut, 30-day trend sparkline

2. **Ask you to pick one direction** via `questions--ask_questions` (type: prototype).

3. **Build the chosen direction** pixel-close, wired to live data:
   - All AI actions debit credits via the wallet from (A).
   - Lead score, reply draft, recommended action all run through `score.server.ts` and a new `draftReply.server.ts`.
   - **Email reply uses `mailto:`** (opens user's mail client, costs 2 credits for the draft generation only — no send infrastructure).
   - "Score all" backfill respects the wallet.

4. **Lock the result** as `mem://design/locked-leads` so it joins the source-of-truth list.

---

### Technical notes (for the engineer, skip if non-technical)

- New table `public.credit_wallets` (user_id PK, balance int, monthly_refill int, refill_grant_at timestamp, last_refilled_at timestamp).
- New table `public.credit_transactions` (id, user_id, delta int signed, action text, related_id uuid nullable, created_at). Append-only audit trail.
- RPC `public.spend_credits(_user_id uuid, _cost int, _action text, _related_id uuid)` returns boolean — atomic check-and-debit, used by every server fn that calls AI.
- RPC `public.grant_credits(_user_id uuid, _amount int, _reason text)` — used by Stripe webhook on top-up purchase and by monthly refill cron.
- Refill cron: pg_cron daily job that checks every active subscription and tops up if `last_refilled_at < (now - 1 month)`.
- Top-up: 3 new Stripe one-time products (`credits_small`, `credits_medium`, `credits_large`), Embedded Checkout from `/dashboard/settings/usage`, webhook handler in `/api/public/webhooks/stripe` already exists — extend it to call `grant_credits` on `checkout.session.completed` with the right metadata.
- All existing AI server fns (`scoreLeadById`, `backfillLeadScores`, future bio/tagline/image gens) wrapped to call `spend_credits` first; throw `INSUFFICIENT_CREDITS` if false, surfaced to UI as the top-up sheet.
- No Twilio, no Resend, no Cal.com dependencies added in this phase.

---

### Order of operations

1. Migration: wallets + transactions + RPCs + grant on tier activation trigger.
2. Stripe top-up products + webhook handler extension.
3. `/dashboard/settings/usage` page + header credit chip.
4. Wire `spend_credits` into existing `scoreLeadById` / `backfillLeadScores`.
5. Drop Cal.com (copy sweep + memory update).
6. Design directions → you pick → build new Leads page.
7. Lock both new mocks into memory.

**Stop and wait for your sign-off after each numbered step.** No continuous push this time — each one needs your eyes.

---

### What this explicitly does NOT include (Phase 2.1+ work)

- Native `/c/{slug}/book` booking flow (next phase).
- Twilio SMS / WhatsApp.
- Resend-powered email send (only `mailto:` for now).
- Voice / ElevenLabs.
- AI bio / tagline / portrait generation surfaces (the wallet is ready for them, but the UI to trigger them is a later phase).

That's the path to 10/10. Approve and I'll start with the migration.