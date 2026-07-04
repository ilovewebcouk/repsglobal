## FAQs → Row + Dialog

Bring FAQs in line with the pattern we already use for Coaching Plans, How I coach (Pillars), and Client results — so the editor is a clean list of compact rows, and all editing happens in a focused pop-up.

### 1. New component: `FaqEditDialog.tsx`
- Location: `src/components/dashboard/website/FaqEditDialog.tsx`
- Props: `open`, `onOpenChange`, `initial` (FaqDTO or null for "new"), `onSave(faq)`, `onDelete?(id)`.
- Local draft state + dirty tracking + `AlertDialog` "Discard unsaved changes?" confirm on cancel/backdrop-close (same as Pillar/Result dialogs).
- Fields:
  - Question — `TextInput`, max 200, `FieldCounter`, required (≥3 chars).
  - Answer — `TextArea`, max 1200, `FieldCounter`, required (≥3 chars).
- Footer:
  - Left: `Delete` (only when editing existing) → `AlertDialog` confirm, matches Result dialog.
  - Right: `Cancel` (neutral) + `Save` (orange, disabled until valid + dirty).
- If `initial.source === "ai"` show a subtle "AI draft — edit me" hint at the top of the dialog.

### 2. Rewrite `FaqsEditor` as compact rows
Replace the current inline "Add a FAQ" form + full-answer rows with:

- Header (unchanged): title, sub-copy, `AI draft 5 FAQs` button on the right.
- Row list — one row per FAQ:
  - Left: question (single line, truncate) + one-line answer preview (`line-clamp-1`, muted) + optional "AI draft" chip.
  - Right: `Edit` button + `⋯` menu with `Delete` (uses `AlertDialog`, not native `confirm`).
  - Click row body or Edit → opens `FaqEditDialog` in edit mode.
- Empty state: single hero CTA "Add your first FAQ" (matches the Client results empty state), plus the existing "AI draft 5 FAQs" affordance in the header.
- Footer of the panel: `+ Add FAQ` button (orange) → opens `FaqEditDialog` in create mode with empty draft.
- Remove the always-visible inline form and the raw `confirm()` delete.

### 3. Wiring
- `FaqsEditor` owns `dialogOpen` + `editing: FaqDTO | null` state.
- On save from dialog: call existing `onSave` with `{ question, answer, sort_order, source, id? }`. For new items, `sort_order = items.length`, `source = "manual"`. For AI-drafted items being edited, preserve original `source`.
- No changes to the parent mutation, server functions, or DTOs.
- No changes to sidebar status thresholds (FAQs stays "Done at ≥1").

### 4. Out of scope
- Drag-to-reorder (existing behaviour, add later if asked).
- Live-preview iframe changes.
- Any change to AI-draft server function.

### Files
- **Create**: `src/components/dashboard/website/FaqEditDialog.tsx`
- **Edit**: `src/routes/_authenticated/_professional/dashboard_.website.tsx` (rewrite `FaqsEditor`, remove inline form)
- **Edit**: `docs/website-editor-audit.md` (log the change)

### Verification
- Build passes.
- Playwright at 1280×1800: open FAQs section → add via dialog → edit existing → delete via AlertDialog → confirm rows render truncated and the sidebar pill flips to "Done" at ≥1.

### Brutal honest truth
Yes — this is the right call. The FAQs panel is currently the odd one out: it forces users into a full-height form while three other sections (Plans, Pillars, Results) all use the tight row+dialog rhythm. Unifying it makes the sidebar sections feel like one system instead of "each section invents its own editor," and it kills the last remaining raw `window.confirm()` in the website editor.