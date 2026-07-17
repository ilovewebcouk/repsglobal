# Training Provider Verification — QA Report & Fix Plan

## What was audited
Full read-only trace of the provider course/qualification upload flow, admin verification surfaces, RLS/grants, storage buckets, and the `is_pro_fully_verified` recompute pipeline. Live DB spot-checked against 25 real training-provider rows.

## The good news (confirmed working)
- **Verified badge logic is correct** for training providers. All 25 TPs' computed status matches their signals (identity + name + domain). No drift, self-check trigger never fired.
- **Admin queue + approve/reject** (`adminListRepsCourseQueue`, `adminDecideRepsCourse`, `adminListRegulatedQueue`) all use `has_role`-based `requireAdmin` — no bypass paths.
- **Tier gating** (`assertCallerIsTrainingProvider`) correctly refuses admins and non-TP accounts, no silent auto-create.
- **RLS on `reps_courses` / `provider_regulated_permissions`** correctly scopes public/owner/admin with status-transition guards.
- **Storage RLS** on `course-accreditations` / `verification-docs` scoped by `auth.uid()` folder prefix with admin carve-out. Signed-URL fns gate on ownership-or-admin.
- The recent `reps_course_evidence.course_id` nullable migration works — `submitRepsCourse`, `listRepsCourseEvidence`, `removeRepsCourseEvidence` all handle null safely.

## Issues found

### P1 — Orphaned staged evidence, no resume, no cleanup
**Symptom:** If a provider opens "Request REPS endorsement", uploads files, then closes the dialog without submitting, the `reps_course_evidence` rows (with `course_id = NULL`) and their storage objects are permanently orphaned. No UI to resume, no admin visibility, no TTL.

**Confirmed live:** 4 orphan rows exist right now for one provider, all uploaded within a 45-second window — exactly the abandoned-dialog pattern.

**Where:** `src/routes/_authenticated/_professional/dashboard_.qualifications.tsx:1072-1274` (`AddCpdDialog`) — evidence IDs live only in local React state; dialog unmounts on close; `resetAll()` only runs on successful submit.

**Root cause:** The nullable-`course_id` staging design assumes the client keeps evidence IDs across the session, but there's no persistence (no `listMyUnattachedEvidence` server fn, no localStorage cache). Once the dialog unmounts, ids are gone.

**Fix:**
1. Add `listMyUnattachedEvidence` (provider-scoped, `course_id IS NULL`) and hydrate `AddCpdDialog` on open.
2. Add a scheduled cleanup (pg_cron → public webhook route) deleting `reps_course_evidence` rows + storage objects where `course_id IS NULL AND created_at < now() - interval '48 hours'`.

### P1 — Storage/DB drift on course-accreditations bucket
**Confirmed live:** 14 files in storage under one provider's folder, only 4 matching `reps_course_evidence` rows → 10 objects with no DB row. 45 MB today, unbounded growth.

**Where:** `src/lib/qualifications/qualifications.functions.ts:1100-1143` (`removeRepsCourseEvidence`) — deletes DB row first, then swallows storage-remove errors in try/catch. Any transient storage failure leaves a permanent dangling object.

**Fix:** Reverse the order (remove storage object first, then DB row) or add a reconciliation cron that diffs `storage.objects` against `reps_course_evidence.file_path` and deletes true orphans. Also one-off cleanup of the current 10 dangling objects.

### P2 — `reps_course_evidence.course_id` reassignment not RLS-guarded
**Where:** Policy `"Providers manage own evidence"` in `20260710111040_*.sql` — only checks `provider_id = auth.uid()`, doesn't verify the target `course_id` belongs to the same provider.

**Root cause:** Application code (`submitRepsCourse`) enforces this correctly, but a provider calling the Supabase client directly could `UPDATE reps_course_evidence SET course_id = <competitor's course id>` and pollute another provider's evidence set as seen by the admin review UI.

**Fix:** `BEFORE UPDATE` trigger that rejects `course_id` changes unless the target course's `provider_id` matches `NEW.provider_id`.

### P2 — Dead table `course_accreditation_files` with broken RLS
**Where:** Its policy `"Org members can view their course files"` references `public.courses`, which was dropped in `20260715062059_*.sql`. Table has zero server-fn references (fully dead from the pre-TP-pivot org model).

**Fix:** `DROP TABLE public.course_accreditation_files` (and its policy) as schema hygiene.

### P3 — No admin visibility into stuck/abandoned submissions
No queue, no metrics for `course_id IS NULL` staged rows or `reps_courses` stuck in intermediate status. Once real submissions exist, ops will be flying blind.

**Fix:** Add a small "Abandoned staging" widget on the admin verification dashboard (count + newest 5) so ops can spot patterns.

## Implementation order (when you switch to build mode)

1. **Migration** — cleanup cron table + trigger to guard `course_id` reassignment + drop `course_accreditation_files`.
2. **`listMyUnattachedEvidence` server fn** + wire into `AddCpdDialog` on open.
3. **Cleanup job** — public webhook route `/api/public/cron/reps-evidence-cleanup` (secret-verified) that deletes 48h+ orphans and their storage objects; register pg_cron.
4. **One-off reconciliation** — script/query to delete the 10 known dangling storage objects for provider `859e3aa1-…`.
5. **Fix `removeRepsCourseEvidence` order** — storage first, then DB.
6. **Admin widget** — orphan count on the verification dashboard.

## Technical notes
- All fixes are backend/server-fn/migration. No visual changes to any locked page.
- No user-facing "BD migration" or "legacy" language introduced.
- Cleanup cron follows the `/api/public/*` webhook pattern with HMAC verification.
- Trigger uses `SECURITY DEFINER` with pinned `search_path = public` to look up `reps_courses.provider_id` under RLS-bypass (safe: only reads a single indexed column).

Approve to proceed with build, or tell me which items to drop/reorder.