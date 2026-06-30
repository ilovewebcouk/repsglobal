## Brutal truth

The dialog has no sticky footer, so on a laptop the Save button sits below the fold and you have to scroll to find it. The close "X" in the corner is also ambiguous — does it discard or save? That's a trust problem on an editor users will touch every week. World-class editors (Linear, Notion, Stripe Dashboard) solve this with a **sticky footer + autosave + clear exit**, not with a floating X.

## Recommendation

Go with **sticky footer + debounced autosave + explicit Done button**. Best of both worlds: nothing is ever lost, the primary action is always visible, and the X is removed so there's no "did I just discard my work?" moment.

## Plan

1. **Restructure `EditServiceDialog`** (in `src/routes/_authenticated/_professional/dashboard_.shop-front.tsx`) into three regions:
   - Sticky header (title + subtitle)
   - Scrollable body (all the form fields)
   - Sticky footer (left: autosave status "Saved · just now" / "Saving…" / "Unsaved changes"; right: `Done` primary button + `Delete` ghost on the left)

2. **Add debounced autosave** (800ms after last change) that calls the existing `upsertService` server fn. Track a local `saveState: 'idle' | 'dirty' | 'saving' | 'saved' | 'error'`.

3. **Remove the corner `X`** from this specific dialog. Closing happens via:
   - `Done` button (flushes any pending save first)
   - `Esc` key (flushes pending save, then closes — never silently discards)
   - Click outside is disabled to prevent accidental dismissal mid-edit

4. **Visual polish**: footer uses `sticky bottom-0 border-t border-reps-border bg-reps-panel/95 backdrop-blur` so it floats above the scroll. Body gets `max-h-[calc(90vh-140px)] overflow-y-auto` so the footer is always visible at any viewport height.

5. **Apply the same pattern** to `EditFaqDialog` in the same file for consistency (smaller dialog, same problem class).

### Out of scope
- No changes to the underlying `upsertService` schema or server fn.
- No changes to the public `/c/$slug` rendering.
- Other dashboard dialogs stay as-is for now (can roll the pattern out later if you like it).

### Files touched
- `src/routes/_authenticated/_professional/dashboard_.shop-front.tsx` (dialog markup + autosave hook)
