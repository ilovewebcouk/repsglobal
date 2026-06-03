# /for-professionals — surgical v2.1 pass

Five targeted edits to `SECTION_BLOCKS` in `src/routes/for-professionals.tsx`. No structural changes. Single file.

## 1. Section A — lead with the reader, credential second
- **Body now**: "REPs has been the UK's verified register since 2009 — and the public still searches it first. Your profile shows the badge, the qualifications, the insurance, the reviews. Trust, decided before they message you."
- **Body new**: "Trust gets decided before they message you. Your profile shows the badge, the qualifications, the insurance, the reviews — backed by the UK's verified fitness register since 2009."

## 2. Section B — cut the unsourced stat
- **Body now**: "Most coaches lose 4 in 10 enquiries to a slow reply. REPs lands every lead in one pipeline with source, value, priority and a follow-up date — and AI scores intent and drafts the first reply for you."
- **Body new**: "Slow replies cost you clients. REPs lands every lead in one pipeline with source, value, priority and a follow-up date — and AI scores intent and drafts the first reply before you've opened the tab."

## 3. Section C — pull competitor name-drops out of the body
- **Body now**: "Goals, programme, last check-in, next session, lifetime value, outstanding invoice — on one screen. The CRM Trainerize doesn't have, wired to the coaching tools MyPTHub doesn't have."
- **Body new**: "Goals, programme, last check-in, next session, lifetime value, outstanding invoice — on one screen. The CRM the coaching apps don't have, wired to the coaching tools the CRMs don't have."

(Same punch, no name-drop. Competitor name-drops live on `/compare`.)

## 4. Section F — fix the confusing "six"
- **Body now**: "Six check-ins, read for you. Adherence, sleep, stress, training, nutrition, measurements and photos summarised into one card per client — with a reply already drafted in your tone of voice."
- **Body new**: "Check-ins, read for you. Adherence, sleep, stress, training, nutrition, measurements and photos summarised into one card per client — with a reply already drafted in your tone of voice."
- **Bullet change**: "AI Check-in Summariser — headline, change, ask" → keep as-is.

## 5. Section H — trim to 4 bullets to match rhythm
Drop the lowest-value bullet ("AI Lead Scoring + reply drafts" — already covered in section B). Final 4:
- "AI Programme Writer — 12-week plan from one brief"
- "AI Check-in Summariser — a stack of reviews into one card"
- "AI Client Risk Alerts — who's about to ghost"
- "Weekly Next Move — the action that pays this week"

## 6. CTA variation — break the "Explore X →" wallpaper

Vary three of the nine. The rest stay "Explore X →".
- **A** (Visibility): `See the profile`
- **B** (Leads CRM): `See the pipeline`
- **E** (Programmes): `See the builder`

The other six keep their current "Explore …" CTAs so the page still groups by pillar.

## Out of scope (per your earlier guidance)
- No customer quotes / testimonials (Phase 1 lock — no fabricated proof).
- No page-level Act 2 thesis rewrite.
- No final CTA changes.
- No AI-band changes.
- No pricing changes.

## Compliance
- Edits are string-only. No tokens, radii, structure or props touched.
- No banned phrases introduced. No competitor name-drops left in benefit copy.
- Always "REPs".

## Files touched
- `src/routes/for-professionals.tsx` — only `SECTION_BLOCKS`.
