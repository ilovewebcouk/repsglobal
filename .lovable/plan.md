## Change

Render a Level-N circular badge (using the seven uploaded SVGs) on the issued certificate PDF. Level is read from the numeric level already stored per course type — no new admin field, no new UI outside the cert.

## Scope

- REPS-endorsed courses → `reps_courses.official_level` (fallback: `proposed_level`)
- Regulated qualifications → level parsed from the qualification title (e.g. "Level 3 Diploma…"); if absent, badge is omitted rather than guessed. `provider_regulated_permissions` has no level column, and adding one is out of scope for this pass.

Trainer-uploaded personal certificates: **not in scope** (user chose Certificates PDF only, endorsed courses + regulated quals).

## Files

**Assets** — copy the 7 uploaded SVGs into `src/assets/certificates/level-{1..7}.svg` via `lovable-assets` (asset pointer JSON), so they can be fetched server-side by URL inside the PDF generator (pdf-lib needs raw bytes; the server fetches the pointer's URL at render time and embeds the SVG as a PNG raster via a small rasterisation step, or — simpler — pre-export each SVG to `level-{n}.png` at 512×512 and embed with `embedPng`). Recommend PNG export up-front to avoid an SSR-side SVG→PNG rasteriser in the Worker runtime.

**`src/lib/certificates/issue.server.ts`**
- After loading `reps_courses` / `provider_regulated_permissions`, compute a `courseLevel: number | null`:
  - reps: `official_level ?? proposed_level ?? null`
  - regulated: regex `/level\s*([1-7])/i` on `course_title` (or the permission's qualification title) → number or null
- Pass through as `courseLevel` on the existing `CertificatePdfInput` (field already exists, currently sourced from `certificate_registrations.course_level` — we now also feed it when null).

**`src/lib/certificates/pdf.server.ts`**
- Extend `CertificateFieldMap` with a new `ImageField` variant: `field: "level_badge"` (x, y, width, height on the certificate page).
- In `overlayPage`, when a `level_badge` field is present and `input.courseLevel` is 1–7, embed the corresponding `level-{n}.png` and draw it at the mapped coordinates. If level is null / out of 1–7, skip silently (no placeholder).
- Preload the seven PNGs lazily (cache per render) using `fetch(assetUrl).then(r => r.arrayBuffer())` against the Lovable-Assets URLs.

**`src/lib/certificates/pdf-legacy.server.ts`**
- Same behaviour in the fallback renderer: if `courseLevel` is 1–7, draw the badge in a fixed top-right position on page 1 (~48pt from top/right, 72pt square). No field-map needed here.

**Admin template editor**
- Add "Level badge" to the field picker so admins can position it on their uploaded template. Out of scope for this pass if the editor is not already generic — happy to defer and use a sensible default coordinate.

## Out of scope

- Public profiles, directory cards, dashboard verification panel (user selected certificates only).
- New level column on `provider_regulated_permissions` (title parsing is enough for now).
- Trainer-uploaded personal quals badge rendering.

## Open question

Should we ship PNG exports of the badges (recommended, avoids runtime SVG rasterisation in the Worker) or keep SVG and rasterise on the server? Default: PNG at 512×512, transparent background.
