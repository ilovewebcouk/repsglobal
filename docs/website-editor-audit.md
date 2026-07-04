# Website editor QA/audit

**Date:** 2026-07-04
**Route:** `/dashboard/website`
**Viewport:** desktop 1550×1800 (new shell: sidebar 232 / editor ~800 / preview ~500)
**Persona tested:** Charlotte Evans (Core trainer, verified) via admin impersonation

## Shipped in the 2026-07-04 batch

- ✅ 7.1 — Deleted inline preview column from Client Results (`TransformationRow` is now full-width; the page-level iframe is the single preview).
- ✅ 7.2 — Client Results empty state collapsed to a single `+ Add your first client result` CTA (no ghost form).
- ✅ 7.3 — "Add result" button now uses a proper neutral disabled treatment when required fields are missing (no more faded orange that reads as broken).
- ✅ 7.4 — Character counters on Result headline (80) and Client quote (600).
- ✅ 5.1 — Specialisms header now shows a prominent `N of 3 selected` pill (emerald when at cap).
- ✅ 5.2 — Selected specialism chips now sort to a "Selected" row above "Available"; over-cap taps toast a friendly limit message.
- ✅ 4.1 / X.2 — Placeholder text across Basics, How I coach, Client results, FAQs replaced with bracketed watermarks so real content is always distinguishable.
- ✅ X.1 — New `FieldCounter` helper wired on tagline, subtitle, about, method name, method intro, pillar titles, pillar bodies, results intro, result headline, quote, FAQ question, FAQ answer.



Scoring axes (each /2, total /10):

- **Clarity** — obvious what this section controls on the public page
- **Hierarchy** — most-changed fields first, optional ones marked
- **Feedback** — counters, validation, save state
- **Redundancy** — no inline preview competing with the live iframe
- **Consistency** — same patterns as sibling sections

Screens captured under `/tmp/browser/editor/shots/`.

---

## 1. Profile photo — 7/10

**What works.** Single job. Big Change/Remove buttons. Helpful caption ("Real headshot only · JPG or PNG · min 512 × 512…").

**Fixes**

| # | P | Issue | Fix |
|---|---|---|---|
| 1.1 | P2 | Editor pane is 90% empty white space below the photo card | Add a 2-tile grid below: "Where this appears" (thumbnail examples: directory card / enquire form / review card) and a shortcut card "Next: Website basics →" |
| 1.2 | P2 | No visible upload progress or crop step | Show a spinner + shimmer over the avatar during upload; on success flash the emerald outline briefly |

---

## 2. Website basics — 7.5/10

**What works.** Post-fix layout: labels stacked over full-width inputs. AI draft buttons per field. Hero image supports Upload / AI / Paste URL.

**Fixes**

| # | P | Issue | Fix |
|---|---|---|---|
| 2.1 | P0 | No character counters despite `maxLength={200/4000}` on inputs — user can't tell they're near the limit | Add `<FieldCounter current={value.length} max={n} />` under every input; amber at 90% |
| 2.2 | P1 | About textarea is a fixed height; long bios clip to 3–4 lines | Auto-grow (`min-h-[160px] max-h-[500px] resize-y`) or swap to `field-sizing: content` |
| 2.3 | P1 | "AI draft" button is a small chip on the top-right of each field — easily missed | Move to a single header-level "Draft with AI" toolbar dropdown ("Tagline / Subtitle / About") to reduce noise |
| 2.4 | P1 | Hero image "AI generate" opens what? Empty label with no example thumbs | Show 3 sample outputs (small thumbnails) below the tab as "Style reference" |
| 2.5 | P2 | No image aspect crop preview — user uploads a 4:3, no idea how it'll be portrait-cropped | Overlay a 9:16 crop mask on the uploaded image before commit |
| 2.6 | P2 | "Shown on your public page at /c/charlotte-evans" is only informational — clicking it should open the public page | Wrap the slug in `<a target="_blank">` with `↗` icon |

---

## 3. Coaching plans — 7.5/10

**What works.** Three-card summary, "Most popular" locked to the middle card via slot logic. "Edit" opens a proper dialog (wide, single-purpose).

**Fixes**

| # | P | Issue | Fix |
|---|---|---|---|
| 3.1 | P0 | "Most popular" is hard-coded to slot 2 — trainer cannot promote a different plan without dragging (and there's no drag) | Add a "Mark as most popular" toggle on each card; enforce single-select |
| 3.2 | P1 | No reorder — pricing hierarchy is fixed | Add drag handles or up/down arrows on each row |
| 3.3 | P1 | Cards don't show what's inside — user has to open the dialog to see bullet features | Show the first 2 bullet points as ghost text under the description |
| 3.4 | P2 | Dialog is "Edit service" but no "Duplicate" or "Reset to default" action | Add both to the dialog footer |
| 3.5 | P2 | No hint that a free "Discovery consultation" card is added automatically until you read the section description | Show a fourth ghost card labelled "Auto-added: Discovery consultation · Free · 20 min" (non-editable) |

---

## 4. How I coach — 8/10

**What works.** Clean stacked pillars with big `01/02/03` glyphs. Single "AI draft" button at section level (better than per-field). Placeholders look like real content examples.

**Fixes**

| # | P | Issue | Fix |
|---|---|---|---|
| 4.1 | P0 | Placeholder text ("The Foundation Method", "Build the base") reads as real content on an empty section — a trainer might publish without editing | Change placeholders to bracketed watermarks: `[Your method name]`, `[Pillar title]`; keep the current copy as "Use this example" button that populates |
| 4.2 | P1 | No counters on Method Name (should be short, ~30 chars) or Pillar title (~30) or body (~140) | Add counters |
| 4.3 | P1 | Pillars cannot be reordered | Add drag handles between the `01/02/03` glyph and the title |
| 4.4 | P2 | Intro textarea is fixed height | Auto-grow |

---

## 5. Specialisms — 6/10

**What works.** Chip grid, tap to select, hard cap of 3.

**Fixes**

| # | P | Issue | Fix |
|---|---|---|---|
| 5.1 | P0 | "0 / 3 selected" counter is at the bottom-left in small grey — invisible feedback | Move to the section header right, e.g. `Specialisms · 2 of 3 selected` in white/70 |
| 5.2 | P1 | Selected chips don't move to the top — hard to see what you picked with 15+ options | Sort selected chips first, add a subtle "Selected" mini-header row |
| 5.3 | P1 | No search/filter — scales badly beyond ~20 chips | Add a search field above the grid |
| 5.4 | P2 | No inline hint that specialisms drive search filters + enquire form dropdowns | Add a single-line caption under the header: "Powers card chips, search filters, and enquire dropdowns" |

---

## 6. Where I train — 8/10 (post-fix)

**What works.** Delivery cards horizontal, postcode + Public location caption, checkboxes for surfaces, cities free text.

**Fixes**

| # | P | Issue | Fix |
|---|---|---|---|
| 6.1 | P0 | Postcode input has no validation feedback — user types "AB1" and nothing happens | Inline `data-invalid`/`aria-invalid` + `FieldDescription` "Enter a valid UK postcode (e.g. SW1A 1AA)" |
| 6.2 | P1 | "Cities you cover" is a comma-separated string input — no chip visualisation, easy to typo | Convert to a `TagInput` (chips with delete X, add on Enter) |
| 6.3 | P1 | "Add gym" button gives no hint what happens (dialog? inline row? search box?) | Change label to "Add a gym or studio →" and confirm interaction pattern in the tooltip |
| 6.4 | P2 | "Trains at (optional · max 4)" — the "max 4" is only a label; no visible progress like "1 of 4 added" | Show `2 / 4 added` on the right of the section header |
| 6.5 | P2 | The two delivery cards ("In-person" / "Online") use bespoke `<button>` markup — should be `ToggleGroup` for a11y + focus ring consistency | Swap to shadcn `ToggleGroup type="multiple"` |

---

## 7. Client results — 5/10

Highest-friction section. Redundant preview, empty state is a big form.

**What works.** Every field a trainer needs is present.

**Fixes**

| # | P | Issue | Fix |
|---|---|---|---|
| 7.1 | P0 | **Inline "Preview" card** on the right competes with the live iframe on the far right. Both show the same thing | Delete the inline preview column; the live iframe is now the source of truth |
| 7.2 | P0 | Empty state is a giant blank form + a fake "Add photo" preview — reads as broken | Collapse to a single hero CTA "+ Add your first client result" that opens the form as a dialog or inline expand |
| 7.3 | P0 | "Add result" button is orange but with faded opacity — reads disabled when it's actually enabled | Fix state: full opacity when enabled, `disabled` attribute + shadcn styling when invalid |
| 7.4 | P1 | No character counters on Result headline (should be short, ~60) or Client quote (~400) | Add counters |
| 7.5 | P1 | No image guidance (aspect? min size?) | Caption under Photo: "Landscape 4:3 or square. Min 800×600. Face + result visible." |
| 7.6 | P1 | Client / Role / Duration are three tiny inputs in a row — role and duration labels wrap to two lines at this width | Stack single-column, or use `InputGroup` with the label as an inline addon |
| 7.7 | P2 | No sample-fill button to see a completed proof card without typing | Add "Fill with example" that populates with sample values + a placeholder image |

---

## 8. FAQs — 7/10

**What works.** Add form is compact. "AI draft 5 FAQs" one-shot is delightful.

**Fixes**

| # | P | Issue | Fix |
|---|---|---|---|
| 8.1 | P0 | Existing FAQs aren't shown in this empty state — but there's no delete/reorder affordance shown in the wireframe either | Confirm: with real FAQs, each row has drag handle + inline edit + delete. If not, add them |
| 8.2 | P1 | No char counters on Question (~120) or Answer (~400) | Add counters |
| 8.3 | P1 | "AI draft 5 FAQs" replaces or appends? Not clear | Add explicit "Append to existing" vs "Replace all" choice, or show a diff preview |
| 8.4 | P2 | No "How many are published" state — user can't tell if they have 3 or 8 FAQs at a glance | Show count in section header: `Frequently asked questions · 3 published` |

---

## Cross-cutting findings

| # | P | Issue | Fix |
|---|---|---|---|
| X.1 | P0 | **No character counters anywhere** despite hard `maxLength` limits on ~15 fields | Introduce a single `FieldCounter` helper, wire everywhere |
| X.2 | P0 | **Placeholder text looks like real content** across Basics, How I coach, Client results, Coaching plans | Standardise bracketed watermarks; move "example" content to a "Fill with example" button |
| X.3 | P1 | **No "revert this section" affordance** — user makes a mess, can't undo without navigating away and losing dirty state | Add a small "Revert changes" secondary in each section header when the section is dirty |
| X.4 | P1 | **Live preview iframe is currently blank** on all sections (separate bug) | Investigate CSP / auth flow for `/c/$slug?preview=1` — likely blocked by same-origin auth cookie behaviour or the route redirects when not verified |
| X.5 | P1 | **Publish button is in sidebar footer**, far from the field the user just edited | Keep sidebar Publish, but also show a "Publish · N changes" sticky pill at the bottom of the editor pane when dirty |
| X.6 | P2 | **No autosave indicator** — status is only binary (published / dirty) | Show `Saved locally · 2s ago` on non-published edits so the user knows nothing is lost |
| X.7 | P2 | **"AI draft" convention is inconsistent** — per-field button in Basics, section-level button in How I coach, no button at all in Client results | Standardise: one section-level "Draft with AI" button in the header |
| X.8 | P2 | **Section descriptions repeat "on your public page"** — feels like filler | Replace with concrete outcome, e.g. Client results → "Proof panel that clients see below your services" |

---

## Suggested batch to ship first

The 10 P0s, in priority order:

1. 7.1 Delete inline preview from Client Results
2. 7.2 Collapse Client Results empty state to a single CTA
3. 7.3 Fix "Add result" enabled/disabled visual state
4. 4.1 Placeholder text watermarks (Basics, How I coach, Coaching plans, Client results)
5. X.2 Same as above — cross-cutting
6. 5.1 Move Specialisms selected-counter to the section header
7. 2.1 / X.1 Character counters (single helper, applied everywhere with maxLength)
8. 6.1 Postcode validation feedback
9. 3.1 Allow "Most popular" to be moved off the middle slot

Estimate: single focused pass, all editor-side, no schema changes.

## Deferred (needs its own conversation)

- Preview iframe blank state (X.4) — likely an auth/CSP investigation, worth its own turn.
- Drag/reorder for Coaching plans, Pillars, FAQs, Client results — needs a shared reorder pattern (dnd-kit already in stack?), not a copy-paste per section.
- Autosave (X.6) — implies persistence changes.

---

## 2026-07-04 · Pass 2: dialog-first editing + status audit

### Card + dialog rollout (matches Coaching plans)
- **How I coach — pillars**: replaced the always-open triple stack with a compact row list. Each row shows `[NN] title — body preview` and opens a focused `PillarEditDialog` on Edit. Empty slots surface `+ Add` (orange when the previous slot is filled, disabled otherwise). Discard-confirm on dirty close.
- **Client results**: dropped the inline "Add new" row. List becomes compact rows with thumbnail + headline + quote preview + client meta. Edit opens `ResultEditDialog` (image + all fields + delete + hide toggle). Trailing `+ Add another client result` CTA replaces the inline form.
- Both dialogs mirror the `ServiceEditDialog` UX contract: snapshot on open, dirty tracking, discard confirmation via AlertDialog, save-and-close as the only exit for changes.

### Sidebar status system (renamed + expanded)
Replaced the two-axis (`done | partial | empty | optional`) vocabulary. `optional` no longer renders as blank — every section now shows a real pill:

| Old label | New label | When |
|---|---|---|
| Done | Done (emerald) | Section meets threshold |
| Draft | In progress (amber) | Partial content |
| Empty / — (optional) | Add (muted) | Nothing yet |

Thresholds (all now real, no silent "optional"):

- Profile photo → Done when `avatar_url` set.
- Website basics → Done when 4/4 fields filled.
- Specialisms → Done when ≥1 selected (was silently blank).
- Where I train → Done when postcode AND (online OR in-person) both set; partial if only one.
- Coaching plans → Done ≥3, partial >0.
- How I coach → Done when method name AND ≥3 pillars.
- Client results → Done ≥1 (was ≥3 — too aggressive).
- FAQs → Done ≥1 (was ≥3).

### Sidebar reorder
Old order mixed foundational and rich-content sections. New order is foundational → practice → content:
1. Profile photo
2. Website basics
3. Specialisms
4. Where I train
5. Coaching plans
6. How I coach
7. Client results
8. FAQs

A `N/8` progress chip lives in the sidebar section-header row so trainers see completion at a glance.

### Out of scope this pass
- DnD reorder for pillars/results (Edit-only for now).
- Autosave in the new dialogs — explicit Save & close by design.
- Live preview blank-state (unchanged).

## Draft + Publish (phase 1)

Editor writes → live rows (unchanged mutation code). Row triggers set
`websites.has_unpublished_changes = true`. Public `/c/$slug` reads
`websites.published_snapshot` when present; otherwise falls back to live
rows (backwards compatible). Clicking **Publish** calls
`publishMyWebsite`, which builds the same DTO shape as `getWebsiteBySlug`
from live rows and stores it in `published_snapshot`. Editor iframe
loads `/c/$slug?preview=<signed-token>`, which bypasses the snapshot so
the trainer sees draft edits. Token is HMAC-SHA256 of `${slug}:${exp}`
signed with `WEBSITE_PREVIEW_SECRET`, TTL 4h, minted server-side via
`getMyPreviewToken`. Any un-signed / expired / cross-slug token falls
back to the snapshot.

Phase 2 — shipped 2026-07-04:
- ✅ Signed preview token (`WEBSITE_PREVIEW_SECRET`, 4h TTL).
- ✅ Per-section dirty dot in the sidebar (driven by `getMySectionDiff`).
- ✅ Per-section "Discard to last published" (basics, method, plans,
  results, faqs) via `discardMySectionChanges`.
- ✅ Publish confirm dialog listing changed sections + human summary.

Still deferred:
- Snapshot rollback / version history (only the latest snapshot is kept).
- Discard for specialisms / location / socials (writes into the pro
  record, not the snapshot — needs its own audit trail).

