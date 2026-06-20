# Wire the Qualifications & Credentials section

Right now the panel is hard-coded to `pro.qualifications` from the fixture map. For DB‑backed pros (like `katie-gibbs`), `proFromDb` sets `qualifications: []`, so the panel renders blank with a misleading "View all qualifications (3)" link.

## What to change

### 1. Server: surface approved qualifications

Edit `src/lib/profile/public-profile.functions.ts` (`getPublicProfileBySlug` only):

- After fetching the pro row, also query `verification_submissions` for that `professional_id` where `status = 'approved'`, ordered by `issue_date desc nulls last, created_at desc`.
- Select: `id, awarding_body, awarding_body_slug, qualification, qualification_number, issue_date, year, expiry_date, regulator_verified`.
- Return a new `qualifications` array on the response shape.

(No change to `listPublishedProfessionals` — list cards don't need this.)

### 2. Route: map DB rows into the existing `Qualification` shape

In `src/routes/pro.$slug.index.tsx`, inside `proFromDb`, build `qualifications` from `db.qualifications` using the existing shape `{ id, title, issuer, badge, issued }`:

- `title` → `qualification` (Title-cased; the row stores it ALL CAPS like "NCFE LEVEL 3 CERTIFICATE…", convert to sentence/Title case so it matches the design).
- `issuer` → `awarding_body`.
- `badge` → 3–4 char code derived from `awarding_body_slug` (uppercased) or initials of `awarding_body` (e.g. "NCFE", "YMCA").
- `id` → `qualification_number` if present, otherwise the short submission id (`first 8 chars`).
- `issued` → formatted `issue_date` ("Dec 2017") or fallback to `year` as string.

### 3. UI: honour the real count + handle empty state

In the same file, around the existing block (lines 661–696):

- Replace the hard-coded `View all qualifications (3)` with `View all qualifications ({pro.qualifications.length})`, and hide the link entirely when the count is 0.
- When `pro.qualifications.length === 0`, render a quiet empty state inside the card:
  - Muted line: "Verified qualifications will appear here once added." (text-[13px] text-reps-muted-light).
  - Keeps the card height reasonable so the right‑hand Trust panel still aligns.
- Keep the existing "Verified" green tick only when the row has `regulator_verified = true`; otherwise show a neutral "Approved" label so we don't overstate Ofqual cross‑checks.

## Out of scope

- Fixtures (`james-carter`, etc.) keep their current static qualifications.
- No new tables, no migration, no schema changes.
- Insurance / CPD points are not part of this wire-up (Trust panel stays as-is for now).
- No change to the dashboard or admin moderation flows.

## Verification

After the build, visit `/pro/katie-gibbs#qualifications`:
- Shows one row: "NCFE Level 3 Certificate in Personal Training", issuer "NCFE", badge "NCFE", Issued "Dec 2017", "Approved" label (not "Verified" — `regulator_verified=false`).
- Footer reads "View all qualifications (1)".

Visit `/pro/james-carter#qualifications` — unchanged (fixture path).
