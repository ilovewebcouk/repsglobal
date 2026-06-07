## Goal

Erase CIMSPA from the site entirely. Reframe REPs as the body that "sets professional standards across the sport and physical activity sector" and treat "REPs-endorsed CPD" as the safe default. No links, badges, acronyms, hashtags, or passing mentions of CIMSPA anywhere.

## Files to change

**`src/routes/cpd.tsx`** (9 references)
- Awarding-body acronym block (line 168): delete the CIMSPA entry entirely.
- Acronyms glossary (lines 322–326): delete the CIMSPA card (short/meaning/href). No replacement needed — REPs gets its own treatment elsewhere on the page.
- Body copy (line 294): rewrite to "Qualifications must be Ofqual-regulated or endorsed by a recognised professional body (REPs, AfN, Yoga Alliance Professionals)."
- Red-flag checklist (line 378): "Awarding body not Ofqual-regulated or REPs-endorsed…"
- Green-flag checklist (line 388): "REPs endorsement listed openly on the course page."
- Hero/inline chip (line 589): replace `<span>CIMSPA</span>` with the next relevant standards chip (REPs, if not already adjacent — otherwise drop the chip to avoid duplication).
- SEO/keywords list (line 637): "REPs-endorsed CPD courses".
- Verification copy (line 1374): "Every credential cross-checked against the body that issued it — Ofqual, REPs, AfN, HCPC, YAP."

**`src/routes/dashboard_.community.tsx`** (1 reference)
- Trending hashtags (line 95): replace `#cimspa` with `#reps-endorsed`.

## Editorial rules applied

- Use "REPs" (matching brand casing) everywhere, never "REPS" in prose.
- Where CIMSPA appeared in a list of bodies, REPs takes its slot — do not duplicate if REPs is already in the same list (just drop CIMSPA in that case).
- No outbound link to cimspa.co.uk anywhere.
- "Sets professional standards across the sport and physical-activity sector" becomes the REPs descriptor wherever a standards-body explainer is needed.

## Out of scope

- No layout, image, or component restructuring.
- No changes to other routes, navigation, or schemas.
- Images that don't contain the word CIMSPA are untouched (search confirmed no asset filenames reference it).
