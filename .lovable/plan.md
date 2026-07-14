## Change

On the learner unit summary certificate page, render modules as a numbered list (1, 2, 3, …) instead of orange bullet dots. Numbering follows the order the provider entered modules during endorsement.

## Files

**`src/lib/certificates/pdf.server.ts`** — `drawList()` (~line 304)
- Replace the fixed `bullet` glyph with a per-item index `${n}.`
- Compute the widest label width from `list.length` (e.g. `"10."`) so all module text left-aligns cleanly regardless of 1- or 2-digit numbers
- Keep the existing `bulletColor` token (orange) for the number, `color` for the text, and current line-height / wrap behaviour
- The `ListField` fields `bullet` / `bulletColor` remain in the type for backwards compatibility with existing templates, but `bullet` is ignored on the unit-summary list; `bulletColor` now colours the number

**`src/lib/certificates/pdf-legacy.server.ts`** — page 2 units loop (~line 200)
- Same swap: `"•"` → `"${n}."` in matching orange, so the fallback generator stays consistent

## Out of scope

- No schema / data changes — modules are already an ordered array (`spec_modules` for REPS courses, `spec_learning_outcomes` for regulated). Numbering just reflects that order.
- No template-editor UI changes.
- No copy / layout changes elsewhere on the certificate.
