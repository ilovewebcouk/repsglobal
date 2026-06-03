# Rebuild /for-professionals as a 9-section 50/50 narrative

Replace the current 5-pillar `ProductBlock` stack with **9 alternating 50/50 sections (A–I)** with world-class copy. Keep `MockupPlaceholder` placeholders ("…mockup — screenshot coming") — no new mock-up components, no generated images. Tighten the AI band. Audit the pricing preview. **Leave the final CTA exactly as it is.**

## 1. Replace pillar loop with `SECTION_BLOCKS` (9 entries) in `src/routes/for-professionals.tsx`

Drives nine `ProductBlock`s, alternating `reverse` by index. Each: `{ eyebrow, title, body, bullets[], imageLabel, ctaLabel, ctaHref }`. Final copy (verbatim):

- **A. Visibility** → `/features/visibility` — Eyebrow `VISIBILITY`
  - H2: **Be found. Be trusted. Be booked.**
  - Body: Your REPs profile is built to convert. Clients see exactly who you are, what you deliver, and the proof behind it — before they ever message you.
  - Bullets: Verified professional profile · Qualifications, insurance and CPD on display · Reviews on the public record · Found by location and specialism
  - Placeholder: `Profile + directory mockup — screenshot coming`

- **B. Leads CRM** → `/features/operations` — Eyebrow `OPERATIONS`
  - H2: **Turn enquiries into paying clients.**
  - Body: Every enquiry lands in one pipeline — source, value, follow-up date, priority — so nothing slips and nobody goes cold.
  - Bullets: Lead pipeline with stages · Enquiry source tracking · Follow-up reminders · AI lead scoring and reply drafts
  - Placeholder: `Leads pipeline mockup — screenshot coming`

- **C. Client management** → `/features/coaching` — Eyebrow `COACHING`
  - H2: **Know every client at a glance.**
  - Body: Goals, progress, programmes, bookings, payments, notes and check-ins on one professional record. Open a client, see the whole story.
  - Bullets: Full client profiles · Adherence and progress summary · Programme and nutrition snapshot · Notes, payments and bookings in one place
  - Placeholder: `Client record mockup — screenshot coming`

- **D. Bookings, calendar and payments** → `/features/operations` — Eyebrow `OPERATIONS`
  - H2: **Run your schedule and your revenue from one place.**
  - Body: 1-to-1s, consultations, online check-ins, classes, invoices and payment status — without tab-switching between four tools.
  - Bullets: Calendar and booking view · Availability and session types · Payment status and revenue tracking · Per-client payment history
  - Placeholder: `Bookings + payments mockup — screenshot coming`

- **E. Programme builder** → `/features/coaching` — Eyebrow `COACHING`
  - H2: **Build serious programmes without the spreadsheet chaos.**
  - Body: Weeks, workouts, sets, reps, rest and RPE — assembled in a clean professional builder and assigned to clients in a click.
  - Bullets: Week-by-week programme structure · Workout and exercise builder · Curated exercise library · One-click client assignment
  - Placeholder: `Programme builder mockup — screenshot coming`

- **F. Check-ins, nutrition and progress** → `/features/coaching` — Eyebrow `COACHING`
  - H2: **Review check-ins in minutes, not evenings.**
  - Body: Adherence, sleep, stress, training, nutrition, measurements and progress photos — surfaced in a single review screen with an AI summary you can edit.
  - Bullets: Weekly check-in reviews · Nutrition targets and tracking · Progress metrics and photos · AI-drafted coach responses
  - Placeholder: `Check-in review mockup — screenshot coming`

- **G. Client portal** → `/features/coaching` — Eyebrow `COACHING`
  - H2: **Give every client a properly professional experience.**
  - Body: Clients get their own portal — programme, check-ins, nutrition, bookings, payments and messages — branded around you, not a third-party app.
  - Bullets: Personal client dashboard · Assigned programme and today's session · One-tap check-in submission · Payment and booking history
  - Placeholder: `Client portal mockup — screenshot coming`

- **H. REPs AI Operating System** → `/features/ai` — Eyebrow `REPS AI`
  - H2: **AI that tells you what to do next.**
  - Body: Not a chatbot bolted on the side. REPs AI runs across programmes, check-ins, leads, client risk and weekly growth — so your next move is always obvious.
  - Bullets: AI Programme Writer · AI Check-in Summariser · AI Lead Scoring · AI Client Risk Alerts · Weekly Next Move growth cards
  - Placeholder: `AI Business Command Centre mockup — screenshot coming`

- **I. Growth and business insights** → `/features/growth` — Eyebrow `GROWTH`
  - H2: **See what's working. See where to grow next.**
  - Body: Revenue, retention, enquiries, profile performance and adherence trends — with weekly prompts on what to act on first.
  - Bullets: Revenue and retention insights · Profile and lead analytics · Client adherence trends · Content Studio and growth prompts
  - Placeholder: `Insights + growth mockup — screenshot coming`

Wrapper: `space-y-20 lg:space-y-28` inside the existing Act 2 `<section>`, after `ReplacesStrip`. Existing hero, press strip, Act 1, pricing preview, final CTA and sticky CTA stay.

## 2. Tighten the AI layer band

Keep "The AI layer behind your fitness business" section but reduce overlap with section H. Slim the intro to one line ("Six places REPs AI shows up across your day.") and ensure the cards are exactly six: **Programmes · Check-ins · Leads · Next Move · Risk · Content**. Trim if there are currently more.

## 3. Pricing preview audit

Page already uses `PLANS` (Verified / Pro / Studio — correct). Verify on this route:
- Only Verified, Pro, Studio render (no Free Profile card).
- No instances of "15%", "booking fee", "booking commission", "one flat plan", "flat plan", "Stripe included".
- Remove any found.

## 4. Final CTA

**Untouched.** No copy or button changes.

## Out of scope

- New mock-up components (`ProfileMockup`, `LeadsMockup`, etc.) — keep placeholders only this pass.
- Hero background legibility fix.
- `/features/*` pages.
- Any data/auth/DB work.

## Files touched

- `src/routes/for-professionals.tsx` — only file. Swap 5-block loop for 9-block `SECTION_BLOCKS`; tighten AI band cards; verify pricing preview clean.

## Compliance

- Brand orange via `text-reps-orange` tokens only.
- Radii: cards `rounded-[18px]`, buttons `rounded-[10px]` — already in `ProductBlock`.
- No banned radii / phrases introduced. Always "REPs".
