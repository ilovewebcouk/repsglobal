## Problem

The mobile QR upload pages (`/u/cpd/$sessionId` and `/u/insurance/$sessionId`) currently render a single file input with `capture="environment"`, which on most phones forces the camera to open. Users can't pick a saved PDF or image from their photo library or Files app.

## Fix

Split the single dropzone into **two side-by-side actions** on both mobile upload pages:

1. **Take photo** — `<input type="file" capture="environment" accept="image/*">` (camera-first)
2. **Choose file** — `<input type="file" accept="application/pdf,image/jpeg,image/png">` (opens Files / Photos picker; no `capture` attribute)

Both feed the same existing `handlePick(file)` handler — no server, validation, or upload-pipeline changes. Same 10MB cap, same toast/done states.

## Files to edit

- `src/routes/u.cpd.$sessionId.tsx` — replace the single `<label>` block (lines ~102–130) with two stacked buttons sharing the same handler.
- `src/routes/u.insurance.$sessionId.tsx` — same change for the insurance mobile flow.

## Visual

Keep the locked dark/orange tokens (`border-reps-border`, `bg-reps-panel-soft`, `text-reps-orange`, `rounded-[16px]`). Two equal-width tiles in a 2-column grid on mobile, each with icon + label (`Camera` / `Upload` from lucide-react). Busy and Done states remain unchanged.

## Out of scope

- Desktop dialog (`UploadCertificateDialog` / `InsuranceUploadDialog`) — already has a working file picker; no change.
- Server functions, session lifecycle, AI extraction.
