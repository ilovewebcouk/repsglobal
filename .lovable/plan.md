# Reorder dashboard Website editor to match `/c/{slug}` flow

## Why
Right now the dashboard sections don't match the order the trainer sees on their public page, which makes editing feel disjointed. Reordering top-to-bottom mirrors the public layout so trainers can fill it in like they're reading their own page.

## Target order (matches `/c/{slug}`)
1. **Tagline** (H1)
2. **Subtitle** (line under H1)
3. **About**
4. **Hero image**

## Changes

**File:** `src/routes/_authenticated/_professional/dashboard_.website.tsx`

1. Move the **Subtitle** section (currently 2nd panel per your screenshot — the "Hero subtitle" PPanel) to sit directly under **Tagline** and above **About**.
2. Update the Subtitle helper copy so its role is obvious:
   - Label stays: **Subtitle**
   - Helper text: **"Sits directly under your tagline on /c/{slug} — one short supporting line."**
3. Leave Tagline, About, and Hero image content, save mutations, AI draft dialogs, and validation untouched. Pure reordering + one helper-copy tweak.

## Out of scope
- No changes to persistence, schema, AI draft functions, or the public page.
- No visual restyle of the panels.

## Verification
- Load `/dashboard/website`: confirm order is Tagline → Subtitle → About → Hero image.
- Save each field; confirm values still persist and render on `/c/{slug}`.
- Typecheck clean.
