# Pricing page rebuild: 6-tier model + feature comparison

Replace the current Foundation/Pro/Elite cards with the new 6-tier REPs model, lead with Founding pricing, and add a feature comparison table for the 4 paid solo/coach tiers.

All work happens in `src/routes/pricing.tsx`. No backend, no Stripe, no DB — Phase 1 visual only.

## Page structure (top to bottom)

1. **Hero** — unchanged copy, but subhead nods to "Free to list. Verified to be trusted. Pro to run your business."
2. **Founding banner** — slim strip above the cards: "Founding member pricing — limited spots. Lock in £29/mo Pro or £59/mo Business before public launch." Subtle orange accent, dismissable visually but not functional.
3. **Plan cards (4)** — Free Profile, Verified, Pro, Business. Pro is the highlighted "Most popular" card.
4. **Teams & organisations strip** — full-width horizontal panel below the cards, two columns: Studio (£149/mo) and Enterprise (Custom). Visually distinct from the 4 cards — single panel, side-by-side, smaller pricing treatment, clear "for teams" framing.
5. **Comparison table** — Verified / Pro / Business / Studio across the top. Free and Enterprise excluded by design. Desktop = 5-column table (feature + 4 tiers). Mobile = sticky tier selector + 2-column view (decision from previous turn).
6. **"Why REPs is priced this way" trust block** — 3 short cards: Visibility (Free), Trust (Verified), Operating system (Pro+). Explains the ladder so people don't see it as a paywall.
7. **FAQ** — existing FAQ section, refreshed for the new tiers.

## Plan card content (the 4 cards)

**Free Profile — £0**
- Subhead: "Get listed. Get found."
- Features: Basic public profile, Claim flow, Category & location listing, Unverified status badge
- CTA: "Create free profile" → /signup

**Verified — £99/year (or £12/mo)**
- Subhead: "Monetise your professional trust."
- Features: Verified badge, Credentials displayed, Reviews enabled, Enhanced directory profile, Enquiries inbox
- CTA: "Get verified" → /signup
- Price display: "£99/year" as primary, "or £12/mo" as secondary

**Pro — £29/mo** ⭐ Most popular (Founding price)
- Strikethrough £39, headline £29, "Founding price — limited" pill in orange
- Subhead: "Run your full coaching practice."
- Features: Everything in Verified, Leads CRM, Client management, Bookings & calendar, Programmes, Basic nutrition, Check-ins, Messaging inbox
- CTA: "Start Founding Pro" → /signup

**Business — £59/mo** (Founding price)
- Strikethrough £79, headline £59, "Founding price — limited" pill
- Subhead: "Scale online and hybrid coaching."
- Features: Everything in Pro, AI insights, Advanced check-ins, Automations, Content studio, Enhanced directory placement
- CTA: "Start Founding Business" → /signup

## Teams & organisations strip

Single `rounded-[22px] border border-reps-border bg-reps-panel` panel, split 50/50:

- **Studio — £149/mo** — "Teams, gyms, multi-coach businesses." Features inline: Multi-coach roles, Organisation profile, Shared clients, Locations, Reporting. CTA: "Talk to sales" → /contact
- **Enterprise — Custom** — "Chains, education providers, associations." Features inline: Bulk verification, API, Migration, SSO, Custom onboarding, SLAs. CTA: "Contact us" → /contact

Visual divider between the two halves. No "most popular" treatment — utilitarian, business-buyer tone.

## Comparison table

Same mechanics as agreed in the previous turn (grouped rows, desktop 5-col table, mobile sticky tier selector defaulting to Pro), but with new columns and rows reflecting the new tier model.

**Columns:** Verified · Pro · Business · Studio

**Groups & rows** (values: ✓, —, or short text)

**Profile & visibility**
- Public directory listing — ✓ / ✓ / ✓ / ✓
- Verified badge — ✓ / ✓ / ✓ / ✓
- Enhanced directory placement — — / — / ✓ / ✓
- Organisation profile — — / — / — / ✓
- Multiple locations — — / — / — / ✓

**Clients & enquiries**
- Reviews — ✓ / ✓ / ✓ / ✓
- Enquiries inbox — ✓ / ✓ / ✓ / ✓
- Leads CRM — — / ✓ / ✓ / ✓
- Client management — — / ✓ / ✓ / ✓
- Shared clients across coaches — — / — / — / ✓

**Coaching delivery**
- Bookings & calendar — — / ✓ / ✓ / ✓
- Programmes — — / ✓ / ✓ / ✓
- Basic nutrition — — / ✓ / ✓ / ✓
- Check-ins — — / Basic / Advanced / Advanced
- Messaging inbox — — / ✓ / ✓ / ✓

**Growth & automation**
- Content studio — — / — / ✓ / ✓
- Automations — — / — / ✓ / ✓
- AI insights — — / — / ✓ / ✓

**Teams & operations**
- Multi-coach roles — — / — / — / ✓
- Reporting — — / — / — / ✓
- Coach seats included — — / 1 / 1 / 5

**Support**
- Verification speed — Standard / Priority / Priority / Priority
- Account manager — — / — / — / ✓

Below the table: a single muted line — "Need API, SSO, bulk verification or migration? See Enterprise →" linking to /contact.

## "Why REPs is priced this way" trust block

Three 18px cards side-by-side, explaining the ladder:

- **Visibility — Free.** "Every professional gets a free, claimable profile so clients can find you."
- **Trust — Verified.** "Pay once to prove your credentials and unlock reviews and enquiries."
- **Operating system — Pro & up.** "Run bookings, clients, programmes and growth tools in one place."

Helps prevent "why is it free if real value starts at £29?" objections.

## FAQ updates

Refresh the existing FAQ entries for the new model:
- "Is REPs really free to join?" — keep, mention Free Profile vs Verified distinction.
- "How does verification work?" — keep.
- "What does REPs take per booking?" — keep, confirm 15% on bookings made through the platform on Pro+.
- "Can I cancel anytime?" — keep.
- New: "What's the difference between Verified and Pro?" — short answer: Verified is trust + visibility; Pro adds the operating system to actually run your practice.
- New: "Will founding pricing stay forever?" — short answer: yes, locked for the lifetime of the subscription, but only available before public launch.

## Visual / token rules

- All cards use existing tokens: `bg-reps-panel`, `border-reps-border`, `text-reps-orange`, `bg-reps-orange-soft`.
- Cards: 22px radius (large panel). Inside chips/pills: full radius. Buttons: 10px. Strict adherence to the locked radius system.
- Founding price pill: `bg-reps-orange/15 text-reps-orange border border-reps-orange/30 rounded-full px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider`.
- Struck-through standard price: smaller, `text-white/40 line-through` next to the headline price.
- Pro card keeps the existing "Most popular" border-2 + orange-border treatment.
- Teams strip: same panel treatment but no "most popular" glow; clearly secondary in hierarchy.
- Mobile sticky selector for the comparison table: `sticky top-[64px] z-20 lg:hidden`, pill toggle, active = `bg-reps-orange text-white`.

## Implementation notes (technical)

- Single file change: `src/routes/pricing.tsx`. Rewrite the PLANS array and FAQ array; add three new sections (Founding banner, Teams strip, Comparison table, Trust block).
- Extract the comparison table to `src/components/pricing/FeatureComparison.tsx` if `pricing.tsx` grows past ~400 lines; otherwise keep co-located.
- Data shape for table: `const GROUPS = [{ title, rows: [{ label, verified, pro, business, studio }] }]`, where each cell is `true | false | string`.
- Mobile tier state: `useState<'verified' | 'pro' | 'business' | 'studio'>('pro')`.
- Use semantic `<table>` for both desktop and mobile (a11y).
- No new routes, no backend, no Stripe wiring, no DB.
- Page metadata: update title/description to "Pricing — REPs · Free to list, verified to be trusted, pro to run your business" style.

## Out of scope

- No actual Stripe / Paddle integration (Phase 2).
- No signup flow changes — CTAs continue to point at `/signup` and `/contact`.
- No changes to `/for-professionals`, footer, or nav.
- No annual/monthly billing toggle on the cards (Verified is the only annual-priced tier; rest are monthly).
- No currency switcher.
