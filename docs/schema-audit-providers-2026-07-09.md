# Provider schema audit — 2026-07-09

Scope: every column on `public.profiles` and `public.professionals`, cross-referenced against `src/`. Numbers are grep hits excluding `src/integrations/supabase/types.ts` and tests.

## Already done this turn

- Dropped `profiles.business_name` and `profiles.display_name`.
- Merged all reads/writes to `profiles.full_name` (one column now).
- Rebuilt `v_identity_review_queue` and `v_qualifications_review_queue` without `display_name`.

## ❌ Zero references — safe to drop

| Column | Notes |
|---|---|
| `professionals.awarding_bodies` | Array field, never selected or written by app code. |
| `professionals.company_registration` | Duplicate of `company_number` — pick one, drop this. |
| `professionals.cover_url` | Cover image lives on `websites.hero_image_url`. |
| `professionals.from_price_pennies` | Superseded by `hourly_rate_pence`. |
| `professionals.staff_count` | Never rendered. |
| `professionals.value_prop` | Never rendered. |
| `professionals.verification_grace_until` | Never checked in code. |
| `profiles.avatar_qa_source` | AI-avatar QA pipeline scaffolded but never wired. |
| `profiles.avatar_qa_status` | Same. |

## ⚠️ 1 reference — verify then drop

| Column | Only hit |
|---|---|
| `professionals.company_number` | Written once; never rendered. |
| `professionals.identity_verified_dob` | Duplicated on `identity_documents`. |
| `professionals.price_currency` | Always `"GBP"` — hardcode in UI. |
| `professionals.reps_level` | Legacy REPs UK level 2/3/4 — not part of Phase 2 model. |
| `professionals.stripe_identity_session_id` | Session ID persisted but never re-read. |
| `professionals.year_established` | Never rendered. |
| `profiles.avatar_is_ai_generated` | Written by uploader but never surfaced. |

## 🗂️ BD-migration era — plan removal after Phase 2 lands

| Column | Refs | Notes |
|---|---|---|
| `professionals.bd_seed_thin` | 7 | Marks BD-imported thin rows. Ban is on **language**, not the column — but once no legacy admin views use it, drop. |
| `professionals.reps_member_id` | 8 | Old REPs UK member number. Not shown on any user surface. |
| `professionals.quality_score` | 15 | BD scoring heuristic — no consumer surface. |

## ✅ Keep — actively used

All columns with ≥ 20 refs and every social / contact / verification / identity flag are live surfaces. `professionals.legal_entity_name` (15 refs) stays — it is a genuinely different concept from `profiles.full_name` (registered company name for compliance).

## Next-turn migration proposal

```sql
ALTER TABLE public.profiles
  DROP COLUMN IF EXISTS avatar_qa_source,
  DROP COLUMN IF EXISTS avatar_qa_status,
  DROP COLUMN IF EXISTS avatar_is_ai_generated;

ALTER TABLE public.professionals
  DROP COLUMN IF EXISTS awarding_bodies,
  DROP COLUMN IF EXISTS company_registration,
  DROP COLUMN IF EXISTS cover_url,
  DROP COLUMN IF EXISTS from_price_pennies,
  DROP COLUMN IF EXISTS staff_count,
  DROP COLUMN IF EXISTS value_prop,
  DROP COLUMN IF EXISTS verification_grace_until,
  DROP COLUMN IF EXISTS year_established,
  DROP COLUMN IF EXISTS price_currency,
  DROP COLUMN IF EXISTS reps_level,
  DROP COLUMN IF EXISTS stripe_identity_session_id,
  DROP COLUMN IF EXISTS company_number,
  DROP COLUMN IF EXISTS identity_verified_dob;
```

BD-migration columns held back until you confirm no live admin view depends on them.

Sign-off required before running.
