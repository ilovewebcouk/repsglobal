Trim redundant labels inside each awarding-body group on `/t/$slug` (Accreditations section) and restyle the Ofqual number pill to match the emerald "Approved centre" language elsewhere.

## Changes in `src/routes/t.$slug.index.tsx`

**1. Remove "Approved centre · Ofqual-regulated" sub-label (lines 576–579)**

That block sits directly under each awarding-body name. The section already shows a big emerald "Approved centre" pill next to the "Ofqual-regulated qualifications" heading, so repeating it per body is noise. After the change, each body row shows just the logo + name.

**2. Recolour the Ofqual reference pill (lines 594–599)**

Currently a neutral cream/grey pill: `border-black/10 bg-[#f7f6f2] text-black/60` with an "Ofqual" caps prefix in `text-black/45`.

Change to emerald status styling (matches the REPS number badge in the dashboard and the "Approved centre" pill above):

- Container: `border-emerald-400/30 bg-emerald-500/10 text-emerald-800`
- "Ofqual" prefix: `text-emerald-700/70`

No other visual changes — layout, spacing, and the section-level "Approved centre" pill stay exactly as they are.

## Out of scope

- No change to the CPD block below.
- No change to the section heading or intro copy.
- No change to the dashboard qualifications list.