# Unify Training Providers into the Professionals model

Blast radius is small (~6 code files reference the org/provider tables, plus 9 provider routes). No live data. Clean slate is the right call.

## The core move

A training provider becomes **a professional with `account_type = 'organisation'`**. Everything reuses the professional shell.

```text
professionals
├── account_type: 'individual'  →  personal trainer, coach, nutritionist    (Core / Pro)
└── account_type: 'organisation' → training provider, academy, gym group    (Studio)
```

One entity, one table, one profile template, one dashboard, one admin workbench, one review system, one enquire flow, one search index.

## Schema changes (single migration)

**Extend `professionals`:**
- `account_type text not null default 'individual'` — `'individual' | 'organisation'`
- `legal_entity_name text` — company name (orgs only)
- `company_registration text` — Companies House / equivalent (orgs only)
- `staff_count int` — number of tutors/trainers (orgs only)
- `awarding_bodies text[]` — accreditation partners (orgs only)
- Existing `display_name`, `bio`, `slug`, `avatar_url`, `verification_status`, `location`, `services` all reused.

**Extend `services`** to cover courses:
- `service_kind text default 'session'` — `'session' | 'package' | 'course' | 'programme'`
- `starts_at timestamptz`, `ends_at timestamptz`, `seats_total int`, `seats_taken int`, `venue text`, `qualification_level text`, `awarding_body text` (nullable, only used by course-kind services)

**Drop entirely:**
- `organisations`
- `organisation_users` → replaced by extending `professional_staff` (or a new `professional_members` join for org accounts)
- `provider_reviews` → merge into `reviews` with a `subject_kind` if needed (likely not — `reviews.professional_id` already works)
- `provider_review_requests` → merge into `review_requests`
- `provider_review_evidence`, `provider_review_flags` → merge into equivalents on `reviews`

**Auth-user link:** unchanged. Owner of an organisation account is still one `auth.users` row pointing at one `professionals` row; add a `professional_members` table later only if we need multi-user access to a single org account.

## Route changes

**Delete:**
- `providers.$slug.tsx` / `.index.tsx` / `.review.tsx`
- `verify.provider.$membershipId.tsx`
- `reviews.provider.verify.$token.tsx`
- `admin_.training-providers.*` (4 files)

**Reuse (no new routes needed):**
- Public profile: `/c/$slug` — renders orgs and individuals from the same template, with an `account_type`-aware header (org logo + "Training provider" label, staff count, awarding bodies) and services block that switches between "Coaching packages" and "Upcoming courses" based on `service_kind`.
- Admin: `/admin/professionals/$id` — Member 360 workbench already handles both.
- Reviews: existing `/r/$token` + reviews tab already work per professional.
- Enquire: `/pro/$slug/enquire` — same form, org-aware copy.
- Directory: `/find` returns both, with an `account_type` facet ("Coaches" / "Training providers" / "All").

**Optional vanity redirect:** `/providers/:slug → /c/:slug` (301) via `legacy_redirects` so any external links keep working.

## Code changes

- Delete `src/lib/training-providers.functions.ts` — its list/detail/review functions collapse into existing `professionals.functions.ts` and `reviews.functions.ts`.
- Update `/c/$slug` component to branch on `account_type` for: header labels, verification chips (individual = ID+insurance+quals; org = company reg + awarding-body accreditation), services section title, "About" copy.
- Update `/find` filters, city pages, profession pages to include org accounts under the right specialism/category.
- Update `src/lib/billing.ts` — Studio £149 becomes the tier gate for `account_type = 'organisation'` at signup.
- Update `src/components/dashboard/nav-data.ts` — remove standalone "Training providers" admin section; add an "Account type" filter on `/admin/professionals`.
- Update nav-data.ts pricing/marketing to describe Studio as "for training providers, gyms, academies".

## Signup flow

Signup picks account type up front:
- **Individual** → Core (£34/yr) or Pro (£59/mo) → normal pro onboarding.
- **Organisation** → Studio (£149/mo) → org onboarding (legal name, company reg, awarding bodies, staff invites).

Same auth, same tables, different fields collected.

## Migration sequence (one atomic push)

1. Write the SQL migration: extend `professionals` + `services`, drop the 6 provider/org tables, add redirect rows.
2. Rebuild `/c/$slug` to render both account types.
3. Delete the 9 provider routes and `training-providers.functions.ts`.
4. Add `account_type` filter/facet to `/find` + `/admin/professionals`.
5. Update Studio tier wiring in `billing.ts` and signup.
6. Optional: seed 2–3 demo org professionals so we can eyeball the unified template.

## What we keep from the current provider work

Nothing structural, but the *content model* we defined (awarding bodies, courses, tutor count, verification steps for orgs) transfers directly into the new columns on `professionals`/`services`. Not wasted.

## What this fixes

- One admin workbench, not two.
- One reviews module, not two.
- One directory, not two.
- Search returns "Level 3 PT course in Manchester" and "Manchester-based Level 3 PT" from the same query.
- Studio becomes a real tier, not a separate product line.

## Out of scope for this pass

- Multi-user org accounts (staff logins under one org). Add `professional_members` later when a real customer asks.
- Course booking with seat management. `services.seats_total/taken` columns land now; the booking flow ships in Phase 2.1.
- Migrating the old admin invite tooling — will refresh in the same pass since org invites now go through the same pipeline as pro invites.
