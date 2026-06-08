## What changes

### 1. Memory rule — never mention CIMSPA
Add a Core rule and a small memory file:
- **Core line:** "Never mention CIMSPA anywhere on the site — product, marketing, comparison, dashboard, FAQ. Use 'Ofqual-regulated' or 'recognised awarding body' instead."
- **`mem://content/banned-orgs`** holding the rule and the reasoning (REPs does not endorse or promote CIMSPA).

Audit: only one current hit — `src/routes/cpd-v2.tsx:1142`. It's removed in step 2.

### 2. Replace the Recognition section on `/cpd-v2`
Currently `RecognitionStrip` (lines 1137–1182) lists 6 third-party orgs (Ofqual, CIMSPA, Yoga Alliance, BASI, STOTT, Les Mills). We're handing free brand placement to organisations that don't pay REPs — and to CIMSPA, which we don't promote at all.

Replace it with a **Verified Training Providers** block in the same slot:

- **Eyebrow:** "Verified training providers"
- **Heading:** "Training providers, listed when they're verified by REPs."
- **Lede:** "Verified training providers appear here once they've completed REPs verification — accrediting body checked, tutors named, refund and complaints policies published. We only list providers who meet the bar."
- **Body (empty state today):** a single bordered panel (rounded-[18px], `border-reps-border bg-reps-panel`) with:
  - Icon row + line: "First verified providers coming soon."
  - Short paragraph: "REPs is onboarding the first cohort of verified training providers. Once verified, their logo, course catalogue and CPD points appear here and on member profiles automatically."
  - Single CTA `Link to="/contact"`: "Apply to become a verified training provider →"
- **No third-party logos. No CIMSPA. No free placement.**

When paying providers exist, the empty state becomes a logo/name grid in the same slot — no further layout changes needed.

### 3. Keep what already works
- `TrainingProvidersBand` (the "Training providers will have a stronger place inside REPs" section) stays — it's the long-form pitch.
- The new Verified Training Providers block sits in the old Recognition slot (between Specialism areas and TrainingProvidersBand) and acts as the proof slot for the section below.

### 4. Quality bar (keeps the 9/10)
- Uses existing `SectionHeader` primitive — no new components, no drift.
- Single brand-orange accent, no emerald (no status semantic in play).
- Card radius 18px (panel scale), button radius 10px — all on the locked radius scale.
- Copy is honest about the empty state — no fake logos, no "coming soon" filler that reads as weak.

### Out of scope
- Other CIMSPA sweeps (only one hit; covered).
- Touching `/cpd` (the older route) — separate pass.
- Designing the populated-state logo grid; the empty state is the only Phase 1 deliverable.

## Files

- **edit** `mem://index.md` — add CIMSPA Core line + Memories entry
- **create** `mem://content/banned-orgs` — full rule
- **edit** `src/routes/cpd-v2.tsx` — replace `RECOGNITION` array + `RecognitionStrip` (lines 1137–1182) with a `VerifiedProvidersSlot` component using `SectionHeader` + a single empty-state panel
