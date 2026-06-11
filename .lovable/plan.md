
# /contact — full rebuild

Replace the current generic SaaS contact page (fake offices, hand-rolled inputs, 3-icon email grid) with a single-purpose, audience-aware page that does one job extremely well: get the right message into the right inbox with zero anxiety about whether anyone's listening.

Phase 1 = static only. No backend submit yet (form posts a fake success state via local React state). No new routes. shadcn-only primitives.

## Page structure (top → bottom)

1. **Hero**
   - Left (copy): `MarketingHeroEyebrow` ("Contact") → H1 **"Talk to a human."** → 16px lede: "Most messages get a reply the same working day. Pick what fits — we'll route it to the person who actually owns it."
   - Right: **"Right now" status card** — soft panel, emerald status dot, three rows:
     - *Replying to messages from earlier today*
     - *Typical reply time: ~4 hours* (Mon–Fri, 9–6 GMT)
     - *Currently online: REPs support team*
     Static copy in Phase 1, designed so it can later be wired to real data.
   - `HeroOverlay copySide="left"`. No hero photograph.
   - Locked vertical rhythm: `pt-24 pb-20 lg:pt-28 lg:pb-24`.

2. **Audience switcher + smart form** (`bg-reps-panel/15`, `py-20 lg:py-28`)
   Single shadcn `Tabs` component, full-width segmented control, three tabs:
   - **I'm looking for a coach** (default)
   - **I'm a professional**
   - **Press, partnerships or enterprise**

   The form re-uses one shared `FieldGroup` layout but the visible fields swap per tab:

   | Tab | Fields |
   |---|---|
   | Client | Full name · Email · City (Input) · What you're looking for (Select: PT / Online coaching / Nutrition / Group / Yoga / Other) · Message (Textarea) |
   | Professional | Full name · Email · Current tier (ToggleGroup: None yet / Verified / Pro / Studio) · REPs profile URL *(optional Input)* · Reason (Select: Verification · Profile / shop-front · Payouts · Bug · Other) · Message |
   | Press | Name · Email · Outlet / company · Deadline (Input, optional) · Reason (Select: Press enquiry · Partnership · Enterprise / multi-coach · Investor) · Brief (Textarea) |

   Below the form, a small live "Estimated reply: ~Xh" chip that updates from the Reason value (e.g. *Verification → usually <2 hours*).

   Submit = `Button` with primary orange; on click, swap to an inline `Alert` success state ("Message sent — we'll reply to {email} shortly.") — no real network call yet.

   Honeypot field (hidden) included so the future wire-up is trivial.

3. **"Before you write" deflection grid** (`bg-reps-ink`)
   `SectionHeader` eyebrow "Quick answers" / H2 "Most people are asking…".
   3-up grid of the *actual* top reasons, each a card linking to the real answer:
   - "How do I get verified?" → `/get-verified`
   - "How do I find a coach in my city?" → `/search`
   - "Is this person really REPs-registered?" → `/search`
   Cards use 16px radius, no shadow, hover lift via border colour only.

4. **Direct channels** (`bg-reps-panel/30`)
   `SectionHeader` "Prefer email?".
   Quiet 3-row list (not the 3-icon grid). Each row: role label · email · one-line scope.
   - `support@repsuk.org` — Client support · finding a pro, bookings, accounts
   - `pros@repsuk.org` — Professional support · verification, payouts, profile
   - `press@repsuk.org` — Press, partnerships & enterprise
   Footnote line: **"REPs is a remote-first global team."** No phone numbers. No addresses.

5. **Safeguarding callout** (`bg-reps-ink`)
   shadcn `Alert` (not custom div), emerald accent allowed here as status semantic.
   "Safeguarding concern about a coach or client? Use the dedicated route — it goes straight to our safeguarding lead." → button to `/safeguarding` (route may not exist yet; link is fine — TanStack typecheck note below).

6. **FAQ** (`bg-reps-panel/15`)
   `MarketingFaq`, 5 questions, audience-neutral:
   - How quickly will I hear back?
   - Can I phone REPs?
   - I'm a coach — where do I report a profile issue?
   - I'm a client — how do I report a coach?
   - Where are you based?

7. **FinalCta** — secondary in tone: heading "Prefer to browse first?" · primary button → `/search` · secondary → `/pricing`.

## Files

**Edit**
- `src/routes/contact.tsx` — full rebuild. Remove `Field`/`Select` helpers, all OFFICES/CHANNELS arrays, fake addresses and phones. Replace with the structure above using shadcn `Tabs`, `FieldGroup`, `Field`, `Input`, `Select`, `Textarea`, `ToggleGroup`, `Alert`, `Button`, `Badge`, plus shared marketing primitives (`MarketingHeroEyebrow`, `SectionHeader`, `MarketingFaq`, `FinalCta`, `HeroOverlay`).

**New**
- `src/components/contact/StatusCard.tsx` — the "Right now" hero status card (panel, emerald dot, three rows).
- `src/components/contact/ContactForm.tsx` — controlled `Tabs` + per-tab field set + inline success Alert.

No other files change. No new routes. No new images.

## Technical notes

- shadcn primitives only — no hand-rolled `<input>`/`<select>` markup. Use `FieldGroup` + `Field` + `FieldLabel`. ToggleGroup for the tier picker.
- Radii per locked system: button 10, input 12, std card 16, status / form panel 22, hero 24. No `rounded-xl/2xl/3xl`.
- Tokens only — `bg-reps-panel`, `border-reps-border`, `text-reps-orange`, etc. No raw hex.
- Section rhythm `py-20 lg:py-28`; hero `pt-24 pb-20 lg:pt-28 lg:pb-24`. No hairline dividers between sections.
- Emerald used only for the safeguarding `Alert` and the status-card dot (status semantics, per `mem://design/status-colors`).
- No "UK"/"United Kingdom" anywhere. "Mon–Fri, 9–6 GMT" is the only time-zone reference and is allowed (it's a working window, not a country claim).
- Safeguarding link: if `/safeguarding` route doesn't exist yet, render as an `<a href>` (not `<Link to>`) to avoid TanStack type errors; tracked as a follow-up to create the route.
- Honeypot input is `hidden` + `tabIndex={-1}` + `autoComplete="off"`.
- Page is indexable (no `noindex`). Update `head()` description to the new positioning.

## Out of scope (Phase 1)

- Real form submit / email infrastructure / Resend wiring.
- Live status data feeding the "Right now" card.
- Live chat widget.
- `/safeguarding` route content (link only).
- Any office address / phone number.
