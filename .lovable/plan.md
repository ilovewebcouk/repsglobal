## Add Cancel (discard) to the Service editor

Right now the dialog autosaves edits to existing services every 800ms and the footer only has **Done**. That's great for confidence, but there's no escape hatch — if a pro tweaks a price or rewrites a bullet and then thinks "actually, no", the change is already saved.

### What I'll change

In `src/routes/_authenticated/_professional/dashboard_.shop-front.tsx` → `ServiceEditDialog`:

1. **Snapshot the original on open.** When the dialog opens for an existing service, keep a deep copy of the row as it was loaded from the DB (`originalSnapshot`). For brand-new cards, the "original" is empty.

2. **Disable autosave by default; opt-in.** Replace silent debounced autosave with an explicit model:
   - Edits stay local until the user clicks **Save** (or **Save & close** / **Done**).
   - Footer status pill becomes: `Unsaved changes` (amber) → `Saving…` → `Saved` (emerald, transient).
   - This removes the "it already saved, too late to cancel" trap.

3. **Sticky footer buttons (left → right):**
   - **Cancel** (ghost) — discards local edits, restores `originalSnapshot` into the draft, closes the dialog. No DB write.
   - **Save** (primary) — persists and keeps the dialog open (for users editing multiple fields).
   - **Save & close** (primary, default action) — persists and closes.
   - For a brand-new card, **Cancel** simply closes without creating the row.

4. **Dirty-state guards:**
   - **Esc key** and **backdrop click**: if dirty, show a small shadcn `AlertDialog` — "Discard unsaved changes?" with **Keep editing** / **Discard**. If clean, close immediately.
   - **Cancel button**: same confirm when dirty; instant close when clean.
   - Browser-level `beforeunload` is out of scope — this is a modal, not a route.

5. **Revert helper.** A small **Revert** link next to the status pill (only visible when dirty and editing an existing card) resets the draft to `originalSnapshot` without closing — useful when a pro wants to undo a single field change mid-edit.

### Out of scope

- No changes to the public `/c/$slug` rendering.
- No changes to the default-seeded service content or the parent list page.
- No schema changes.

### Technical notes

- `originalSnapshot` lives in a `useRef` so it doesn't trigger renders; cleared on `open` transition.
- Dirty check stays as `JSON.stringify(draft) !== JSON.stringify(originalSnapshot.current)`.
- Remove the existing 800ms `setTimeout` autosave effect and the `onSilentSave` prop wiring from the parent (or keep `onSilentSave` and call it only from the explicit **Save** button — simpler: collapse into a single `onSubmit({ close: boolean })` signature).
- AlertDialog uses shadcn primitive; no new deps.
