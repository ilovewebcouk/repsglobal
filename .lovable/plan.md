## Goal

Make the **Tagline** (160 char headline) and **Public bio** (1200 char about) feel 10/10 — most pros are great trainers, awful copywriters. Use Lovable AI to remove the blank-page problem without making every profile sound like ChatGPT.

## What "world-class" looks like (Stripe / Linear / Notion bar)

Three AI actions, all inline in the existing profile editor — no separate "AI page", no chat window. The pro stays in control: AI proposes, they edit, they save.

### 1. Generate from facts (blank state)
A small "✨ Draft with AI" button on each field. Opens a compact sheet that asks for 4-6 facts already on their profile (we pre-fill from `primary_profession`, `specialisms`, `city`, `years_experience`, `qualifications`, `service` titles). They tick what's true, optionally add 1-2 free-text facts ("ex-rugby, Hyrox-focused"). AI returns **3 variants** in different angles: outcome-led, credentials-led, personality-led. Pro picks one → it drops into the field, fully editable.

### 2. Rewrite tone (existing text)
When the field has content, the button becomes "✨ Improve". Opens a popover with 4 chips: **Tighten**, **More confident**, **Warmer**, **More specific**. One click → streams a rewrite into a side-by-side diff (old vs new). Pro hits **Use this** or **Discard**.

### 3. Inline polish (passive)
A subtle underline (like Grammarly) flags: weak verbs ("help people"), banned phrases ("passionate about fitness", "take your training to the next level"), missing specifics (no outcome, no qualification, no city). Hover → one-line fix suggestion. No auto-apply.

## Guardrails (the difference between 7/10 and 10/10)

- **First person, never third.** System prompt locks voice — "I" not "James helps clients".
- **No fabrication.** Prompt is explicit: only use facts the pro provided. If they tick "10 years experience", we say 10 — we never invent numbers, certifications, or client outcomes.
- **Banned phrase list.** Prompt rejects: "passionate about", "take it to the next level", "your journey", "transform your life", "results-driven", emoji. Configurable in `src/lib/ai/bio-guardrails.ts`.
- **Length-aware.** Tagline prompt knows the 160 cap and aims 90-130. Bio aims 600-900 (the sweet spot for SEO + scannability), never over 1200.
- **REPs voice.** System prompt includes 3 reference taglines + 1 reference bio from our locked copy (e.g. James Wilson on `/c/james-wilson`) so output matches the brand.
- **Profession-aware.** PT bio reads different from yoga teacher bio — prompt injects `primary_profession` + top 2 `specialisms` for tone calibration.
- **Rate limit + cost.** 20 AI actions / pro / day, soft cap. Server-side. Returns a friendly "you've drafted a lot today — save and come back" if hit.

## Technical shape (TanStack server functions, Lovable AI Gateway)

```text
src/lib/ai/
├── bio-ai.functions.ts        # draftTagline, draftBio, rewriteTone, polishHints
├── bio-ai.server.ts           # gateway provider + prompt builders
├── bio-prompts.ts             # system prompts + reference snippets + banned list
└── bio-guardrails.ts          # post-generation filter (strips emoji, banned phrases)
```

- All four actions are `createServerFn` (POST, `requireSupabaseAuth`), no public route.
- Model: `google/gemini-3-flash-preview` (fast, cheap, plenty for short copy). Pro tier could later swap to `openai/gpt-5-mini` for the rewrite action only.
- Structured output via AI SDK `Output.object` — returns `{ variants: string[3] }` for draft, `{ rewrite: string }` for tone, `{ issues: Array<{start,end,kind,suggestion}> }` for polish.
- Streaming only for the rewrite diff (feels alive). Draft + polish are one-shot.
- Caller logs `ai_action_log` row (`user_id`, `action`, `field`, `tokens_in`, `tokens_out`, `created_at`) for the rate limit + future analytics. New table + RLS + GRANTs.

## UI shape (inside the existing locked profile editor)

Tagline field — add a thin row below the input:
```text
[ tagline input ........................................... ]
48 / 160 · One line that appears under your name on the directory card.
                                                     ✨ Draft with AI ▾
```

Public bio field — same pattern, button sits in the textarea's bottom-right corner. Diff view uses shadcn `Sheet` from the right (matches our dark theme), with old/new in two `<Card>`s and **Use this** / **Discard** in the footer.

No new pages. No new routes. Editor stays locked-layout — we only add buttons + a sheet.

## Out of scope (deliberately)

- AI on services, qualifications, certifications, or any field where fabrication = legal/regulatory risk.
- Auto-publish or auto-save. AI never writes to the DB; the pro saves.
- Image generation (separate decision).
- Public-facing AI (clients asking the bot questions). That's a Phase 3 conversation.

## Open questions (need your call before I plan files in detail)

1. **Reference voice** — do you want me to lift the reference tagline + bio from `/c/james-wilson` (already locked, on-brand), or do you want to write the gold-standard reference yourself first?
2. **Polish underlines** — yes or no? It's the most "magic" feature but also the most annoying if mis-tuned. Safe to ship draft + rewrite first, add polish in v2.
3. **Tone chips** — happy with Tighten / Confident / Warmer / Specific, or do you want different ones (e.g. "Less salesy", "Add proof")?
