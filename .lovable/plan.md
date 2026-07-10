## QA findings from your test upload

I checked the DB and code paths. Two real issues:

### 1. The course IS there — the "NEW" filter is hiding it (bug)

Your submission exists in `reps_courses` with status `ai_drafted` (the AI drafted the spec seconds after you submitted — that's the intended flow).

The admin sub-tabs are:
```text
NEW · APPROVED · REJECTED · WITHDRAWN
```
…but internally "NEW" filters on `status = 'submitted'` **only**. As soon as the AI finishes drafting (which happens within seconds), the row flips to `ai_drafted` and disappears from "NEW". There's an "In review" tab in the code (`ai_drafted`) but it wasn't rendered in the sub-nav you see, so the course looks lost.

Meanwhile the sidebar badge (`3`) correctly counts `submitted + ai_drafted`, which is why the number is right but the list is empty — the two are inconsistent.

**Fix:** merge `submitted` and `ai_drafted` into a single "NEW" bucket in the admin queue (both are pre-human-review). One `.in("status", ["submitted","ai_drafted"])` on the admin list query, drop the separate "In review" filter. NEW badge and NEW list will then always agree.

### 2. "CPD" still leaking in a few places (global rename you asked for)

I removed CPD from the schema and provider-facing course flow, but these references still exist:

- Admin verification sub-nav label: **"Qualifications & CPD"** → should be **"Qualifications & courses"**
- Internal tab key `"cpd"` in `AdminProviderQualificationsTab` → rename to `"courses"` (cosmetic; no user impact but keeps grep clean)
- Provider dashboard nav item **"Education & CPD"** (`/dashboard/cpd`) → **"Education & courses"** (title, sidebar label, meta title, canonical stays or gets a redirect from `/dashboard/cpd`)
- Public `/cpd` marketing route → rename copy/title to "Education & courses" (route path can stay to preserve SEO, or add redirect)
- `admin_.verification.tsx` and `VerificationCard`, `TrustBlock`, `nav-data.ts` copy strings that still say "CPD"
- File/folder names (`src/lib/cpd/*`, `src/components/cpd/*`, `src/routes/*.cpd.tsx`) — leave as-is this pass, they're internal; renaming folders churns imports without user benefit

### What this plan does

1. **Fix the queue bug** — `adminListRepsCourseQueue` accepts a NEW bucket that returns both `submitted` and `ai_drafted`. Sub-nav becomes `NEW · APPROVED · REJECTED · WITHDRAWN`. Row detail already handles both statuses.
2. **Rename CPD → courses in all user-facing copy:**
   - `AdminProviderQualificationsTab`: outer tab "Qualifications & courses", internal key `courses`
   - `dashboard_.cpd.tsx`: title/subtitle/meta/sidebar active label → "Education & courses"
   - `nav-data.ts`, `VerificationCard`, `TrustBlock`, `admin_.verification.tsx`: replace "CPD" strings with "courses" / "Education & courses"
   - Public `/cpd` route head + hero copy → "Education & courses" (URL kept for now)
3. **Verify:** after the fix, load `/admin/verification` → Training Providers → Qualifications & courses → REPS-accredited courses → NEW should show your **Sports Nutrition** submission. Badge count and list count will match.

### Out of scope this pass

- Renaming `src/lib/cpd/`, `src/components/cpd/`, or the `/cpd` route path (internal churn, no user-facing effect)
- Provider-facing certificate/upload flow rewording (already uses "certificates" / "qualifications")

Approve and I'll ship the fix + rename.
