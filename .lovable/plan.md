## Goal

Remove every mention of CIMSPA from the app. Where CIMSPA currently sits as a "standards body / recognised qualification", REPs takes that slot — REPs is THE professional standard.

## Locations found

Four files, four touch-points:

1. **`src/routes/specialisms.tsx` — Personal Trainers `quals` array (lines ~146–150)**
   Currently the 3rd qual card under PTs is CIMSPA. Replace with a REPs card so the trio reads as: L3 PT → L4 Specialist → REPs (the register every insured PT joins).
   - acronym: `REPs`
   - full: `Register of Exercise Professionals`
   - meaning: `The verified register clients search — identity, qualification and insurance on the public record.`

2. **`src/routes/specialisms.tsx` — REGISTERS array (lines ~379–385)**
   Delete the entire CIMSPA register object. REPs already sits at the top of the array as the canonical entry — no replacement needed; the grid just renders one fewer card.

3. **`src/routes/dashboard_.community.tsx` — community thread mock (line 55)**
   Change thread title `"CIMSPA renewal — anyone else's evidence rejected?"` → `"REPs renewal — anyone else's evidence rejected?"`. Author/level/replies unchanged.

4. **`src/lib/resources.ts` — article body (lines 1576–1577)**
   The "Regulated Qualifications Framework and CIMSPA alignment" H2 + paragraph. Rewrite to remove CIMSPA entirely and frame REPs as the body whose standards awarding organisations align to:
   - H2: `The Regulated Qualifications Framework and REPs alignment`
   - Paragraph: drop the sentence fragment about CIMSPA's professional standards; replace with `…which align their syllabi directly with the professional standards maintained by REPs.`
   Memory note: this is a single-sentence factual swap inside an existing article, not a broader editorial pass — kept tightly scoped.

## Out of scope

- No layout, hero, image, overlay, or styling changes.
- No new copy about the REPs vs CIMSPA history (user said that belongs on the About page in a later pass).
- No nav, routing, SEO meta, or data-model changes.
- No edits to other articles, comparison pages, or marketing pages (none reference CIMSPA — verified via project-wide grep).

## Verification

- `grep -rn "CIMSPA\|Chartered Institute" src/ docs/` returns zero matches after the edit.
- Visual spot-check `/specialisms` PT qual tooltips and the Registers grid; spot-check `/dashboard/community` thread list.
