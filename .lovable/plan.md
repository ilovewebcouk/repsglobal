
## QA on the editor pane

Captured the three squashed sections (`Website basics`, `Where I train`, `Client results`) at the current 1550px viewport. Root causes:

1. **Middle pane is too narrow.** Layout is now `rail 236 / center flex-1 max-w-[640px] / preview flex-1`. The preview grabs ~500px, leaving the center at ~500px minus 48px padding ≈ **452px usable**. On top of that, `max-w-[640px]` caps it further even if space were available.
2. **Every row is a 2-column split.** Sections render `[left: label + helper text] | [right: form control]`, which halves the already-narrow center to ~220px per side. That's why:
   - Tagline / Subtitle inputs clip to ~15 visible chars.
   - `In-person` / `Online` delivery cards break every word onto its own line.
   - Hero image `Upload / AI generate / Paste URL` tabs wrap to two lines each.
   - Client Results `Photo | Preview` side-by-side truncates the preview card.
3. **Duplicate section header.** The page header ("Website basics · Tagline, About and hero image") and the inner Card header ("Website basics · Shown on your public page at /c/charlotte-evans") repeat the same information — wastes ~90px of vertical space in a scrolled pane.
4. **Preview iframe is blank** (unrelated to squashing, worth confirming separately). Not in scope for this pass unless you want it bundled in.

## Fix

### A. Rebalance the shell (small)

`WebsiteEditorLayout.tsx`:
- Give the editor more room than the preview by default. Change to
  `grid-cols-[236px_minmax(520px,1.2fr)_minmax(420px,1fr)]` at `lg`, `1.4fr / 1fr` at `xl`.
- Bump the editor content max-width from `max-w-[640px]` to `max-w-[760px]` so it can breathe when the preview is collapsed.
- Remove the redundant page-header (`title` + `description`) since every section already renders its own header inside the form. Keep only a slim breadcrumb row with the collapse-preview button and a "View public" link.

### B. Convert every section to a single-column stacked form (main work)

Standard rule: **label + helper text on top, control full-width below** — the shadcn `Field` / `FieldGroup` pattern. No more left-description / right-field splits inside the editor pane.

Sections to refactor (all live inline in `dashboard_.website.tsx`, ~2.2k lines; individual editor components in `src/components/dashboard/`):

- **Website basics** (`BasicsEditor` inline block)
  - Tagline: single-line input, full-width, char counter `0/80`.
  - Subtitle: single-line input, full-width, char counter `0/120`.
  - About: `Textarea` auto-grow (min 6 rows), char counter `0/600`.
  - Hero image: `HeroImageEditor` — turn the `Upload / AI / Paste URL` tabs into a full-width `Tabs` control (shadcn), stack the drop zone underneath.
- **How I coach** — Method name, intro, three pillars — each pillar becomes a stacked `Fieldset` with title + body full-width.
- **Specialisms** (`SpecialismsDeliveryPanel`) — chip grid stays, but move the "0 / 3 selected" counter to the top-right of the section header.
- **Where I train** (`DeliveryModePanel` + inline postcode + gyms + cities)
  - Delivery cards: swap the current cramped 2-col `Card` layout for a horizontal `ToggleGroup` (`type="multiple"`) — `In-person` and `Online` as full-width toggle buttons with an inline check state, help text stacked below the group.
  - Postcode: full-width input with inline "Public location: Bridgend" as a caption underneath.
  - Trains at: full-width list with `Add gym` button at the end (existing pattern already works, just needs full width).
  - Also train from: stacked checkboxes (existing pattern, widened).
  - Cities: full-width tokenized input.
- **Client results** (`TransformationImageEditor`)
  - Stack `Photo` above `Preview` on the narrow pane (single column), promote to side-by-side only at `>= 900px` container width via a container query or a manual breakpoint on the editor pane.
  - Result headline / Client quote / Client + Role + Duration → single stacked `FieldGroup`.
- **FAQs** — each Q&A pair becomes a stacked pair (question above, answer below), delete/reorder buttons on the row's right edge.

### C. Section-header hygiene

Every editor section gets one header only:
- `SectionHeading` (h3, 15px semibold) + `SectionCaption` (12.5px white/55) — matches shadcn `FieldSet` legend/description pattern.
- Drop the outer Card wrapper so the section reads as a form group, not a boxed panel-in-a-panel.

## Technical notes

- Use shadcn primitives already in the project: `Field`, `FieldGroup`, `Fieldset`, `Label`, `Input`, `Textarea`, `ToggleGroup`, `Tabs`, `Checkbox`. Do not hand-roll.
- Char counters via a tiny local `FieldCounter` helper (`current/max`, amber at ≥90%).
- No changes to submit/save logic, validation, or the public page.
- No new deps.

## Files touched

- `src/components/dashboard/website/WebsiteEditorLayout.tsx` (shell rebalance, drop duplicate header)
- `src/routes/_authenticated/_professional/dashboard_.website.tsx` (inline `BasicsEditor`, `MethodEditor`, `ResultsEditor`, `FaqsEditor`, `LocationsEditor`)
- `src/components/dashboard/DeliveryModePanel.tsx` (ToggleGroup swap)
- `src/components/dashboard/HeroImageEditor.tsx` (Tabs full-width)
- `src/components/dashboard/TransformationImageEditor.tsx` (stacked Photo/Preview + full-width fields)
- `src/components/dashboard/SpecialismsDeliveryPanel.tsx` (header counter placement)

## Out of scope

- Blank preview iframe bug (call out separately — likely CSP / auth redirect on `/c/$slug?preview=1`).
- Section-scroll sync between editor and preview.
- Any changes to the public coach page or to design tokens.
