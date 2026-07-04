## Goal

Rebuild the **Client Results** editor on `/dashboard/website` so every field maps 1:1 to a proof card on the public website (`/c/$slug`), with a proper image uploader (not a URL text box) and a live preview that mirrors the public card.

## Why

The pipeline already exists end-to-end (`website_transformations` → `TransformationsSection`), but the editor UX is broken:

- Image is a raw URL text field (no upload, no crop, no image at all for most pros)
- Editor has both `metric` and `headline` — the public card only shows one of them, so one field is invisible
- No place to enter the "Marketing Director · 12 weeks" line under the client name — the website currently duplicates the headline into that slot
- No preview, so pros can't see what they're building

## What the public card shows

```
┌────────────────────────────┐
│  [ 4:3 photo ]             │
│  [RESULT pill]             │
│  −8kg · first unassisted   │  ← Result headline (bold)
│  pull-up                   │
├────────────────────────────┤
│  "Quote from the client…"  │  ← Quote
│  ─────────                 │
│  Sophie L.                 │  ← Client name
│  Marketing Director ·      │  ← Role · duration
│  12 weeks                  │
└────────────────────────────┘
```

## Editor fields (new)

| Field | Type | Maps to |
| --- | --- | --- |
| Photo | Image uploader (Upload / URL) with **4:3 crop → 1600×1200 JPEG** | `image_url` |
| Result headline | Single line, 80 chars, bold text on the card | `metric` (existing column, canonical) |
| Client quote | Textarea, 600 chars, optional | `quote` |
| Client name | Text, 60 chars (e.g. "Sophie L.") | `client_first_name` (kept for compat, label reworded) |
| Client role | Text, 60 chars, optional (e.g. "Marketing Director") | `client_role` **(new column)** |
| Duration | Text, 40 chars, optional (e.g. "12 weeks") | `duration_label` **(new column)** |
| Show on site | Toggle | `is_published` |

A **live card preview** renders to the right of the fields inside the editor, using the exact same visual as `TransformationsSection`.

## Public card wiring changes

In `mergeLiveIntoCoach` (`src/routes/c.$slug.index.tsx`):

- `metric` → the bold headline (already correct)
- `meta` → **`[client_role, duration_label].filter(Boolean).join(" · ")`** instead of duplicating `headline`. Falls back to empty when both blank so the "Marketing Director · 12 weeks" line simply doesn't render for pros who haven't filled it in.
- Drop the redundant `headline` mapping.

## Image upload

- New bucket **`website-results`** (public, mirrors `website-hero` config).
- New server fn `uploadTransformationImageFromBase64` — takes a data URL, decodes → re-encodes 1600×1200 JPEG server-side, writes under `<userId>/<uuid>.jpg`, returns public URL. Owner-scoped storage policies.
- Reuse the cropper pattern from `HeroImageEditor` but locked to **4:3** aspect (not 9:16). Extract the cropper modal into a small shared primitive if trivial; otherwise inline in a new `TransformationImageEditor.tsx`.

## Files touched

1. **Migration** — add `client_role text`, `duration_label text` to `website_transformations`; create `website-results` storage bucket + owner RLS policies.
2. `src/lib/website/website-content.functions.ts` — extend `TransformationSchema` + `TransformationDTO` with the two new fields.
3. `src/lib/website/transformation-image.functions.ts` — **new** upload server fn (mirrors `hero.functions.ts`).
4. `src/components/dashboard/TransformationImageEditor.tsx` — **new** uploader component (Upload / URL modes, 4:3 cropper).
5. `src/routes/_authenticated/_professional/dashboard_.website.tsx` — replace `TransformationsEditor` with the rebuilt version: field grid + live card preview + inline edit for existing rows (currently they're read-only chips).
6. `src/routes/c.$slug.index.tsx` — update `liveTransformations` mapping so `meta` = role · duration (drop headline duplication).
7. `src/lib/website/website.functions.ts` — include `client_role`, `duration_label` in the `WebsiteTransformationDTO` and the select column list.

## Out of scope

- Reviews wiring for the "In their words" section below (that's the next slice per the previous turn's decision to remove the Written Results editor).
- AI-drafted transformations.
- Changing card layout / styling on the public site — only the meta line text changes.