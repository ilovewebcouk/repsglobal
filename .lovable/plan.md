
Restore the previous compact two-line row layout for each awarding body in the "Ofqual-regulated qualifications" section of `src/routes/t.$slug.index.tsx` (lines 556–605). Keep the emerald Ofqual pill; drop the card-per-body wrapper the last edit introduced.

## Layout per body

One horizontal row:
- Left: awarding-body logo container, sized to match ~two lines of text so the logo reads at the correct scale next to a stacked "Body name / qualification" text block.
  - `flex h-12 w-16 shrink-0 items-center justify-center overflow-hidden rounded-[10px] border border-black/10 bg-white`
  - Logo `max-h-9 max-w-14 object-contain`
- Right (flex column, `min-w-0`):
  - Line 1: body name — `text-[13.5px] font-semibold text-black`
  - Line 2: the qualification(s) as an inline flex-wrap list: optional level pill + title + emerald Ofqual pill, `text-[13px] text-black/75`, `gap-x-2 gap-y-1`.
  - If a body has multiple qualifications, each qualification renders as its own line-2 row under the name (stacked, `space-y-1`), so the logo still visually aligns to the first two lines.

## Container

- Replace the `mt-3 space-y-2.5` card list with `mt-3 space-y-4` (no per-body card, no border, no inner background) so it matches the original clean two-line look.
- Remove the `<ul className="mt-3 divide-y ... border-t ...">` divider treatment.

## Emerald Ofqual pill

Keep exactly as it is now:
```
border-emerald-400/30 bg-emerald-500/10 text-emerald-800  (Ofqual prefix: text-emerald-700/70)
```

## Out of scope

No changes to: section heading, intro copy, section-level "Approved centre" pill, empty state, REPS-accredited CPD block, dashboard qualifications page.
