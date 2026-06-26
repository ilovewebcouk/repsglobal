## What I'll change (admin verification → Step 3 Qualification)

Goal: stop hiding what we already know, fix the body-name false-negatives, and let the reviewer trigger a fresh lookup on the spot.

### 1. Show the actual Ofqual record (not just a green/amber pill)
Today we fetch and store the full record in `verification_submissions.regulator_record` but render only `regulator_verified ? "Ofqual-listed" : "Manual check"`. I'll surface a compact panel under the qualification block:

```
Ofqual register · 601/4534/8
Title              Level 3 Diploma in Personal Training
Awarding org       Innovate Awarding Organisation Limited
Level              Level 3
Status             Available to learners
Body match         ✓     Title match  ✓     Status live  ✓
                                              [ Open on Ofqual ↗ ]
```

Three sub-checks rendered individually so reviewer can see *why* it's amber instead of guessing.

### 2. Fix awarding-body matching (alias table + slug-first)
The current substring compare is the only reason recognised bodies (Innovate, IAO, Active IQ Ltd, NCFE-CACHE, YMCA Awards Ltd, etc.) get flagged "Manual check". I'll:

- Extend `src/lib/cpd/awarding-bodies.ts` with an alias map: `slug → string[]` of accepted Ofqual `OrganisationName` variants (and reverse acronyms like IAO ↔ Innovate Awarding).
- In `lookupOfqualQualification`, match by **slug + alias list first**, fall back to bidirectional substring. Single source of truth used by both the live lookup and the admin pill.

### 3. Add a "Re-check Ofqual now" button (admin)
A small button next to the Ofqual panel that calls a new authenticated server function `recheckOfqualForSubmission({ submissionId })`:

- Admin-only (verified via `has_role`).
- Bypasses the 7-day cache (force refetch).
- Updates `regulator_verified`, `regulator_record`, and `trust_signals.ofqual` on the row.
- Returns the new state so the panel updates without a page reload.

Covers (a) Ofqual was down at upload time, (b) the qualification number was edited later, (c) admin wants the freshest data before approving.

### 4. Better Ofqual link
Today we link to `Search?Query=…`. When we have the qual number we'll link straight to the canonical qualification page: `https://register.ofqual.gov.uk/Qualification/Details/{qn}` (with the search link as fallback for non-Ofqual numbers).

### 5. Holder name cross-check uses identity-verified name
`cpd.functions.ts` already compares `holder_name` vs `identity_verified_name`, but the admin Step 3 panel compares OCR holder vs **profile** name (which can be edited and is locked only after ID approval). I'll switch the admin panel comparison to `identity_verified_name` when present, falling back to profile name — same logic as the upload path, so the green "matches" badge is meaningful.

### 6. Keep cert-number lookup honest
Cert-number-level verification (was this specific certificate issued to this person?) cannot be automated for most UK awarding bodies — they don't expose public learner-record APIs. I'll **not** pretend to verify it. Instead the deep-link strip stays, plus a one-line explainer so reviewers understand the split:

> *Ofqual confirms the qualification exists. The awarding body confirms this learner holds it — use the link below.*

### 7. Small cleanup
- Cache write also when `record===null` (already done) but add `last_error` column so repeated 5xx are visible to admin.
- Threshold tweak: title similarity from 0.5 → 0.6 to cut false positives.

## Technical details

Files touched:
- `src/lib/cpd/ofqual.server.ts` — alias-aware body matching, force-refresh flag.
- `src/lib/cpd/awarding-bodies.ts` — `OFQUAL_BODY_ALIASES: Record<slug, string[]>`.
- `src/lib/verification/verification.functions.ts` — new `recheckOfqualForSubmission` server fn (admin-gated).
- `src/routes/admin_.verification.tsx` Step 3 block — render record panel, sub-checks, re-check button, fixed link, identity-name compare.
- `src/components/verification/CertDrawer.tsx` — same record panel for consistency.

No DB migration required (record already in `regulator_record`). Optional follow-up: add `ofqual_cache.last_error text` column if we want surfaced error reasons — flag and I'll include it.

No UX/data changes for Pros — this is admin-side clarity + accuracy only.
