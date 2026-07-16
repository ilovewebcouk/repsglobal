# Verification queue bug — root cause + fix + full QA audit

## What actually happened

Reproduced from live data (admin `kate_pt@icloud.com`, target `Diverse Trainers`):

| # | Time (UTC) | Event |
|---|---|---|
| 1 | 06:47:24 | Admin `kate_pt` started impersonation of Diverse Trainers. Session `ends_at = 07:17:24` (30 min). |
| 2 | 07:17:24 | Session expired. `ended_at` was never set. |
| 3 | 07:18:11 | Admin submitted 5 regulated qualifications from the "impersonated" dashboard, ~50s after expiry. |
| 4 | 07:18:11 | A **brand-new `professionals` row** was created for the admin's own user id (`account_type='individual'`, slug `kate-pt-icloud-com`, from a trigger that slugifies profile full_name = `kate_pt@icloud.com`). |
| 5 | 07:18:11–12 | 5 `provider_regulated_permissions` rows inserted with `provider_id = admin's user id`, not Diverse Trainers. |

### Two independent bugs collide

**Bug A — silent impersonation expiry.**
`requireSupabaseAuthWithImpersonation` (`src/integrations/supabase/auth-middleware-impersonation.ts`, lines 74–85) reads the session, sees `ends_at < now`, and **silently falls back to the admin's own identity** — no error, no signal to the client. The impersonated dashboard's mutation therefore executes as the admin. No route or query on the client polls impersonation status and evicts the admin when the session expires.

**Bug B — provider self-registration via `upsert`.**
`submitRegulatedPermission` and `submitRegulatedPermissionBatch` in `src/lib/qualifications/qualifications.functions.ts` (lines 289 and 349) both run:

```ts
await supabase.from("professionals").upsert({ id: userId }, { onConflict: "id" });
```

before the insert. When `userId` is an admin (via Bug A), this **creates a `professionals` row for the admin**, defaulted to `account_type='individual'`. A `set_slug` trigger then generates `/t/kate-pt-icloud-com` from the admin's `profiles.full_name`. The `assertProviderHasTradingName` helper is also toothless for this case: it early-returns when `account_type !== 'training_provider'`, which is exactly what the auto-created row has.

### Why the verification page shows the admin's email + `/t/…`

`admin_.verification.tsx` renders each pending submission by joining `provider_regulated_permissions.provider_id` → `professionals` → `profiles.full_name`. All 5 rows point at the admin's user id, so the queue correctly renders the admin's `full_name` (which happens to be their email) and the auto-generated slug. The verification page itself has no bug — it is faithfully rendering broken upstream data.

## Fix plan

### 1. Data repair (migration)

Move the 5 mis-attributed rows to Diverse Trainers and delete the phantom admin professional row created by the submit.

```sql
-- Reattach the 5 pending qualifications to Diverse Trainers.
UPDATE public.provider_regulated_permissions
   SET provider_id = '26b1329b-ef45-4401-8bf9-07fd59a69660'  -- diverse-trainers
 WHERE provider_id = '64ca3950-7574-465d-a125-52e6b9633b85'  -- admin kate_pt
   AND created_at >= '2026-07-16 07:18:00+00';

-- Remove the phantom professional row auto-created for the admin.
DELETE FROM public.professionals
 WHERE id = '64ca3950-7574-465d-a125-52e6b9633b85'
   AND created_at >= '2026-07-16 07:18:00+00'
   AND account_type = 'individual';
```

(Sub-agent audit will widen this scope if it finds other stale admin-owned rows.)

### 2. Bug B fix — never auto-create a `professionals` row for a non-training-provider

In `src/lib/qualifications/qualifications.functions.ts`:

- Delete the two `supabase.from("professionals").upsert({ id: userId })` calls (lines 289 and 349).
- Rewrite `assertProviderHasTradingName` so it:
  - **Reads** the `professionals` row. If it does not exist, or `account_type !== 'training_provider'`, throw `Forbidden — this action is only available to training-provider accounts.`
  - Then checks trading name as today.
- Same guard on `submitRegulatedPermission`, `submitRegulatedPermissionBatch`, and the REPS course submit functions in the same file.

This means: even if impersonation silently expires, the admin's identity cannot fabricate a training-provider row and cannot insert into `provider_regulated_permissions`.

### 3. Bug A fix — impersonation expiry must be loud, not silent

Two changes in `src/integrations/supabase/auth-middleware-impersonation.ts`:

- When `session.ends_at < now` **and** the caller has admin role, throw `Impersonation session expired — reopen from the Members page.` (HTTP 401-equivalent). Do not fall through to real-admin identity for server-fns that were reached via an impersonated dashboard URL. Concretely: any server-fn that opts into this middleware is a member-facing action, not an admin action, so silently swapping identities is never the right behaviour.
- Additionally, when the session is expired but not yet closed, `UPDATE admin_impersonation_sessions SET ended_at = now() WHERE id = ...` so it doesn't linger.

Client side:
- `useImpersonationStatus` (already used in `_authenticated/_professional/route.tsx`) is refetched on window focus and after any mutation error tagged `impersonation_expired`. If status flips to `not_impersonating` while on a member-scoped dashboard, redirect to `/admin/members` with a toast.

### 4. Sub-agent audit (parallel, read-only)

Spawn a background task with this exact remit:

- Grep every server-fn using `requireSupabaseAuthWithImpersonation` for the `professionals.upsert({ id: userId })` anti-pattern or any equivalent write that assumes `context.userId` is a member. Report file:line for each hit.
- For every table that stores a `user_id`/`provider_id` referring to a member (professional_photos, professional_locations, provider_regulated_permissions, reps_courses, reps_course_evidence, provider_domain_verifications, provider_name_requests, provider_change_requests, provider_regulated_permissions, insurance_policies, identity_documents, reviews, review_requests, services, bookings, enquiries, clients, coach_client, client_roster, website_*), scan the DB for rows whose `user_id`/`provider_id` matches a user with `user_roles.role='admin'`. Flag anything suspicious with row counts and created_at ranges.
- Check every server-fn that uses `requireSupabaseAuthWithImpersonation` and note whether it treats `context.userId` as "the member" without checking `account_type`. Recommend a guard where missing.
- Trace impersonation session lifecycle: `startImpersonation`, `endImpersonation`, expiry handling, and every place the client reads status. Report every gap where an expired session could be mistaken for an active one.
- Verify the reverse direction: admin viewing/reviewing verification never accidentally writes as the impersonated user.

Deliverable: a written audit report saved to `/mnt/documents/verification-qa-2026-07-16.md`, with file:line references, findings, severity, and recommended fixes.

### 5. Verification after fixes

- Confirm the 5 rows appear under Diverse Trainers in `/admin/verification` and the phantom `/t/kate-pt-icloud-com` slug returns 404.
- Manually reproduce the sequence: start impersonation → wait past `ends_at` → submit a qualification. Expected: hard error, no side effects.
- Re-check `list_publicly_visible_pro_ids()` and the training-provider count (should still be 24).
- Confirm sub-agent audit report has no unresolved criticals.

## Deliverable to you

At the end you get:

1. Migration diff + which rows changed.
2. Code diff for the two `.functions.ts` and middleware files.
3. The sub-agent's audit report (path above), including every occurrence of the anti-pattern in the codebase and its resolution status.
4. Written confirmation of manual reproduction attempt + result.

## Out of scope

- Changing the verification-page UI itself (it's rendering the data correctly).
- Broader impersonation UX polish beyond the expiry-eviction fix.
- Retrofitting historical audit logs.
