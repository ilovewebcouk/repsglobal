## Switch certificate field-map coordinates to top-left origin

Match Adobe Illustrator's ruler so `(0,0)` is the top-left corner of the page and Y grows downward. Today the field map is stored in pdf-lib's native bottom-left points, which forces admins to mentally flip every Y value from Illustrator.

### Scope

- All text, image and list fields in `field_map.certificate` and `field_map.unit_summary` are interpreted as top-left.
- The live editor's drag markers, form inputs, and preview all speak top-left.
- Existing saved templates get migrated in place so nothing visually shifts.

### Technical changes

1. **Renderer — `src/lib/certificates/pdf.server.ts`**
   - In `overlayPage`, read `page.getHeight()` once and convert every field's `y` to pdf-lib space just before drawing:
     - Text: `pdfY = pageH - y - fontSize` (so `y` is the visual top of the glyph box, matching Illustrator's text baseline-independent placement).
     - Images (`qr_code`, `provider_logo`): `pdfY = pageH - y - height`.
     - List: `pdfY = pageH - y - fontSize` for the first line, then keep the existing `y -= lh` downward flow (already correct in top-left orientation).
   - Add a short comment block at the top documenting the new convention (points, top-left origin, Y grows down).

2. **Editor — `src/components/admin/certificates/TemplateEditor.tsx`**
   - Remove the current bottom-left ↔ screen flip in the drag handler and marker positioning. Markers now use `top: y * scale` directly.
   - Drag delta: `newY = oldY + dyScreen / scale` (no sign flip).
   - Update the small helper hint next to X/Y inputs from "points from bottom-left" to "points from top-left (Illustrator origin)".

3. **Legacy fallback — `src/lib/certificates/pdf-legacy.server.ts`**
   - Not touched. It doesn't consume `field_map`.

4. **Migration for existing rows**
   - New Supabase migration walks `certificate_templates.field_map` and, for each field, rewrites `y` from bottom-left to top-left using the known A4 portrait height (`841.89` pt) for both pages. Text uses `newY = pageH - oldY - (fontSize ?? 12)`; images use `newY = pageH - oldY - height`; list uses `newY = pageH - oldY - (fontSize ?? 10)`.
   - Runs once; safe to re-run because we'll gate it on a `field_map->>'_origin'` marker set to `"top-left"` after conversion.

5. **Docs**
   - Update the header comment in `pdf.server.ts` (currently says "points from the bottom-left") and any authoring notes to reflect Illustrator-parity.

### Out of scope

- Rotating text, per-field origin overrides, non-A4 page sizes (the migration assumes A4 portrait, which matches the current template requirement).
- Changing the units — still PDF points (1pt = 1/72"). Illustrator can be set to points to match 1:1.

### Verification

- Open an existing template in the editor after migration: markers land in the same visible spots as before.
- Drag a field up on screen → Y value decreases (Illustrator behaviour).
- Preview PDF renders identically to pre-migration output for the seeded template.
