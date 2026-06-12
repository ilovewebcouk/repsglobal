# Earned Professions — Qualifications dictate what you can call yourself

## The core idea

Today a pro picks `primary_profession` from a dropdown. That's a self-claim. After this change:

- **Primary profession is derived** from approved `verification_submissions`, not chosen.
- **Specialisms are derived** from approved CPD certificates (the existing `SPECIALISMS` list).
- The profile editor **shows what they've unlocked**, with a clear "Upload a Level X in Y to unlock this title" path for everything else.
- Admin can override (rare edge cases: degrees, overseas quals, dual professions).

This is REPs' moat. Nowhere else online enforces this.

---

## Brutal-truth design decisions

### 1. Split legally-loaded titles into tiers

One bucket per profession isn't enough — UKSCA and AfN will (rightly) complain. Tiered titles:

| Public title | Earned by (examples) |
|---|---|
| **Fitness Instructor** | L2 Certificate in Fitness Instructing / Gym Instructor |
| **Personal Trainer** | L3 Diploma/Certificate in Personal Training (any Ofqual body) |
| **Advanced Personal Trainer** | L4 PT + a recognised specialism (low back, obesity, GP referral) |
| **Strength Coach** | L4 S&C, or BSc S&C, or BASES SEPAR |
| **Accredited S&C Coach (ASCC)** | UKSCA ASCC verified |
| **Nutrition Coach** | L4/L5 sports nutrition (Mac-Nutrition Uni, PN L2, Active IQ L4) |
| **Registered Nutritionist (ANutr/RNutr)** | AfN register verified |
| **Registered Dietitian** | HCPC register verified |
| **Group Fitness Instructor** | L2 Group Ex / EMD UK |
| **Pilates Instructor** | Body Control / STOTT / Polestar / L3 Pilates |
| **Yoga Teacher** | 200hr Yoga Alliance / BWY / L3 Yoga |

Sensitive titles (Registered Nutritionist, Registered Dietitian, ASCC) require **external register verification**, not just a certificate. That's an admin checklist item plus a future API hit where one exists (AfN has a public register search; HCPC has one too).

### 2. Rules engine, not a giant hand-map

Each approved submission produces a derived "title claim" via deterministic rules:

```
rule = match(
  level,                 // 1..7 (from qualification title)
  subject_keywords,      // ["personal training", "strength conditioning", "nutrition", ...]
  awarding_body_slug,    // from awarding-bodies.ts
  regulator,             // Ofqual / SQA / null
  ofqual_record,         // live status from the cache
)
→ { title_slug, confidence: high|medium|low, requires_admin_review: bool }
```

Each rule fires on subject + minimum level + (optional) awarding-body whitelist. Highest-tier title wins. Lower-tier titles are still "held" (visible on profile as "Also qualified: L2 Gym Instructor") but the **headline title** is the highest.

### 3. Specialisms auto-map the same way

L3 Pre & Post-Natal Exercise → `pre-post-natal`. L4 Lower Back Pain → `posture-back-pain`. GP Referral → `rehab-injury`. Etc. We keep the existing 3-specialism cap, but the pro can only enable a specialism they've earned (or admin-granted).

### 4. Handle the edge cases on purpose

- **Degrees** (BSc Sports Science, MSc Nutrition): no Ofqual number. Admin-verified evidence (transcript + screenshot from awarding university). Maps to L6/L7.
- **Overseas quals** (NASM-CPT, ACE, CSCS, ISSA): no Ofqual record but well-known. We keep a curated allowlist with the title they earn (NASM-CPT → Personal Trainer, NSCA-CSCS → Strength Coach). Admin spot-checks.
- **In-progress quals**: not eligible. "Studying for L3 PT" gets a `student` flag, not a title.
- **Expired quals** (CPR/first aid, insurance): handled separately — they gate `is_published`, they don't grant a title.
- **Dual professions** (PT + Yoga Teacher): pros can hold multiple titles. They pick which is `primary_profession` from their *earned* set; others appear as secondary titles on the profile.
- **CIMSPA**: per memory, we never name CIMSPA in product copy. We can ingest the same level/subject pattern (it's just a recognition framework over the Ofqual quals).

### 5. The legal/comms language

Never write "you ARE a Personal Trainer". Always: "Your qualifications unlock the **Personal Trainer** title on REPs". This protects us if a register later contests a title.

---

## What the user sees

### A. Pro dashboard → CPD tab (today)

Today: list of certificates with status chips.
After: same list, **plus a new "Titles unlocked" panel above it**:

```
Titles unlocked                                    [info]
─────────────────────────────────────────────────────────
✓ Personal Trainer            Primary title  [Change]
✓ Pre & Post-Natal specialism
✓ Lower Back Pain specialism (Level 4)

Locked — what these need
─────────────────────────
🔒 Strength Coach    Upload a Level 4 S&C or UKSCA ASCC
🔒 Nutrition Coach   Upload a Level 4+ sports nutrition cert
🔒 Registered Nutritionist  AfN ANutr/RNutr — admin-verified
```

The `primary_profession` dropdown in **/dashboard/profile** is replaced with a **single read-only field** showing the current primary title + a "Change" link that opens a radio list of *earned* titles only. No free-pick.

### B. Public profile

The title under their name comes from `primary_profession` (still that column, still that slug — just now write-restricted to earned values). A small "Verified by REPs" tooltip lists the qualification that unlocked it. Secondary titles render as a small row underneath. Specialisms render as chips, each one traceable to a certificate.

### C. Admin

`/admin/cpd` (already exists) gets a new column: **Title impact**. When admin approves a cert, the UI previews "Approving this will unlock: *Personal Trainer*, *Pre/Post-Natal*". Admin can override the derived title (with a reason field, audit-logged).

A new admin view **/admin/titles** shows pros whose derived title differs from their `primary_profession` (data-quality dashboard).

### D. Onboarding (new pros)

The signup → profile step no longer asks "What's your profession?" first. It asks **"Upload your highest qualification"** first. The title is derived, then shown back as "You're set up as **Personal Trainer**". Specialisms come from later certs.

---

## Technical plan

### Data model (one migration)

New tables:

- **`profession_titles`** — canonical list of all titles (slug, label, tier 1-3, requires_register_verification bool, public_description). Seeded from the table above.
- **`title_rules`** — the rules engine rows: `{ title_slug, min_level, subject_regex, awarding_body_slugs[] (nullable allowlist), priority, notes }`. Seeded ~25 rows.
- **`pro_titles`** — derived rows: `{ professional_id, title_slug, source_submission_id, granted_at, granted_by ('system'|'admin'), admin_note, is_primary }`. One pro → many rows.
- **`pro_specialisms_granted`** — same shape for specialisms (keeps existing `professionals.specialisms` text[] as the *active* selection, capped at 3).

New columns:

- `verification_submissions.derived_title_slug text` — what the rules engine returned at submission time (for admin review).
- `verification_submissions.derived_specialism_slugs text[]`.
- `professionals.primary_title_slug text` — replaces semantic use of `primary_profession`. We keep `primary_profession` writing for back-compat for one release, then deprecate.

RLS: pros read their own `pro_titles`; everyone reads `profession_titles`; only admins write `title_rules`.

### Rules engine (`src/lib/cpd/title-rules.ts`)

Pure function: `deriveTitles(submission) → { titles: TitleClaim[], specialisms: SpecialismClaim[] }`. Unit-testable. Runs on:

1. **AI extract finishes** (preview to the pro: "this looks like it'll unlock *Personal Trainer*").
2. **Pro submits** (writes `derived_title_slug` for admin review).
3. **Admin approves** (commits `pro_titles` row, recomputes primary title).

### Server functions (`src/lib/cpd/titles.functions.ts`)

- `myUnlockedTitles()` — for the dashboard panel.
- `setPrimaryTitle({ title_slug })` — validates the title is in their earned set.
- `previewTitlesForSubmission({ submission_id })` — used by admin approve UI.

### Profile editor

`/dashboard/profile` currently has a `<Select>` for profession. Replace with `<EarnedTitlePicker>` — radio list of earned titles only, with an inline "Want another title? See what you need" link to `/dashboard/cpd`.

### Public profile

`pro.$slug.index.tsx` (and `c.$slug.tsx` shop-front): title pulled from `pro_titles where is_primary`. Add a "How REPs verifies titles" tooltip linking to a new short explainer (`/how-titles-work` or inline on `/about-verification`).

### Admin

- `/admin/cpd` row gets "Will unlock: X". Approve action commits `pro_titles`.
- `/admin/titles` — new page, mostly a table view + manual grant/revoke (audit-logged).

### Edge cases handled in code

- **Multi-cert PT**: highest-tier wins, lower titles kept as secondary.
- **Expired quals**: still grant the title (it was earned), but flag on profile if no insurance/DBS.
- **Revoked cert**: admin can revoke; `pro_titles` rows from that submission are removed; primary title falls back to next-best.
- **No earned title**: profile cannot be published. Currently we already gate publish on `verification_status = verified`; this just adds "must have ≥1 title".

### Not in scope for this pass

- AfN/HCPC API integration (manual admin verification first; API later if traffic justifies).
- Auto-translation of overseas quals beyond the curated allowlist (NASM/ACE/NSCA/ISSA).
- A user-facing "Title roadmap" wizard ("you're 1 cert away from Advanced PT").
- Migration of existing pros: a separate ops task once rules are live, with email + 30-day window to upload evidence or accept a downgrade.

---

## "Push it further — best ever" ideas worth doing

1. **Trust receipts**: each public title links to a `/verify/<token>` page showing the awarding body, qual number, Ofqual record, approval date. Shareable URL. This is the single biggest differentiator vs Bark/Trainerize/Bookwhen.
2. **Title-based search ranking**: `/find-a-professional` sorts higher-tier titles above lower-tier when filter = "Nutritionist". Registered Nutritionists outrank Nutrition Coaches.
3. **Title badges with hover-explainer** on public profiles — explains what the title *means* to a confused client ("A Registered Nutritionist holds a degree-level qual recognised by the Association for Nutrition. They can give clinical nutrition advice.").
4. **Refusal-with-suggestion** when a pro tries to set a title they haven't earned: don't just hide it — show "Locked — upload a L4 in Strength & Conditioning to unlock". Converts to CPD uploads.
5. **Quarterly "title audit" email** to all pros: "Your titles: PT, Pre/Post-Natal. Anything new? Upload here." Drives retention + CPD reuploads.
6. **Public stats page**: "247 Registered Nutritionists on REPs. 12 ASCC coaches." That number is impossible to fake and is great SEO/PR.
7. **Cert-revoke alert**: if an awarding body publishes a revocation list (Ofqual occasionally does), we can match and auto-flag for admin. (Manual for v1, automated later.)

---

## Files this will touch (high level)

- Migration: new tables + columns (one file).
- New: `src/lib/cpd/title-rules.ts`, `src/lib/cpd/titles.functions.ts`, `src/components/cpd/EarnedTitlesPanel.tsx`, `src/components/profile/EarnedTitlePicker.tsx`, `src/routes/admin_.titles.tsx`, `src/routes/verify.$token.tsx` (trust receipt page, optional in v1).
- Edited: `dashboard_.profile.tsx` (replace profession Select), `dashboard_.cpd.tsx` (add panel), `admin_.cpd.tsx` (preview + commit on approve), `pro.$slug.index.tsx` (read primary from `pro_titles`), `cpd.functions.ts` (call rules engine on submit/approve).

## Order of build

1. Seed `profession_titles` + `title_rules` + write `title-rules.ts` with unit tests.
2. Migration + `titles.functions.ts`.
3. Wire admin approve to commit `pro_titles`.
4. Dashboard CPD "Titles unlocked" panel + locked roadmap.
5. Profile editor: replace profession Select with earned picker.
6. Public profile: read primary title from `pro_titles`.
7. (Optional v1.5) `/verify/<token>` trust receipts + `/admin/titles`.

This is the right move. It's the one feature competitors literally cannot copy without rebuilding their whole trust model.