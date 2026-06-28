## Goal

When admin opens a support ticket in `/admin/support`, the AI draft is **already in the reply box**, polished and on-brand. Admin reviews → hits Send. No "AI draft" click needed.

## Changes

### 1. Auto-draft on ticket open (`src/routes/admin_.support.tsx`)

In the ticket detail sheet (around lines 900–945):

- Add an effect that triggers `aiDraft.mutate()` automatically when:
  - A ticket is opened, AND
  - The latest message in the thread is **inbound** (customer is waiting on us), AND
  - The draft box is empty (don't overwrite anything the admin typed), AND
  - We haven't already auto-drafted this ticket in this session (track via `useRef<Set<string>>` keyed by ticket id).
- Show a subtle "Drafting reply…" shimmer in the textarea while `aiDraft.isPending`, then drop the polished reply in.
- Keep the existing `AI draft` button — it now acts as a "redraft" button (and still expands a brief if admin typed shorthand).

### 2. Tighten the prompt for full auto-send quality (`src/lib/support/ai-draft.functions.ts`)

The current prompt is already strong, but for true "just hit send" quality we add:

- **Context awareness for the BD-migration / £34 → £99 cohort** — if the thread mentions paid-through dates, legacy pricing, or "can't access", the draft must:
  - Confirm we can see their record and what we're doing now (migrate / send magic link / honour paid-through date).
  - Address the price jump using the locked talking points from `mem://`: "one client this year and it's paid for itself" + value-add framing (verified badge, rebuilt profile, discovery tools).
  - Never invent a refund or a discount.
- **No placeholders**: explicitly ban `[name]`, `[date]`, `[ticket #]` etc. — if a fact isn't in the thread, write around it.
- Keep temperature at 0.4 (already good for consistency).

### 3. Small UX polish

- Rename the button label from `AI draft` → `Redraft` once a draft is present (so admin knows clicking again replaces it).
- Add a tiny "✨ Auto-drafted" badge above the textarea when the current text came from auto-draft (clears as soon as admin edits a character).

## What stays the same

- Send pipeline, Mailgun sending, ticket status flow, internal notes — untouched.
- The reply still goes out as `support@repsuk.org` only when admin clicks **Send & pending** / **Send & solve**. Nothing auto-sends.

## Out of scope

- No new tables, no new server functions beyond editing `draftSupportReply`'s prompt.
- No changes to inbound webhook or loop guard.