# Step 1b — Cert upload: 10/10 hardening pass

This is a focused polish + trust pass on the flow we just shipped. No redesign of the dashboard, no new pages yet. It directly answers your three questions and adds the gaps that separate a "we read your PDF" tool from a real verification engine.

---

## A. Your three direct questions

### 1. The green banner is unreadable

That's a contrast bug — emerald text on a cream Dialog background. Two fixes:
- Switch the AI-prefill banner to the standard dark `bg-reps-panel-soft` + emerald icon + white text we use elsewhere. Cream/light dialog background stays for readability of the form.
- Add a confidence pill on the banner: `AI confidence: 92%` (high / medium / low chip) so the pro instantly knows whether to trust the prefill.

### 2. Qualification number vs certificate number — yes, we need both

Looking at your NCFE cert there are **two distinct numbers** and we're conflating them:
- **Qualification Number** `500/8513/X` → this is the Ofqual register key. Every regulated qual has one. This is what tells us "this is a real, regulated qualification". This is the lookup key.
- **Certificate Number** `50783547` → this is the learner-specific cert serial. Different field, different purpose (anti-fraud, complaint chain back to awarding body).
- Plus: **Learner Number** `103864322` and **Centre Number** `8466641` — useful for chain-of-custody when an admin or awarding body needs to confirm.

We'll capture all four, but only the first two are user-facing fields on the form. Learner/Centre go into the AI-extracted JSON for the admin reviewer.

### 3. Are we keeping the certificate file? — Yes, and we should be clearer about it

Today: the file already goes into the private `verification-docs` Supabase storage bucket, hashed (SHA-256), keyed by user id, RLS-locked. It's retained for the life of the submission so admin can review it and so the public `/verify/{token}` page can show "verified against original document on file".

What to add:
- Make this explicit in the upload dialog: "Your certificate is stored privately and only visible to you and REPs admins. We keep it on file so we can stand behind your verification."
- Show a thumbnail of the uploaded file in the confirm step (so the pro can see we actually got the right page).
- A "delete original file" option after verification approval (we keep the **hash + metadata**, lose the binary). GDPR-friendly, still defensible.

---

## B. What was missing that hurt your test today

Walking through your NCFE upload:
- **NCFE wasn't in our awarding-body list** → AI correctly read "NCFE" but had to fall back to "Other (specify)". Fix: NCFE is one of the biggest UK Ofqual awarding bodies for fitness — add it plus the obvious gaps (NCFE, OCR Cambridge, Pearson, City & Guilds, AIM Qualifications, Open Awards, TQUK, Gateway Qualifications, ProTrainings, EMD UK).
- **Issue date came back as "2017" only** → full date `10/11/2017` was on the cert. Fix the prompt to require ISO date and split "Issue year" → "Issue date (dd/mm/yyyy)".
- **CIMSPA/SkillsActive/Ofqual badges in the corner went unused** → these are positive trust signals the AI should flag back so the admin reviewer sees "✓ Ofqual badge detected, ✓ CIMSPA endorsement detected, ✓ awarding-body wordmark match" before they even open the doc.

---

## C. The thing that takes this to 10/10: live Ofqual cross-check

This is the single biggest trust upgrade and it's specific to regulated quals.

When the AI returns a **Qualification Number** in Ofqual format (`NNN/NNNN/X` regex), we hit the public Ofqual register API:

```
https://register.ofqual.gov.uk/api/v2/Qualifications/{qual_no}
```

…and we get back the official record: awarding body, full title, level, status, regulator dates. We then run three deterministic checks on the submission:

```
[ Ofqual qual no on certificate ] ──→ Ofqual register API
                                       │
                                       ▼
  ✓ Awarding body matches register (NCFE)
  ✓ Qualification title matches register (within fuzzy threshold)
  ✓ Qualification is currently/historically Live on the register
  ✓ Level matches (Level 2)
```

If all four pass, we attach a **`regulator_verified: true`** flag to the submission. The admin reviewer sees a green "Ofqual-verified — matched on title, body and level" panel and approval becomes a one-click confirm instead of detective work.

We cache the Ofqual response so we don't refetch on every view, and we refresh weekly. If the register is down we fall back to manual review — never block a pro because gov.uk is having a moment.

This means: **regulated qualifications get a stronger, government-backed verification** ("Ofqual register-matched"), and the unregulated ones (UKSCA, NASM, Mac-Nutrition Uni, etc.) get our standard admin-eyes verification. The trust ladder on the public profile can distinguish the two: `Qualifications verified (3) — 2 Ofqual-matched`.

---

## D. Everything else in this pass (the polish that adds up to 10/10)

Grouped by the value it unlocks:

**Higher AI accuracy**
- Switch model to `google/gemini-2.5-pro` for cert extraction (image+text reasoning matters here more than latency; cost is fine for ~1 call per submission).
- Stricter prompt: ask for both date formats, explicit Ofqual qual-no field, trust-badge detection (CIMSPA/SkillsActive/Ofqual REGULATED stamp), watermark/seal detection.
- Pre-pass on PDFs: extract embedded text first (cheap, deterministic) and feed the AI both the text AND the rendered image — kills 80% of OCR misreads.
- Per-field confidence (not just overall). Fields below 0.6 stay blank rather than being filled with a guess.

**Better upload UX**
- Drag-and-drop zone + paste-from-clipboard + mobile camera capture (`capture="environment"`).
- Live thumbnail of the uploaded file in the confirm step.
- Multi-file: front + back, or main cert + unit summary, up to 5 files per submission.
- Auto-rotate / deskew warning if the AI can't read it confidently → "Photo looks tilted — retake?" toast with retake button.
- Loading microcopy ("Reading awarding body…", "Cross-checking Ofqual register…", "Almost done…") instead of a single spinner — feels 2x faster.

**Stronger fraud signals (server-side, surfaced to admin only)**
- Tamper signal: parse PDF metadata; flag any sign of edit-after-creation (modify date >> creation date, common editor signatures).
- Image-edit signal: EXIF check on JPGs/PNGs; flag Photoshop/Affinity producers.
- Name match strength: levenshtein distance, not just exact match (handles `SCOTT PARKER` vs `Scott Parker` vs `Scott S. Parker`).
- Duplicate detection across the whole platform (already shipped via SHA-256) — surface it in the admin panel with a link to the other submission.
- All signals are advisory — they help the human admin, they never auto-reject.

**Trust output (what the pro and the public see)**
- Submission detail in dashboard: chip row for each signal — `Ofqual-matched`, `Name match: exact`, `File hash recorded`, `AI confidence: high`.
- Public `/verify/{token}` page (already planned for Phase B) gets a "How we verified this" expander listing the same checks, dated and signed by the reviewing admin's initials.

**Operational guardrails**
- Rate-limit extractions per user: 10/day, 3/min. Stops accidental loops from chewing credits.
- File-type validation server-side (PDF, JPG, PNG, HEIC). HEIC gets converted on upload.
- Max file size stays 10MB; multi-page PDFs trimmed to first 5 pages before AI sees them.

---

## E. Out of scope for this pass

To keep this shippable in one go:
- Stripe Identity gate (still Phase B as agreed).
- DBS / insurance certificate upload (later step — same infrastructure but different verification rules).
- Endorsement-from-peers / video proof / interview check — Phase 3 ideas, not now.
- Multi-cert single-PDF auto-split (e.g. one PDF with 4 different certs in it) — needs more product thinking; for now we ask the pro to upload one cert per submission.

---

## Technical summary (for reference)

- `src/lib/cpd/awarding-bodies.ts` — add ~10 missing bodies; add `ofqualPattern?: RegExp` per body where applicable.
- `src/lib/cpd/cpd.functions.ts` — switch model, expand prompt + Zod schema (qualification_no, learner_number, centre_number, trust_badges, tamper_signals, per-field confidence), add PDF text pre-extraction, rate-limit middleware, Ofqual API call (`lookupOfqualQualification`), tamper signal extractors.
- `src/lib/cpd/ofqual.server.ts` (new) — fetch + 7-day cache against `register.ofqual.gov.uk`.
- Migration: add `qualification_number`, `learner_number`, `centre_number`, `regulator_verified`, `regulator_record jsonb`, `trust_signals jsonb`, `tamper_signals jsonb` to `verification_submissions`. Add `ofqual_cache` table.
- `UploadCertificateDialog.tsx` — fix banner contrast, add confidence pill, add thumbnail, add drag/drop + camera, split issue year → issue date, add qualification-number field, add multi-file, add per-field "AI" badges.
- `CertificateCard.tsx` — show `Ofqual-matched` chip when applicable.
- Storage: keep `verification-docs` bucket as-is; add "delete file after approval" toggle (defaults off).

After approval I'll ship this in one pass. Phase B (Stripe Identity + public `/verify/{token}` + TrustLadder on public profile + expiry nudges) follows once you've test-driven this on a couple of real certs.