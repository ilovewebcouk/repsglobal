## What's wrong right now

1. **Uneven Act 2 columns** — `ProductBlock` uses `lg:grid-cols-[1.25fr_1fr]`, so the image side is wider than the text side. Fix to a true 50/50 grid (`lg:grid-cols-2`) with consistent gutter, so every block reads as a clean two-column pairing.
2. **Act 2 is too thin** — only 3 product blocks (Bookings, Clients/Programmes/Check-ins lumped, Portal/Messaging lumped). The actual product surface in `src/routes/dashboard_.*` is much bigger: Leads, Bookings, Calendar, Payments, Clients (CRM), Programs, **Nutrition**, **Check-ins**, Messages, Reviews, **CPD**, **Community**, **Content**, **Reports/Business (AI)**. The page hides the breadth.
3. **AI is buried** — the +24% block is fine but doesn't say what the AI actually *does*: writes programmes, drafts nutrition plans, summarises check-ins, prioritises leads, surfaces at-risk clients, writes follow-ups. That's the moat versus Trainerize/MyPTHub/PT Distinction.
4. **"One app replaces X" story missing** — nothing visually says REPs replaces Trainerize + Calendly + Stripe + MyFitnessPal + Mailchimp + a CRM. That's the punchline.
5. **Competitor table is too narrow** — 8 rows, mostly about the directory. Needs rows for AI programme builder, AI nutrition, AI check-in summaries, automated follow-ups, nutrition tracking, CPD/insurance, community, content scheduling — the things competitors literally don't have.

## The plan

### A. Fix the column rhythm (small, mechanical)

- `src/components/marketing/ProductBlock.tsx`: change grid to `lg:grid-cols-2` with `lg:gap-12`. Keep alternating reverse. Make `ctaSlug` optional (`ctaSlug?:`) so blocks that don't map to an existing `/features/$slug` page can still render without a broken link — render the link only when `ctaSlug` is provided.

### B. Expand Act 2 into a proper product tour

Replace the 3 ProductBlocks with a richer sequence that mirrors the full dashboard surface. Each is the same overline → H2 → 1 paragraph → 3-4 bullets → optional deep-dive link pattern the user likes:

1. **Lead pipeline** — every enquiry from your profile, Instagram, website lands in one pipeline; AI scores and replies first-draft. *→ /features/leads*
2. **Bookings, calendar & payments** — deposits, Stripe payouts, recurring memberships, two-way calendar sync. Replaces Calendly + Stripe + invoicing. *→ /features/bookings*
3. **Clients CRM** — one record per client: sessions, notes, payments, programmes, photos, messages, on one timeline. *→ /features/clients*
4. **AI Programme Builder** — describe the client and AI drafts a 12-week programme with video demos; you tweak and publish. Trainerize makes you build it block by block. *→ /features/programmes*
5. **Nutrition planning (MyFitnessPal, replaced)** — built-in food database, macro targets, AI meal plans, client logging from the portal. Kills the MyFitnessPal handoff. *(new block, no deep-dive link)*
6. **Check-ins & progress** — weekly forms, photos, measurements, AI summary card: "Maya is plateauing — drop volume 10%, push protein." *→ /features/check-ins*
7. **Messaging & autopilot follow-ups** — focused inbox separate from your phone, AI drafts replies, automated win-back/check-in nudges; quiet hours that actually stick. *→ /features/messaging*
8. **Insights & the Monday move** — revenue, retention, churn risk, the single highest-leverage action this week. *→ /features/insights*

These are the spine of Act 2. Each is a real block (not a feature grid card), full width with alternating image side, even 50/50 columns.

### C. New "One app, six tools retired" strip

A single horizontal section between Act 2 intro and the deep dives. Wordmark-style chips with strike-throughs:

```text
REPs replaces: Trainerize · Calendly · Stripe Billing · MyFitnessPal · Mailchimp · a CRM
```

Editorial, dark panel, brand-orange accent on "REPs replaces". Gives the eye a beat and primes the deep dives.

### D. Lift the AI block out of the +24% panel

Promote AI to its own headline section after the deep dives (before the competitor table):

- Eyebrow: **AI · Your business on autopilot**
- H2: **An AI coach for your coaching business.**
- 6 capability tiles (icon + 1-line each):
  - AI programme writer
  - AI nutrition planner
  - AI check-in summariser
  - AI lead prioritiser & first-draft reply
  - AI client risk alerts
  - AI Monday "next move" card
- Keep the +24% revenue stat + Marcus quote as the supporting proof column on the right.

### E. Beef up `CompetitorCompare`

Keep the 4-column layout (REPs / Trainerize / MyPTHub / PT Distinction). Expand rows from 8 to ~16, grouped under three subheads — **Get clients**, **Run your practice**, **Grow with AI** — so the table tells the same Act 1 / Act 2 / Growth story. New rows:

- Get clients: public directory, industry credential, verified qualifications & insurance, CPD on profile, reviews on public record
- Run your practice: bookings & Stripe, programme builder + video library, **nutrition planning**, weekly check-ins with photos, branded client portal, focused inbox + quiet hours, automated follow-ups
- Grow with AI: AI programme writer, AI nutrition planner, AI check-in summariser, AI lead reply, AI "next move" card

Trainerize/MyPTHub/PT Distinction get honest assessments — most cells are "—" or "Partial" on the AI rows, because none of them ship this. That's the point.

### F. Keep everything else as-is

Hero, press strip, two-act intro cards, register proof, earnings calculator, testimonials, pricing, founding banner, FAQ — untouched in this pass. We've already iterated those.

## Files touched

- `src/components/marketing/ProductBlock.tsx` — even 50/50 grid; make `ctaSlug` optional; render link conditionally.
- `src/components/marketing/CompetitorCompare.tsx` — expand rows, add grouped subheads.
- `src/components/marketing/ReplacesStrip.tsx` *(new, small)* — the "REPs replaces" line.
- `src/components/marketing/AICapabilities.tsx` *(new)* — the AI section with 6 tiles + +24% proof.
- `src/routes/for-professionals.tsx` — replace the 3 ProductBlocks with the 8 above, drop the standalone +24% growth section (folds into AICapabilities), insert ReplacesStrip between the Act 2 intro and the deep dives.

## Scope guardrail

Phase 1, presentation only. No new routes, no new feature pages, no AI APIs wired — every claim is descriptive marketing copy on the static page. The two "no deep-dive link" blocks (Nutrition, Replaces strip) deliberately don't link out yet because there's no `/features/nutrition` page; we can add one in a later pass if you want.