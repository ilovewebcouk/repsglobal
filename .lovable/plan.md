# Verification 10/10 — full build

Two halves: (A) admin **review workspace** redesign, (B) pro **submission flow** for the missing artefacts (ID, selfie, insurance + cross-checks). Empty states everywhere until the pro side catches up, so admin ships first and degrades gracefully.

## A. Admin review workspace `/admin/verification`

Two-pane operating console (queue left, deep-dive right), built with `DashboardShell` + dashboard primitives so it feels like the rest of `/dashboard`.

### Layout

```text
┌──────────────────────────────────────────────────────────────────────────────┐
│ Top strip: Queue 12 · SLA breach 1 · You today 4 · Avg 6m 12s                │
├─────────────────────┬────────────────────────────────────────────────────────┤
│ QUEUE (320px)       │ REVIEW WORKSPACE                                       │
│  filters            │ ┌───────── Pro header ─────────────────────────────┐  │
│  ─ all / mine /     │ │ Avatar · Katie Gibbs · Lowestoft                 │  │
│    flagged / SLA    │ │ Submitted 28m · SLA 23h 32m · "Claim" button     │  │
│  sort: oldest       │ └──────────────────────────────────────────────────┘  │
│  ─────────────      │ ┌── Identity ──┐ ┌── Insurance ──┐ ┌── Certs ──┐    │
│  • Katie Gibbs ◀    │ │ photo ID +   │ │ provider, dox,│ │ 1+ certs  │    │
│    NCFE L3 · 28m    │ │ selfie match │ │ expiry, value │ │ + Ofqual  │    │
│  • Sam Khan         │ │ name/DOB ✓   │ │ exp 2026-09   │ │ result    │    │
│    YMCA L2 · 1h     │ └──────────────┘ └───────────────┘ └───────────┘    │
│  • Lisa Chen ⚠      │                                                       │
│    Insurance · 4h   │ ┌── Cross-checks ──────────────────────────────────┐  │
│    SLA-flagged      │ │ name on cert == ID ✓  ·  DOB plausible ✓         │  │
│                     │ │ duplicate email ✗ · device clean · file integrity│  │
│                     │ └──────────────────────────────────────────────────┘  │
│                     │ ┌── Will unlock ────────────────────────────────────┐ │
│                     │ │ Tier → Verified £99/yr                            │ │
│                     │ │ Title → Personal Trainer (L3)                     │ │
│                     │ │ Specialisms → none                                │ │
│                     │ └───────────────────────────────────────────────────┘ │
│                     │ ┌── Decision ───────────────────────────────────────┐ │
│                     │ │ Reviewer notes [required for reject]              │ │
│                     │ │ ☐ Identity matches cert                            │ │
│                     │ │ ☐ Insurance current & adequate                     │ │
│                     │ │ ☐ Qualification verified                           │ │
│                     │ │ [Reject] [Request changes] [Approve → Verified]   │ │
│                     │ └───────────────────────────────────────────────────┘ │
├─────────────────────┴────────────────────────────────────────────────────────┤
│ Recent decisions (last 20) — reviewer · time-to-decision · outcome · notes   │
└──────────────────────────────────────────────────────────────────────────────┘
```

Empty-state behaviour: every panel (Identity, Insurance, Certs, Cross-checks) renders a clean shadcn `Empty` block when the pro hasn't uploaded that artefact yet, with a "Send reminder" action that emails them what's missing. Admin can still approve a Verified tier on cert-only if insurance/ID are stubbed, but the Approve button shows a tier downgrade hint ("This pro can only be marked Verified without insurance + ID; Pro tier requires both").

### Queue behaviours

- **Claim case**: optimistic lock — `verification_submissions.claimed_by` + `claimed_at`; auto-release after 15 min. Two admins can't open the same case.
- **Filters**: All / Mine / Flagged / SLA-risk (<2h) / By tier target.
- **Sort**: Oldest, SLA-risk, Highest-tier target.
- **Realtime**: subscribe to `verification_submissions` on `status=pending` so the queue updates live.
- **Keyboard**: `J/K` next/prev in queue, `A` approve focus, `R` reject focus, `?` shortcut help.

### Decision pipeline

`reviewVerification` already commits derived titles + specialisms. Extend to:
- Required reviewer note when `decision !== 'approved'`.
- Required checklist completion stored in `verification_submissions.review_checklist jsonb`.
- Audit row in new `verification_decisions` (immutable log, never updated).

## B. Pro submission flow (the missing data)

New unified flow at `/dashboard/verification` replacing the current single dialog. Stepper with skip-anywhere + persist-as-you-go.

### Steps

1. **Identity** — photo ID (passport / driving licence / national ID), front + back if applicable. Capture from camera **or** file upload.
2. **Selfie / liveness** — phone camera, single shot with a head-turn prompt. Hash + stored encrypted; never shown on public profile.
3. **Qualification certificates** — existing CPD upload flow (already built). Ofqual lookup auto-runs.
4. **Insurance** — provider name, policy number, cover amount, expiry date, certificate upload. Hard expiry — pro gets reminded 30/14/7/1 days out; insurance lapse downgrades tier to Free until renewed.
5. **Review & submit** — checklist of what you've done, what's missing, what unlocks at each tier.

### Data model (additions)

```text
identity_documents
  id, professional_id, doc_type (passport|driving|national_id),
  doc_country, doc_path, selfie_path, selfie_match_score,
  liveness_passed, name_on_doc, dob_on_doc, expiry,
  status (pending|approved|rejected), reviewed_by, reviewed_at, notes,
  file_sha256, created_at, updated_at

insurance_policies
  id, professional_id, provider, policy_number, cover_amount_gbp,
  start_date, expiry_date, doc_path, file_sha256,
  status (active|pending|rejected|expired), reviewed_by, reviewed_at, notes,
  created_at, updated_at

verification_decisions  (immutable audit log)
  id, submission_id, reviewer_id, decision, notes, checklist jsonb,
  unlocked_tier, unlocked_title_slug, unlocked_specialisms text[],
  created_at
```

All three get RLS + GRANTs (authenticated for owner-read, service_role for admin). Storage buckets `identity-docs` and `insurance-docs` (both private, signed URLs only).

### Cross-checks (server, on submit + on review)

- `name_on_doc ≈ name_on_cert ≈ profile.full_name` → similarity score.
- `dob_on_doc` plausible (18+, < 90).
- Selfie ↔ ID photo similarity (deferred — stub returns null until provider chosen; UI shows "Pending automated check").
- Duplicate detection: same `file_sha256`, same email/phone, same address across pros → flag.
- File integrity: PDF signed? Image EXIF stripped? Pages match?

Each surfaces as a chip in the admin "Cross-checks" panel with ✓ / ⚠ / ✗.

### Reminders

`/admin/verification` → "Send reminder" button writes to existing email queue (`enqueue_email`) with a templated nudge listing what's missing. Auto-reminders at 7d / 30d for stalled submissions.

## C. Public trust receipt `/verify/$token`

Already partially built (`get_public_verify_record` function exists). Add:
- Insurance status (current / expired — no policy details exposed).
- ID-checked badge (yes/no, no document data).
- Verified title + specialisms.
- "Last reviewed by REPs on …" line.

## Out of scope

- No third-party liveness API integration yet (Onfido / Persona / Veriff) — stub the score column; we'll plug a provider after admin flow is shipped and you've picked a vendor.
- No automated insurance verification (no public API). Manual admin review only.
- No SLA escalation pings to Slack/email — just visible on the queue.

## Build order

1. **Migration** — add `claimed_by`/`claimed_at`/`review_checklist` to `verification_submissions`; create `identity_documents`, `insurance_policies`, `verification_decisions`; storage buckets.
2. **Admin two-pane workspace** — wire to existing data first, render `Empty` for identity/insurance/cross-checks. Already-usable for current queue (just cert flow) on day one.
3. **Pro upload flow** — `/dashboard/verification` stepper. Identity → Selfie → Insurance steps (cert step reuses existing).
4. **Cross-checks engine** — name/DOB similarity, duplicate detection, file integrity. Run on submit and on demand from admin.
5. **Reminders + decision audit log** — email templates, immutable `verification_decisions` writes on every review action.
6. **Trust receipt update** — insurance + ID-checked chips on `/verify/$token`.

## Questions before I build

1. **Selfie/liveness provider** — pick now (Onfido / Persona / Veriff / Stripe Identity), or stub for v1 and wire later?
2. **Insurance minimums** — is there a minimum cover amount we should enforce (£1m / £2m / £5m public liability)? Reject below threshold or just warn?
3. **Verified vs Pro tier gating** — should Verified require only qualification + ID, while Pro additionally requires insurance? Or all three for both?
4. **Existing pros** — backfill plan for the ~handful of approved cert-only pros. Grandfather them and prompt for ID/insurance at next renewal, or freeze their `is_published` until they complete?
