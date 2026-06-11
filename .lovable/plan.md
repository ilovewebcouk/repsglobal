# /contact QA Pass — pre-lock checklist

A focused QA sweep so we can confidently lock `/contact` into memory. Two parts: **visual sweep at three breakpoints**, then a **code/compliance audit**.

## 1. Visual sweep (browser, full-page screenshots)

For each breakpoint, capture full-page screenshot + zoom into hot spots and check the list below.

**Breakpoints:**
- Mobile — 390×844
- Tablet — 820×1180
- Desktop — 1440×900

**Per-section checks:**

| Section | What I'm looking for |
|---|---|
| Hero | Status card stacks under copy on mobile/tablet, sits right on desktop. H1 doesn't orphan "register." awkwardly. "Looking for a coach?" deflection link is visible but quiet. Trust chips wrap cleanly. |
| Form tabs | 2-tab grid is full width on mobile (stacked), 2-col on sm+. Active state readable. No overflow. |
| Form fields | Pro tab: Profession + Mobile row → stack on mobile. ToggleGroup wraps to 2 rows on mobile without clipping. Conditional "REPs profile URL" field appears only when "Already verified" is picked and doesn't break the grid. Partner tab: Organisation/type, Website/Phone rows stack on mobile. Reason select full width. |
| Reply ETA chip + Send button | Bottom row reverses on mobile (button on top, chip under) per `flex-col-reverse sm:flex-row` — confirm chip + button both legible. |
| Quick answers (3 cards) | Single column on mobile, 3-col on md+. Card heights even. Arrow nudges on hover. The 3rd card uses `<a href>` (not `<Link>`) for `/for-training-providers` — confirm it still renders identically. |
| Direct channels list | 3-col grid `[200px_1fr_auto]` collapses to stacked rows on mobile. Email link wraps cleanly. |
| Safeguarding Alert | Icon + copy stack vertically on mobile, button full-width-ish; horizontal on sm+. Emerald tokens correct. |
| FAQ | Accordion behaves, no layout shift on expand. |
| FinalCta | Primary/secondary buttons stack on mobile. |

## 2. Code / compliance audit (read-only)

- **Radii** — confirm only the locked scale (10/12/16/18/22/24, plus pills). Spot-check `rounded-[N]` usage; no `rounded-xl/2xl/3xl`, no 14/20/28/32.
- **Colors** — no hardcoded hex in `contact.tsx`, `ContactForm.tsx`, `StatusCard.tsx`. Emerald used only for status (safeguarding alert + status dot + submitted success Alert).
- **Marketing primitives** — `MarketingHeroEyebrow`, `SectionHeader`, `MarketingFaq`, `FinalCta` all in use (✓ already).
- **Vertical rhythm** — every section uses `py-20 lg:py-28` (or hero `pt-24 pb-20 lg:pt-28 lg:pb-24`). No `py-24 lg:py-28`.
- **Dividers** — confirm no `border-y border-reps-border` between sections; alternating `bg-reps-panel/15` ↔ `/30` only. *Note: the channels list uses `divide-y divide-reps-border` internally for row separation — that's intra-card, not section divider, so it's allowed.*
- **No "UK" qualifier** anywhere in copy. (Emails are `@repsuk.org` — that's the domain, not body copy, allowed.)
- **Banned phrases** — no "booking fee", "commission", "flat plan", "CIMSPA". ✓ scanned mentally but will rg.
- **Tier ladder** — Verified £99/yr referenced ✓, Pro/Studio mentioned, no retired free/£29 tier.
- **shadcn skill** — Tabs/Select/ToggleGroup/Textarea/Input/Label/Alert all in use. Honeypot present. *Possible upgrade noted, not blocking lock: migrate form layout from custom `FieldShell` to shadcn `FieldGroup`/`Field` primitives per skill rules — flag for follow-up only if user wants strict compliance now.*
- **Run the bundled audit script** `knowledge://skill/reps-build-compliance/scripts/audit.sh` — must exit 0.

## 3. Likely fixes I'm budgeting for (won't redesign, just polish)

- ToggleGroup row on the Pro tab may wrap awkwardly at 390px — may need `text-[12.5px]` or shorter label on the longest item ("Already verified, need help").
- Status card on tablet portrait may sit too tall next to the hero copy — check stacking trigger.
- Quick-answers cards may have uneven heights if copy lengths differ — flex-grow on the body paragraph may be needed.
- "Looking for a coach?" link contrast at `text-white/55` — verify it's discoverable without competing with primary CTAs.

## 4. After QA passes

Save a `mem://design/locked-contact` memory describing:
- B2B-only purpose (no Client tab, no public lookup form)
- 2 tabs: Professional (default) + Training provider/partner
- Section order, status card content, 3 emails (`pros@`, `partners@`, `press@repsuk.org`)
- Radius map, locked vertical rhythm, no dividers
- The `/for-training-providers` route still being a stub `<a href>` (Phase 1 limitation)

Then update `mem://index.md` Core to add `/contact` to the locked-pages list.

## Out of scope for this pass

- Real form submit / backend
- Building `/for-training-providers` and `/safeguarding` route bodies
- Live status data wiring
- Migrating form to shadcn `FieldGroup`/`Field` (noted as follow-up)

---

**Deliverable:** screenshots at 3 breakpoints, audit script result, list of any fixes applied, then save the lock memory.