# Adobe-designed certificate templates

Move certificate rendering from hardcoded pdf-lib drawing to a real Adobe-designed print-ready PDF, with the server overlaying only the variable data (name, course, date, cert number, QR, provider logo).

## What you deliver in Adobe

Two A4 PDFs per template pack, exported print-ready (fonts embedded, CMYK, 3mm bleed, 300dpi placed images):

1. **`certificate-of-achievement.pdf`** — A4 landscape, page 1. Full artwork: REPS crest, border/foil treatment, background, signatory line art, "Certificate of Achievement" typography. Leave clean empty regions for: learner name, course title, level, awarding body line, issue date, REPS course no., Ofqual no., QR + verify URL, and a **rectangular slot for the training provider's logo** (co-brand).
2. **`unit-summary.pdf`** — A4 portrait, page 2. Header artwork + empty region for the meta table and the unit list.

You then send me each PDF plus a filled-in **coordinate sheet** per template (one row per field):

```
field            page  x     y     maxWidth  align   fontSize  fontWeight  color
learner_name     1     421   360   700       center  40        bold        #1a1a1a
course_title     1     421   300   700       center  22        regular     #333333
provider_logo    1     720   90    140x60    fit     -         -           -
qr_code          1     90    90    120x120   -       -         -           -
...
```

x/y are from the bottom-left in points (pdf-lib convention). I'll give you a one-page cheat sheet + a marked-up PDF template with rulers so measuring in Illustrator is trivial.

## What I build

### 1. Storage + schema

- New private Supabase Storage bucket `certificate-templates` (admin-write, service-role-read at issue time).
- New table `certificate_templates`:
  - `id`, `slug` (e.g. `reps-default-v1`), `name`, `is_default bool`
  - `certificate_pdf_path`, `unit_summary_pdf_path` (paths in the bucket)
  - `field_map jsonb` — the coordinate sheet parsed into JSON
  - `created_at`, `updated_at`
- New nullable column `courses.certificate_template_id` — when null, use the default template.
- No versioning table. Per your decision, reprints use the current template. If you upload a new design, all future issues (including reprints of old certs) use it.

### 2. Admin upload UI (`/admin/certificates` → new "Templates" tab)

- List templates, "Set as default" toggle.
- Upload dialog: two file inputs (cert PDF, unit summary PDF) + a textarea to paste the coordinate JSON. Preview button renders a sample cert with dummy data so you can eyeball placement before saving.
- No drag-drop editor in v1 — you send me coordinates, I (or you) paste the JSON. We can layer a visual editor later if you want.

### 3. Provider logo pipeline

- Add `logo_url` to the provider/professional profile (or reuse existing `professionals.logo_url` if present — I'll check).
- Admin batch flow: when generating a batch, if the course's provider has a logo, it's slotted into the `provider_logo` field on page 1. If not, the slot is left blank (artwork should look intentional either way — design accordingly, maybe put "In partnership with" only when a logo exists via a second optional field).

### 4. Rendering rewrite (`src/lib/certificates/pdf.server.ts`)

Replace the current code-draw with:

1. Load `certificate_pdf_path` bytes from Storage → open with `pdf-lib`.
2. For each field in `field_map`:
   - `text` fields: draw text with the specified font/size/color/align, wrapping to `maxWidth`.
   - `image` fields (`qr_code`, `provider_logo`): embed PNG, fit inside the bounding box preserving aspect ratio.
3. Load `unit_summary_pdf_path`, stamp the meta table + unit list the same way.
4. Merge into a single 2-page PDF, return bytes.

Fonts: I'll bundle 2–3 embedded fonts server-side (e.g. a serif for the name, a sans for meta) so the overlay text matches the Adobe design. You tell me which fonts you used in Illustrator; if they're free/OFL I embed directly, if licensed you confirm embedding rights.

### 5. QR + verify URL

Unchanged logic — generated at issue time, placed into the `qr_code` slot per the field map. The URL text can be its own text field beneath the QR.

### 6. Backwards compatibility

If a course has no template and no default template exists, fall back to the current code-drawn renderer (kept as `pdf-legacy.server.ts`) so nothing breaks on day one. Once you upload the first template and mark it default, every new issue uses it.

## What stays the same

- `issue.server.ts` data assembly (learner, course, batch, verify URL) — unchanged.
- Print pack ZIP/merged PDF flow — unchanged, just renders prettier PDFs.
- International £15 postage flow — untouched.

## What I need from you before build

1. Adobe files (cert + unit summary) exported as print-ready PDF.
2. The coordinate sheet for each (I'll give you the template CSV).
3. Font choice + confirmation on embedding rights.
4. Whether the provider logo slot should be always-present with a fallback ("Awarded by REPS") when no logo, or hidden entirely.

## Honest limitations of this approach

- **Coordinate drift**: if you redesign in Adobe and move the name box, you must resend the coordinate sheet. That's why option C (drag-drop editor) exists — worth revisiting if you iterate on the design more than 2–3 times.
- **Font matching**: text drawn by pdf-lib will *never* look 100% identical to text set in Illustrator (kerning, ligatures, OpenType features differ). For the learner name specifically, this matters. Mitigation: pick a font with tight, boring kerning (avoid Didone/script). If you want script-quality names, we'd need to pre-render each name as an SVG/image server-side — doable but +1 day.
- **Reprints ≠ originals**: per your "always latest" choice, a learner reprinting a 2024 cert in 2027 gets the 2027 design. Fine for most, but if an awarding body ever audits and expects byte-identical reprints, you'll want immutable versions. Easy to add later.

## Rough scope

~1 day build once your Adobe PDFs + coordinates land. Half a day if the provider logo column already exists.