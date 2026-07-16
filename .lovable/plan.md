# Training provider FAQs — AI-drafted, provider-approved

Build out the "Frequently Asked Questions" block on `/t/$slug` so it's actually populated. Every FAQ is grounded in that specific provider's real data (trading name, approved regulated qualifications, awarding bodies, REPS courses, location), reviewed by the provider, and only shown publicly once approved. Provider manages FAQs from a new section inside the existing **Provider profile** tab.

---

## What the training provider sees

**Provider profile → new "Frequently Asked Questions" section** (below Contact, above the save bar):

- Empty state: single primary button **"Generate 5 suggested FAQs"** + secondary **"Add manually"**.
- Populated state: card list showing each FAQ with status pill (`Draft · needs review`, `Published`, `Hidden`).
- Each row: inline **Approve & publish** / **Edit** / **Hide** / **Delete** / **Regenerate this answer**.
- Bulk actions on the header: **Approve all suggested**, **Regenerate all suggestions**.
- Ordering: drag-handle to reorder; public page shows in that order, capped at 5 published.
- Hard cap: 8 total rows per provider (5 published + up to 3 unpublished drafts) so the AI can't spam the section.

**Copy on the "Generate" button explains the contract explicitly** so the provider understands they're on the hook for what they publish:

> "We'll draft 5 FAQs based on your approved qualifications and business details. Nothing is published until you approve each one."

## What the public page shows

`/t/$slug` — replace the hardcoded empty `faqs: []` at line 254 with a real query. Show only rows with `status = 'published'`, ordered by `position`, capped at 5. Wire JSON-LD `FAQPage` schema on the route `head()` so approved FAQs count for SEO. If no approved FAQs, keep the current empty state.

## How the AI grounding works (the "not generic sludge" part)

The generation server function does NOT send a generic prompt. Before calling the model, it loads the provider's actual context from the database:

- `professionals` row: trading name, headline, city, description
- `provider_regulated_permissions` where `status = 'approved'`: qualification titles, Ofqual refs, awarding bodies, levels
- `reps_courses` where `status = 'published'`: course titles, durations, delivery modes, prices
- `provider_domain_verifications`: verified website domain
- Locations if present

That context is passed to the model as structured facts. The system prompt forbids inventing details not supplied and requires each question to reference something specific to this provider (e.g. "Do you offer the Focus Awards Level 3 Certificate in Personal Training?" not "What qualifications do you offer?"). Model: `google/gemini-3.5-flash` — cheap, fast, strong at grounded extraction. Output is 5 Q/A pairs via `Output.array` structured output.

Answers are capped in the prompt (≈40 words each) and clamped in code post-generation to prevent runaway answers. If the provider has zero approved qualifications AND zero published courses, the "Generate" button is disabled with a tooltip: "Add regulated qualifications or courses first so we can draft real FAQs."

## Data model

New table `public.provider_faqs`:

- `professional_id` — FK to `professionals(id)`, cascade delete
- `question` — text, ≤200 chars
- `answer` — text, ≤600 chars
- `status` — enum: `draft` | `published` | `hidden`
- `source` — enum: `ai_suggested` | `manual` (audit trail; not shown to public)
- `position` — int for ordering
- `generated_at` — timestamp (when the AI drafted this row, null for manual)
- `approved_at`, `approved_by` — timestamps set when moved to `published`
- Standard `id`, `created_at`, `updated_at`

RLS:
- Public `SELECT` for `status = 'published'` (anon + authenticated).
- Owner (`professional_id = auth.uid()`) full CRUD.
- `service_role` full access.

Grants + `ENABLE ROW LEVEL SECURITY` in the same migration.

## Server functions

All new files under `src/lib/provider-faqs/`:

- `provider-faqs.functions.ts` — client-callable server functions:
  - `listMyProviderFaqs()` — auth, owner scope, returns all statuses.
  - `generateProviderFaqs()` — auth, calls `assertCallerIsTrainingProvider` (existing guard in `qualifications.functions.ts`), loads grounding context, calls AI, inserts 5 rows with `status='draft'`, `source='ai_suggested'`. Refuses if provider already has 5+ non-hidden rows (returns explanatory error).
  - `regenerateProviderFaqAnswer({ id })` — regenerates just the answer for one existing draft, keeps the question and position.
  - `upsertProviderFaq({ id?, question, answer })` — manual create/edit, `source='manual'` on create.
  - `setProviderFaqStatus({ id, status })` — publish/hide/unpublish transitions; sets `approved_at`/`approved_by` when moving to `published`.
  - `reorderProviderFaqs({ ids })` — array of ids in new order, writes `position`.
  - `deleteProviderFaq({ id })`.
- `provider-faqs.grounding.server.ts` — server-only helper that assembles the grounding facts from Supabase (kept out of the `.functions.ts` file per the server-fn splitting rule).
- Public read path: extend the existing provider page loader in `src/routes/t.$slug.index.tsx` (or its data function) to also fetch published FAQs through the server publishable client with a narrow anon SELECT policy.

Every write function calls `assertCallerIsTrainingProvider` first (matches the P0 hardening pattern already used by `submitRegulatedPermission`), so admin-role callers and stale impersonation sessions cannot mutate FAQs.

## UI components

New under `src/components/dashboard/organisation/faqs/`:

- `ProviderFaqsSection.tsx` — section wrapper, plugs into `ProviderProfilePage` after the Contact block.
- `ProviderFaqCard.tsx` — one row with status pill, inline edit, action buttons.
- `ProviderFaqEditDialog.tsx` — shadcn `Dialog` with `Field`/`FieldGroup`/`Textarea` for manual edit.
- `ProviderFaqGenerateButton.tsx` — button + loading state + toast on completion, disabled state with tooltip when grounding data is insufficient.

Public page: reuse existing FAQ markup at lines 717-740 of `t.$slug.index.tsx`, just swap the empty array for loaded data. Add `FAQPage` JSON-LD in the route `head()`.

## Files touched

- **New**
  - `src/lib/provider-faqs/provider-faqs.functions.ts`
  - `src/lib/provider-faqs/provider-faqs.grounding.server.ts`
  - `src/components/dashboard/organisation/faqs/ProviderFaqsSection.tsx`
  - `src/components/dashboard/organisation/faqs/ProviderFaqCard.tsx`
  - `src/components/dashboard/organisation/faqs/ProviderFaqEditDialog.tsx`
  - `src/components/dashboard/organisation/faqs/ProviderFaqGenerateButton.tsx`
  - Supabase migration creating `provider_faqs` + RLS + grants
- **Modified**
  - `src/components/dashboard/organisation/ProviderProfilePage.tsx` — mount `ProviderFaqsSection`
  - `src/routes/t.$slug.index.tsx` — fetch published FAQs, render, add JSON-LD

## Guardrails / non-negotiables

- Nothing auto-publishes. Every AI-drafted row starts as `draft` and only becomes public when the provider clicks Approve.
- AI cannot invent qualifications, prices, timelines, or accreditations — only reference the grounding facts passed in.
- If AI returns an unsupported claim (validated by comparing referenced titles against the grounding facts), that row is discarded before insert.
- Public FAQ list is capped at 5 to keep the section readable.
- All writes gated by `assertCallerIsTrainingProvider` — extends the current impersonation-hardened writer pattern; admin callers or expired impersonation sessions cannot mutate FAQs.
- No CIMSPA or third-party org names in generated content — the system prompt inherits the existing banned-orgs constraint.

## Out of scope for this build

- Analytics on which FAQs get clicked.
- Provider-side "suggest a question" from public visitors.
- Multi-language FAQs.
- FAQ templates shared across providers.
