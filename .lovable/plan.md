## Goal

Two related improvements on the verification surface:

1. **Add QR upload to certificates** — mirror the insurance "Scan with phone" flow so trainers can photograph a certificate on their phone and have it land back in the desktop dialog automatically.
2. **Polish pass on the 3-stage verification page** (`/dashboard/verification`) — tighten copy, spacing, status states, and consistency between the three stages (Identity / Insurance / Qualifications).

---

## Part 1 — QR upload for certificates

Today, `UploadCertificateDialog` only accepts a direct file pick. Insurance already has a working two-tab pattern (`Upload file` / `Scan with phone`) backed by a short-lived upload session row + a public `/u/insurance/$sessionId` page + polling. We mirror that exactly for certificates.

**New backend (one migration + server fns):**
- New table `certificate_upload_sessions` (id, user_id, status `pending|uploaded|consumed|expired`, doc_path, filename, expires_at, created_at). Mirrors `insurance_upload_sessions`. RLS: owner can read; the public upload page uses a session-id-scoped RPC, not direct table access. Standard GRANTs.
- Server fns in `src/lib/cpd/cpd.functions.ts`:
  - `createCertUploadSession` (auth) → returns `{ id, expires_at }`, 10-min expiry.
  - `getCertUploadSession` (auth, owner-only) → polled by dialog.
  - `markCertUploadConsumed` (auth, owner-only).
  - `uploadCertFromSession` (public, session-id-scoped) → accepts file bytes from the phone page, writes to existing `cpd-certificates` bucket under a session-scoped path, flips status to `uploaded`.

**New public route:**
- `src/routes/u.cpd.$sessionId.tsx` — mobile-first single-purpose page: "Take a photo or upload your certificate". Same UX as `u.insurance.$sessionId.tsx`. Validates session is still `pending` and unexpired before showing the picker. No auth required (session id is the capability).

**Dialog changes (`src/components/cpd/UploadCertificateDialog.tsx`):**
- Wrap the current "pick file" panel in shadcn `Tabs` with two triggers: `Upload file` (existing) and `Scan with phone` (new), exactly matching `InsuranceUploadDialog`.
- QR tab renders `QRCodeSVG` (already in deps) pointing at `${origin}/u/cpd/${sessionId}`.
- Poll `getCertUploadSession` every 2s while the QR tab is open; on `uploaded`, advance to the existing `extracting` step and run the same `extractCertificateFields` → `confirm` flow.
- Show session expiry time under the QR. Reset session id on dialog close.

No change to the confirm/submit step — the file just enters the pipeline from a different source.

---

## Part 2 — Polish pass on `/dashboard/verification`

Goals: make the three stages feel like one coherent ladder, tighten status states, and fix the small inconsistencies that have accumulated.

**Page header (`dashboard_.verification.tsx`):**
- Tighten subtitle to one sentence; remove duplicate "trust layer" wording that already lives in `TrustBlock`.
- Show a single progress chip strip (Identity · Insurance · Qualifications) with consistent earned/pending/action states using the locked emerald-only-for-status tokens (`border-emerald-400/30 bg-emerald-500/15 text-emerald-300`). Pending = amber; action-needed = white/15 ghost; never decorative colour.
- Add a top-right `Step X of 3 complete` count for at-a-glance progress.

**Per-stage cards (in `TrustBlock`):**
- Normalise the three section headers to the same shape: number chip · title · status badge · short helper line. Today Identity and Insurance differ slightly from Qualifications.
- Standardise the empty-state CTA wording:
  - Identity: "Verify your identity" (unchanged hard-gate copy)
  - Insurance: "Upload insurance"
  - Qualifications: "Add a certificate"
- For pending states, show the same "In review — usually within 24h" line across all three.
- For approved states, show `Verified · <date>` consistently.
- Pull the "Scan with phone" affordance into the Qualifications card empty-state helper text ("…or scan it with your phone — we'll read it for you"), matching the existing Insurance copy.

**Spacing + radii:**
- Audit and normalise: large stage panels = 22px, inner status/info strips = 16px, badges = pill. Replace any stray `rounded-xl/2xl` per the locked radius rule.
- Vertical rhythm between the three stage cards: consistent `gap-4`.

**Copy:**
- Remove the "earn your REPS credential" line if it duplicates the page subtitle.
- Make sure no banned phrases ("booking fee", "UK", "CIMSPA", "flat plan") have crept in.

**Out of scope (explicit):**
- No change to identity hard-gate logic (already shipped).
- No change to the verification prompt dialog.
- No change to admin moderation pages.
- No change to public profile rendering of trust ticks.

---

## Technical notes

- Reuse `qrcode.react` (already a dep — used by insurance).
- Reuse the `cpd-certificates` storage bucket; just add a `sessions/<sessionId>/` path prefix for QR-originated uploads, then move/copy into the user's normal path on `consume` (same trick used for insurance).
- Session expiry = 10 minutes, matching insurance.
- Migration includes the four-step pattern: `CREATE TABLE` → `GRANT` (authenticated + service_role; no anon) → `ENABLE RLS` → `CREATE POLICY` (owner read, owner update on consume; insert via SECURITY DEFINER RPC).
- Polish work is presentation-only — no business logic changes outside the new QR pipeline.

---

## Deliverables

1. Migration: `certificate_upload_sessions` + grants + RLS.
2. `src/lib/cpd/cpd.functions.ts` — 4 new server fns.
3. `src/routes/u.cpd.$sessionId.tsx` — public phone upload page.
4. `src/components/cpd/UploadCertificateDialog.tsx` — Tabs + QR panel + polling.
5. `src/routes/_authenticated/_professional/dashboard_.verification.tsx` + `src/components/dashboard/verification/TrustBlock.tsx` — polish pass per above.
