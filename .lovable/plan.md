## What went wrong

I locked the 3 service slots to fixed titles, modes, CTAs and "Most popular" — so pros could only edit price/description/bullets. You wanted the opposite: keep the editor fully free, just **show the example content as placeholder text** so an untouched profile still looks like the screenshot.

## Fix — two surgical reverts, no UI/UX changes

### 1. `src/routes/_authenticated/_professional/dashboard_.shop-front.tsx` — un-lock the editor

- `emptyDraft()`: return a blank draft (`title: ""`, `description: ""`, `bullets: ["","","","",""]`, `mode: "in_person"`, `is_featured: false`, no locked CTA/unit). Stop pre-filling DB values from `SERVICE_PLACEHOLDERS`.
- `startEdit()`: load the row's actual values back (title, mode, cta_label, price_unit, is_featured, bullets) — no slot override.
- `submit()`: save exactly what's in the draft. Remove the slot-locked overwrite of title/mode/cta_label/price_unit/is_featured.
- Restore the editor dialog inputs that were stripped:
  - Title input (with `placeholder={SERVICE_PLACEHOLDERS[slot].title}`)
  - Mode select (Remote / Hybrid / Hands-on)
  - CTA label input (with placeholder)
  - Price unit select (full `PRICE_UNIT_OPTIONS`)
  - "Most popular" checkbox
- Remove the "locked slot summary" strip and the "title/delivery mode/button are fixed" copy from `DialogDescription`.
- In the list-row preview, keep the placeholder text fallback only when the service is empty (`!s`). When a service exists, render its real `title` / `price_label` / `mode` / `description` — never override with placeholder.

### 2. `src/routes/c.$slug.tsx` — placeholder rendering on the public page

So a brand-new website (no services configured yet) shows the screenshot's example trio instead of an empty Services section:

- In `mergeLiveIntoCoach`, if `services.length === 0`, return 3 placeholder `Tier` objects matching the screenshot exactly:
  1. **Online Coaching** — Remote · £160 / month · "For people who train themselves but want a coach in their corner." · 5 bullets · CTA "Enquire about Online Coaching"
  2. **Hybrid Coaching** — Hybrid · £240 / month · `highlight: true` (Most popular) · CTA "Start with Hybrid" · 5 bullets
  3. **1-to-1 In Person** — Hands-on · "From £75" / session · CTA "Enquire about 1-to-1 In Person" · 5 bullets
- These are display-only placeholders, never written to the DB. As soon as the pro adds a real service, the placeholders disappear.

### Out of scope

- No visual or layout changes to the service cards, the editor dialog shell, or the public page.
- No DB migration. No changes to `shop-front.functions.ts`.

## Result

- Brand-new pros see the polished example page exactly like your screenshot, with nothing entered.
- Pros can edit title, mode, CTA, price unit and "Most popular" freely — placeholders just hint at the example wording.
