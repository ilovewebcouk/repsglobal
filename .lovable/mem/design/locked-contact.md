---
name: Locked /contact
description: B2B contact page frozen 2026-06-11 — Professional + Training-provider only, 2-tab form, 3 emails, no Client tab, no public-lookup form. Status card, deflection grid, safeguarding alert, FAQ, FinalCta.
type: design
---

# Locked /contact — Frozen 2026-06-11

`/contact` is a **B2B-only** page. No Client tab. No public coach-lookup form. Visitors looking for a coach get a single quiet deflection link (`"Looking for a coach? Search the register →"`) under the hero trust chips; everything else is for professionals and training providers / partners.

Do not redesign without an explicit, section-named request.

## Section order (LOCKED)

1. **Hero** — `MarketingHeroEyebrow` ("Contact") → H1 "Talk to the team behind the register." (orange "register.") → 16px lede → 2 trust chips (Named humans / Routed to the right team) → quiet `<Link>` deflection to `/find-a-professional`. Right column: `StatusCard`. Stacks single-column below `lg`. Hero rhythm `pt-24 pb-20 lg:pt-28 lg:pb-24`.
2. **Form** (`bg-reps-panel/15`) — `SectionHeader` centred ("Two audiences. One form. Routed properly.") + `ContactForm`.
3. **Quick answers** — `SectionHeader` ("Most pros and providers are asking…") + 3-card grid: Get verified → `/for-professionals`, Compare Pro vs Studio → `/pricing`, For training providers → `<a href="/for-training-providers">` (stub link — route doesn't exist yet, Phase 1 limitation).
4. **Direct channels** (`bg-reps-panel/30`) — `SectionHeader` + 3-row list inside `rounded-[18px]` panel using `divide-y divide-reps-border` (intra-card, allowed). Trailing line with `Handshake` icon: "REPs is a remote-first global team — every message is read by a named person."
5. **Safeguarding** — emerald `Alert` linking to `/complaints`.
6. **FAQ** (`bg-reps-panel/15`) — `MarketingFaq` with 5 B2B items.
7. **FinalCta** — "Ready to join the register?" → primary `/for-professionals` ("Get verified — £99/yr"), secondary `/pricing` ("Compare Pro & Studio"). `eyebrow={null}`.

## Form contract (LOCKED)

`src/components/contact/ContactForm.tsx` — 2 tabs only:

- **`pro`** (default) — Full name, Work email, Profession (Select: PT/S&C/Group/Online/Nutritionist/Yoga/Pilates/Other), Mobile (optional), Journey ToggleGroup (Just exploring / Ready to verify / Already verified, need help / Considering Pro or Studio), Reason Select, conditional **REPs profile URL** (only when "Already verified, need help"), Message, ETA chip + "Send message".
- **`partner`** — Full name, Work email, Organisation, Org type (Awarding body / Course provider / Education partner / Insurer / Media-Press / Other), Website, Phone (optional), Reason Select, Brief, ETA chip + "Send to partnerships".

Honeypot present (`name="company"` hidden + `tabIndex={-1}`). Phase 1 = static submit (sets `submitted=true`, shows emerald success Alert).

## StatusCard contract (LOCKED)

`src/components/contact/StatusCard.tsx` — 3 rows, B2B copy:
- ShieldCheck → "Helping pros get verified" / "Evidence reviewed in order, weekdays"
- Clock → "Pro questions: ~2hr reply" / "Mon–Fri, 9–6 GMT"
- Briefcase → "Partnerships: same-day acknowledgement" / "Training providers, awarding bodies, press"

Emerald pulse dot + "RIGHT NOW" label. `rounded-[22px]`, `border-reps-border`, `bg-reps-panel/80`.

## Emails (LOCKED)

- `pros@repsuk.org` — Professional support (verification, billing, profile, shop-front)
- `partners@repsuk.org` — Partnerships (training providers, awarding bodies, integrations)
- `press@repsuk.org` — Press & media

No `support@`, no phone numbers, no addresses.

## Radius map (LOCKED for this page)

- Hero panel-less (no card around hero text)
- Status card: 22
- Form panel: 22
- Form inputs / textarea / select: 12
- Send button / tier toggles / safeguarding CTA / icon tiles: 10
- Quick-answer cards: 16
- Channels panel: 18
- Status-card row icon tiles: 10

## Compliance notes

- No hardcoded hex; brand orange via semantic tokens (`bg-reps-orange`, `text-reps-orange`, `bg-reps-orange-soft`).
- Emerald used **only** for status semantics: status dot, success Alert, safeguarding Alert.
- No `border-y` / hairline dividers between sections — rhythm via alternating panel tints only.
- All marketing primitives in use: `MarketingHeroEyebrow`, `SectionHeader`, `MarketingFaq`, `FinalCta`.
- Indexable (no `robots: noindex`).

## Out of scope

- Real form submit (Phase 1 static)
- `/for-training-providers` and `/safeguarding` route bodies
- Live status data
- Migrating form to shadcn `FieldGroup`/`Field` primitives (custom `FieldShell` is fine for Phase 1; flagged as polish follow-up)
