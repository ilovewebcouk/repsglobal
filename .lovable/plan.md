
# v2 polish & conversion pass

Scope: `/for-professionals-v2` only. UI/presentation, no backend or business logic. All mock-ups stay static React/Tailwind (no raster product UI).

## 1. Section rhythm & breathing room

Goal: feel more premium without adding meaningful length.

In `src/routes/for-professionals-v2.tsx`, normalise vertical rhythm by bumping section padding one step at the major transitions, and adding subtle dividers / soft gradient washes between alternating bands so they stop feeling stacked.

- Standardise large sections to `py-24 lg:py-28` (currently mix of `py-16`, `py-20`).
- Tighten micro-spacing inside sections that already feel airy (intro `mb-10` → `mb-8` where the eyebrow + h2 + lede group sits above a component) so the extra outer space reads as breathing, not bloat.
- Add a thin `<SectionDivider />` (8px tall radial fade, reusable) between: Register proof → Visibility, Pillars strip → Pillar 1, Comparison → Triad testimonials, Week-with-REPs → FAQ, FAQ → Final CTA.
- Final CTA card gets a touch more internal padding (`p-12 lg:p-20`) and the section above it gets a subtle bottom fade so the CTA lands as a hero moment.

Out of scope: changing hero, press strip, or sticky pill.

## 2. Make mock-ups feel like premium product previews

Increase visual weight where the device frames are currently floating small inside a wide column.

- **Hero device cluster** (`HeroDeviceCluster.tsx`): give the laptop a soft glow halo + drop shadow plate behind it; nudge the phone slightly larger (max-w 220px) and add a subtle ring so it reads as a second device, not a sticker. Add an aria-hidden gradient backdrop card.
- **ProductBlock** (laptop variant): wrap the `DeviceMockup` in a "stage" — rounded panel (`bg-reps-panel/40` + `ring-1 ring-reps-border` + `shadow-[0_40px_80px_-40px_rgba(0,0,0,0.6)]` + inner orange radial glow). This applies to Profile, Leads, Bookings mock-ups.
- **ProductBlock (phone)**: same stage treatment, bump phone max-w from 220 → 240 and centre with a soft floor shadow so the Client Portal mock-up holds the column.
- **PillarTabs** mock-ups (Programmes / Check-ins / Client record): same stage wrapper so all three coaching previews match the rest.
- **AI Command Centre mock**: increase the Next Move card padding, raise the orange glow opacity slightly, and add a faint "OS chrome" header strip (dot + "REPs AI · Live") above the stack so it reads as a product surface, not three loose cards.

No new screens or new mocks — purely framing/lighting around what's there.

## 3. New "Built for every serious fitness professional" section

New component `src/components/marketing/UseCaseTriad.tsx`. Three cards in a `md:grid-cols-3` grid, matching the existing card language (`rounded-[18px]`, `border-reps-border`, `bg-reps-panel/60`).

Each card: small icon (User, Wifi/Laptop, Building2), eyebrow ("Solo PT" / "Online coach" / "Studio or gym"), short headline, body copy, 3 short proof bullets.

Copy:

- **Solo PT** — "Get found, manage leads, book sessions, track payments and deliver coaching without juggling five different tools."
- **Online coach** — "Run programmes, check-ins, nutrition, progress tracking and client communication from one connected platform."
- **Studio or gym** — "Manage your team, your bookings, your members and your revenue in one place — with a verified public profile for every coach on your roster."

Heading: **Built for every serious fitness professional.**
Eyebrow: "Who it's for"

Placement: inserted **before** the AI operating system section in `for-professionals-v2.tsx`, between the Comparison/Triad block and the AI hero. This gives a "who → why one platform → how AI runs it" arc.

## 4. Tighten "Coaches who replaced the stack"

Currently the `TestimonialTriad` section header reads "Coaches who replaced the stack" with no proof of *what* gets replaced. We replace the section header block (not the testimonial cards themselves) with a `ReplacedStackBoard` component that sits **above** the triad.

`src/components/marketing/ReplacedStackBoard.tsx`:

- Headline: **"Replace the scattered stack with one connected platform for visibility, operations, coaching and growth."**
- Sub-line: "One login. One bill. One record per client."
- Visual: two-column "before vs after" board.
  - Left column "Before — your current stack": a 4×2 grid of pill chips, each pill = small mono-style logo or wordmark + tool name + the job it does, struck-through. Tools:
    - Trainerize (programmes)
    - Calendly (bookings)
    - Stripe Checkout (payments)
    - Mailchimp (email)
    - Google Sheets (CRM)
    - WhatsApp (client comms)
    - MyFitnessPal-style apps (nutrition)
    - Manual check-in forms
  - Right column "After — REPs": a single tall card showing one connected stack (Directory · CRM · Calendar · Payments · Programme builder · Check-ins · Messaging · Content · Client portal · AI assistant) listed as a clean vertical with check icons and a REPs wordmark header.
- Logos: use the three existing SVG assets (`trainerize`, `mypthub` repurposed where needed, `pt-distinction`). For tools without an existing logo asset (Calendly, Stripe, Mailchimp, Google Sheets, WhatsApp, MyFitnessPal), render the tool name in a neutral mono wordmark style (no scraped/branded SVGs) to stay safe on trademark — these are wordmark pills, not third-party logos. Existing three logos render as `<img>`.
- Retire the now-redundant `ReplacesStrip` section header inside the "Act 2 · Run your practice" block? **No** — keep `ReplacesStrip` (it's a tight one-liner). The new `ReplacedStackBoard` is the heavier proof piece and lives in the testimonial section, replacing only its current header copy.

The existing `TestimonialTriad` (now with real headshots) stays directly below, intro changed to: eyebrow "Loved by working pros", h3 dropped (the board above is the section heading).

## File changes

Edited:
- `src/routes/for-professionals-v2.tsx` — section padding pass, insert `<UseCaseTriad />`, swap testimonial section header for `<ReplacedStackBoard />`, drop redundant h2 from triad block.
- `src/components/marketing/HeroDeviceCluster.tsx` — glow plate + larger phone.
- `src/components/marketing/ProductBlock.tsx` — stage wrapper around DeviceMockup (laptop + phone).
- `src/components/marketing/PillarTabs.tsx` — same stage wrapper.
- `src/components/marketing/AiCommandCentreMock.tsx` — OS chrome strip + tighter glow.

Created:
- `src/components/marketing/SectionDivider.tsx`
- `src/components/marketing/MockupStage.tsx` (shared wrapper for device frames)
- `src/components/marketing/UseCaseTriad.tsx`
- `src/components/marketing/ReplacedStackBoard.tsx`

Untouched: v1 page, /compare, hero copy, pricing, FAQ copy, backend.

## Technical notes

- All new colors via existing tokens (`reps-orange`, `reps-orange-soft`, `reps-border`, `reps-panel`, `reps-ink`). No raw hex.
- Radii follow locked system: cards `rounded-[18px]`, large stages `rounded-[22px]`, hero stage `rounded-[24px]`, pills `rounded-full`. No 20/28/32 or `rounded-xl/2xl/3xl`.
- `MockupStage` is a presentational wrapper that doesn't change the iframe scale logic in `DeviceMockup` — it adds an outer panel + glow only.
- Wordmark pills in `ReplacedStackBoard` are styled text (not scraped logos) to avoid trademark issues; existing approved SVG assets (Trainerize, MyPTHub, PT Distinction) render where we already have them.
- No copy claims about specific commission/fees beyond what's already on the page.
