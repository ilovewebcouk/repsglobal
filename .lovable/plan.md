## Plan: Auto-send invites + flesh out Client Portal (Phase 2)

Use the existing verified workspace domain `notify.dogboss.io` for sending. No new DNS required.

### 1. Email infrastructure + invite auto-send
- Run email infrastructure setup against the existing `notify.dogboss.io` domain (queues, send log, suppression, unsubscribe tokens, cron dispatcher).
- Scaffold app (transactional) email templates and a `sendTransactionalEmail` helper.
- Add a branded **Client invite** template at `src/lib/email-templates/client-invite.tsx` with: pro/trading name, optional personal note, big "Accept invite" button → `/accept-invite?token=…`, 14-day expiry line. Register in `registry.ts`.
- Wire the existing "Send invite" flow in `dashboard_.clients.tsx` so on successful insert into `client_invites` it calls `sendTransactionalEmail({ templateName: 'client-invite', recipientEmail, idempotencyKey: 'invite-' + invite.id, templateData: { fullName, proName, acceptUrl, note } })`. Keep the copy-link fallback visible.
- Create `/unsubscribe` page for the system-managed footer link.

### 2. Client portal screens (static high-fidelity, MyFitnessPal-style)
All under the existing `ClientShell` (sidebar = Today / Programme / Nutrition / Check-ins / Messages / Profile). No auth gating yet — Phase 2 visuals first, wiring later.

- **`portal.today.tsx`** (rename from `portal_.today.tsx` so it nests cleanly and appears in the Pages picker) — keep current Today layout.
- **`portal.programme.tsx`** — Week strip (M–S), today's session card (warm-up / main lifts table with sets×reps×RPE / finisher), upcoming sessions list, "Swap" + "Mark complete" pill buttons.
- **`portal.nutrition.tsx`** — **MyFitnessPal-style daily log** powered later by FatSecret:
  - Top: calorie ring + macro bars (P/C/F) with target vs eaten.
  - Meal sections: Breakfast / Lunch / Dinner / Snacks — each with rows (food name, serving, kcal, P/C/F) and an "+ Add food" button.
  - Water tracker row (8 cups).
  - Search sheet mock-up (FatSecret-style results list with brand, serving picker).
  - Quick-add buttons (recent foods, barcode scan icon — visual only).
- **`portal.check-ins.tsx`** — Weekly check-in card (weight trend sparkline, waist/hip, sleep, energy, adherence %), photo grid (front/side/back placeholders), "Submit this week's check-in" CTA, history list.
- **`portal.messages.tsx`** — Two-pane: thread list (coach + any group) on left, conversation on right with bubbles, attachment chip, message composer. Mobile collapses to single pane.
- **`portal.profile.tsx`** — Goals, training availability, dietary preferences, allergies, units (kg/lb, cm/in), notification toggles — all static for now.

All screens use locked REPs tokens (orange primary, radius system, semantic colors from `styles.css`). Cards = 18px radius, large panels = 22px, buttons = 10px, pills = full. Match visual weight of the existing `/portal/today` mock-up.

### 3. Not doing this turn
- No FatSecret API calls yet — Nutrition screen is a high-fidelity static mock with realistic sample foods. Real search/barcode lookup comes in the next phase once visuals are signed off.
- No auth guard on `/portal/*` yet (stays open for review).
- No DB writes from portal screens.
- No changes to the locked `/pro/$slug` profile or the 6 source-of-truth mock-ups.

### Technical notes
- Email: `email_domain--setup_email_infra` then `email_domain--scaffold_transactional_email`. Templates use React Email components, white body background, brand styling pulled from `styles.css`. Invite send goes through the queue (retry-safe).
- Route rename: `portal_.today.tsx` → `portal.today.tsx` so all portal pages become children of the `portal.tsx` layout and surface in the Lovable Pages picker.
- New routes auto-register via the TanStack router plugin — no manual `routeTree.gen.ts` edits.

Shall I proceed?