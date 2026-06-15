# Plan: Campaigns → standalone admin section (then Slice A)

Agreed — Support and Campaigns are two different jobs. Support is reactive (1:1 inbound triage, SLA, resolve). Campaigns is proactive (1:many outbound, segmentation, scheduling, analytics). Conflating them caps both. Splitting now also gives us the shell to grow Campaigns into a mini-Mailchimp (templates, AI drafting, scheduling, A/B, automations) without bloating the support queue.

This plan ships in two parts. **Part 1 = the split** (no feature regressions, pure restructure). **Part 2 = Slice A** as previously agreed (status model, unread, Reply&Resolve, mobile compose fix, kill inbox legend, truncate From).

---

## Part 1 — Split Campaigns into its own admin route

### New route
- `src/routes/admin_.campaigns.tsx` — new top-level admin page.
- Sidebar: add **Campaigns** nav item under Admin, icon `Megaphone` (or `Send`), positioned directly under **Support**.
- Keep `/admin/support` focused on the ticket queue only.

### What moves out of Support
From `src/routes/admin_.support.tsx`, lift out:
- The **Compose** dialog entry-point + button (currently top-right of the support queue).
- The **broadcast tier picker** (Verified / Pro / Studio / Free) + recipient count preview.
- The **direct-recipient search** (Katie Gibbs flow).
- Anything that calls `previewBroadcastCount`, `resolveTierRecipients`, `searchTrainers`, or the `sendOutboundCampaign` server fn.

Files involved:
- `src/components/admin/support/ComposeDialog.tsx` → move to `src/components/admin/campaigns/ComposeDialog.tsx` (rename references; keep the orange Add button fix in place).
- `src/lib/support/outbound.functions.ts` → move to `src/lib/campaigns/campaigns.functions.ts`. Keep the broadcast-count FK fix shipped last turn. Update all importers.
- DB tables `outbound_campaigns` + `outbound_campaign_recipients` stay as-is (no migration needed) — they're already the right shape for a campaigns module.

### What stays in Support
- Ticket list, filters, ticket panel, reply composer, internal notes, dictation, AI rephrase/draft, mark resolved.
- Inbox tab row (support@ / pros@ / partners@ / press@) — this is genuinely about routing inbound, not outbound.

### New Campaigns page shape (v1 — just the rehome, no new features yet)
Single page with three sections:
1. **New campaign** — the Compose button (was in Support header) → opens existing ComposeDialog.
2. **Recent campaigns** — table of `outbound_campaigns` (subject, audience, recipients, sent_at, open/click placeholders for later).
3. **Empty state** — when no campaigns exist, big "Send your first campaign" CTA.

No analytics, no templates, no AI drafting yet — that's the roadmap below. v1 must look intentional but not over-built.

### Roadmap (NOT in this slice — for memory only)
Once the shell is in place, future slices can add:
- **Templates** library (welcome, renewal nudge, re-engagement, tier upsell).
- **AI compose** — generate subject + body from a brief, using Lovable AI Gateway.
- **Scheduling** — `scheduled_at` column on `outbound_campaigns` + pg_cron runner that posts to a `/api/public/hooks/send-scheduled-campaigns` route.
- **Segments** — saved audience filters (e.g. "Verified, last login >30d").
- **Analytics** — Mailgun webhook → open/click events → per-campaign stats.
- **Automations** — trigger-based (e.g. "7 days after Verified renewal lapses").

Saved to memory under `mem://features/campaigns-roadmap` so future sessions don't re-litigate scope.

---

## Part 2 — Slice A (unchanged from prior agreement)

After the split lands:
1. **Status model migration**: add `new` / `awaiting_us` / `waiting_customer` / `snoozed` to `support_status` enum; add `snoozed_until`, `last_inbound_at`, `unread_by_admin` to `support_tickets`.
2. **Inbound webhook**: Mailgun route flips status to `awaiting_us`, sets `unread_by_admin=true`, stamps `last_inbound_at`.
3. **Queue UI**: unread dot, status tabs (Needs me / Waiting on customer / Snoozed / Resolved / All), **Reply & Resolve** button replaces the checkbox.
4. **Folded-in UX fixes** (since we're already in the file):
   - Mobile (360): move Compose into the page header row, not the tab strip.
   - Kill the `support@ · pros@ · partners@ · press@` legend chrome — the inbox tab row already filters by inbox.
   - Single-line truncate the "From" email column.

---

## Technical notes

- **No DB migration in Part 1** — pure code reshuffle. `outbound_campaigns` / `outbound_campaign_recipients` already exist.
- **No broken imports**: when I move `outbound.functions.ts` → `campaigns.functions.ts`, I'll grep every importer and update in the same edit batch.
- **Sidebar**: add to whatever component renders the admin nav (likely `src/components/admin/AdminSidebar.tsx` or similar — I'll confirm on read).
- **Route convention**: TanStack flat-dot, `admin_.campaigns.tsx` (pathless segment, admin layout still wraps it).
- **Memory updates**: write `mem://features/campaigns-roadmap` (the v2+ scope) and update the index to point Support memories at the ticket-only scope.

---

## Confirmation needed

1. Ship **Part 1 (split) and Part 2 (Slice A) together** in one go? Or land Part 1 first, verify nothing broke, then Part 2?
2. Sidebar label: **"Campaigns"** (my recommendation, future-proof for templates/automations) or **"Broadcast"** (matches current language but narrower)?

Once you confirm 1 + 2, switching to build mode runs the whole thing.