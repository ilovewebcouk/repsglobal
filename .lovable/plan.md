## Two fixes

### 1. Impersonation for the Qualifications tab
`src/lib/qualifications/qualifications.functions.ts` uses `requireSupabaseAuth`, which returns the admin's own `userId` even during an active impersonation session — so "Viewing as Test Profile" showed Scott's 3 approved rows instead of Test Profile's (zero).

Swap the middleware to the existing impersonation-aware variant on the read + write server fns that scope by `provider_id = userId`:

- Change import: `requireSupabaseAuth` → `requireSupabaseAuthWithImpersonation` from `@/integrations/supabase/auth-middleware-impersonation`.
- Apply to every `.middleware([requireSupabaseAuth])` in this file: `listMyRegulatedPermissions`, `listMyCpdCourses`, `submitRegulatedPermissionBatch`, `removeMyRegulatedPermission`, `submitCpdCourse`, `deleteMyCpdCourse`, `resolveOfqualNumber`, and the other current entries (lines 113, 178, 250, 325, 340, 420, 463, 478, 503, and any remaining ones the audit finds).

Result: while admin impersonates Test Profile, the Qualifications & Courses page reads and writes against Test Profile's rows, matching every other impersonated dashboard surface.

### 2. "Approved centre" pill — driven by real data

Currently the pill on `/t/$slug` is a hardcoded label printed on every provider profile (`src/routes/t.$slug.index.tsx:538` and `:576`). It has no relation to what the provider uploaded.

The real signal we have is per-qualification: `provider_regulated_permissions.status = 'approved'` (admin-approved evidence — EQA report, centre certificate, or awarding-body letter — uploaded via `/dashboard/qualifications`). If a provider has ≥1 approved permission for a given awarding body, they are, by definition, an approved centre for that body.

Changes in `src/routes/t.$slug.index.tsx`:

- **Section-header pill (line 538–541, "Approved centre"):** only render when `accreditationsByBody.length > 0`. Otherwise omit it — the empty state already explains "Once REPS has verified this provider's approved-centre status…".
- **Per-body pill (line 574–577, "Approved centre · Ofqual-regulated"):** keep as-is — it already only renders when the body has ≥1 approved qualification row, so it's already truthful. No change needed beyond confirming.

No schema changes. No changes to admin verification flow (admins still approve each qualification's evidence — that IS the approved-centre verification).

### Out of scope
- Redesigning the badge, changing copy, or adding a new "centre-level" verification concept.
- Touching the dashboard's `Approved` per-row badge (already correct — reflects `status`).
- Any change to `provider_regulated_permissions` schema or admin review UI.

### Verification
1. As admin, impersonate Test Profile → `/dashboard/qualifications` should show **zero** rows (Test Profile has none in DB), not Scott's 3.
2. Exit impersonation → Scott's dashboard shows his 3 approved quals again.
3. Public `/t/test-profile` Accreditations block: no "Approved centre" pill in the section header (empty state only).
4. Public `/t/<slug-of-a-provider-with-approved-quals>`: pill visible in header, and each awarding body shows its per-body "Approved centre · Ofqual-regulated" line.

### Files touched
- `src/lib/qualifications/qualifications.functions.ts` (middleware swap only)
- `src/routes/t.$slug.index.tsx` (conditional render on the section-header pill)