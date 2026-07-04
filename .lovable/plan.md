
## Brutal honest answer first

Yes — the coaching-plans pattern (list of cards → click "Edit" → focused dialog) is the right pattern for **How I coach pillars** and **Client results** too. Right now both sections dump every field for every item into a long inline stack, which is what makes the editor feel "squashed" even after we widened the pane. Same-shaped repeating items belong in a compact row + modal editor.

Sidebar statuses are also genuinely confusing: three "optional" sections (Profile photo, Specialisms, Where I train) render **no pill at all**, so users can't tell if they're done, skipped, or broken. And "Draft" vs "Empty" vs "Done" isn't a scale — it's two axes (progress + intent) crammed into one label.

---

## Plan

### 1. Pillars: card + dialog (matches Coaching plans)

**How I coach** editor becomes:
- Method name + intro stay inline at the top (they're single fields, no repetition).
- Pillars render as 3 compact rows: `[#] Pillar title — one-line body preview` with `Edit` / `⋯ (Move up/down, Reset to example)` on the right.
- Clicking Edit opens `PillarEditDialog` (same shell as `ServiceEditDialog`): pillar title (30) + one-liner (30) + body (600), all with `FieldCounter`, Save/Cancel, "Discard unsaved changes?" confirm on dirty close.
- Empty pillar slot shows an `Empty`-style CTA row: `+ Add pillar 2` (orange when previous is filled, muted otherwise).

### 2. Client results: card + dialog (matches Coaching plans)

- List renders as compact result rows: `Headline — "quote preview…"` with client name/age chip, `Edit` / `⋯ (Move up/down, Delete)`.
- Clicking Edit opens `ResultEditDialog`: headline (60), quote (400), client name (60), context (60), metric (40), all with `FieldCounter`.
- Empty state = single hero CTA `+ Add your first client result` (already shipped last pass — keep, just remove the inline expanded editor underneath).
- Delete moves from inline red button to dialog footer, behind an AlertDialog confirm (matches services).

### 3. Sidebar status audit + fix

Replace the current 4-value (`done | partial | empty | optional`) system, which mixes "how full" with "is this required", with a cleaner 3-value model that **always renders a pill** so no section looks broken:

| State | Pill | When |
|---|---|---|
| **Done** (emerald) | `Done` | Section meets its "complete" threshold |
| **In progress** (amber) | `In progress` | At least one field filled but not complete |
| **Not started** (muted) | `Add` | Nothing filled yet |

Rename "Draft" → "In progress" and "Empty" → "Add" (verb, invites action). Drop the invisible `optional` state entirely — every section gets a real threshold:

- **Profile photo** — Done when `avatar_url` set; else `Add`.
- **Website basics** — unchanged (4 fields).
- **Coaching plans** — unchanged (≥3).
- **How I coach** — unchanged (method name + ≥3 pillars).
- **Specialisms** — Done when ≥1 specialism selected (was silently "optional"); In progress if editor touched but empty; else `Add`.
- **Where I train** — Done when delivery mode set AND (online OR ≥1 location); In progress if partial; else `Add`.
- **Client results** — soften threshold: Done at ≥1 (was ≥3), In progress rules kept, else `Add`. Three-plus was too aggressive — plenty of trainers legitimately ship with one hero result.
- **FAQs** — Done at ≥1 (was ≥3), else `Add`.

Also:
- Move the pill inside the button so it never gets clipped in icon-collapsed sidebar (already handled via `group-data-[collapsible=icon]:hidden` — verify).
- Add a `Getting started · N of 8 done` progress row at the top of the sidebar section list so the whole list has a legible summary.
- Reorder sections so foundational-first: Profile photo → Website basics → Specialisms → Where I train → Coaching plans → How I coach → Client results → FAQs. (Right now Specialisms and Where I train sit awkwardly between How I coach and Client results.)

### 4. Out of scope this pass

- Drag-and-drop reorder for pillars/results (up/down arrows only, same as services).
- Autosave inside the new dialogs (Save button, matches services).
- Changing the live-preview iframe.
- Any copy/tone changes to placeholders (last pass locked those).

## Files

- `src/routes/_authenticated/_professional/dashboard_.website.tsx` — swap inline pillar editors + result editors for row+dialog, wire new status thresholds, reorder sections, add progress header data.
- `src/components/dashboard/website/WebsiteSectionsSidebar.tsx` — new pill labels ("In progress" / "Add"), progress summary row, always-visible pill.
- `src/components/dashboard/website/WebsiteEditorLayout.tsx` — mirror the pill label changes in the inline `StatusPill`.
- `src/components/dashboard/website/PillarEditDialog.tsx` — **new**, cloned from `ServiceEditDialog`.
- `src/components/dashboard/website/ResultEditDialog.tsx` — **new**, cloned from `ServiceEditDialog`.
- `docs/website-editor-audit.md` — log the status-model change + threshold table.

## Verification

Playwright at 1280×1800: open `/dashboard/website`, screenshot sidebar (every section has a pill), open How I coach → click Edit on pillar 1 → screenshot dialog, open Client results → click Edit → screenshot dialog. Confirm build passes.
