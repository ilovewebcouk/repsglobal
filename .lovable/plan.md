# Full QA on auto-renewals + relaunch email copy

## Part 1 — QA verdict: the system is wired correctly. There is no new bug.

I went through cron history, the renewal engine code, and every legacy row due in the next 21 days. Here is what is actually true today, with evidence — not another "fix."

### What the launch plan said
1. Launch day: charge the small "due now" cohort (honour window + anomaly).
2. After launch: every BD legacy member is parked with `migration_cohort_override = 'future_due'`. As each member's BD anniversary arrives, the nightly cron releases them, attempts payment on their existing Stripe customer, and creates the £99 Core subscription.

### What actually happened
| Cohort | Count | State | Verdict |
|---|---|---|---|
| Launch-day charges | 7 | `renewed_to_verified` with live subscription | ✅ Done |
| Honour-window members who later came due (c.wolvey, walker_jane2, parnita, bex_white) | 5 | `renewed_to_verified` with live subscription | ✅ Auto-renewed correctly |
| readchris11 (no card on file) | 1 | `awaiting_payment_method` + recovery link issued | ✅ Correct path |
| Adam Davis (due **today**, 28 Jun) | 1 | Still `skipped` — last touched 27 Jun 05:37 | ⏳ Releases tonight |
| karlypriest (due **today**, 28 Jun) | 1 | Still `skipped` — last touched 27 Jun 05:37 | ⏳ Releases tonight |
| roamfitness, sebastian.brosche (due 1 Jul) | 2 | `ready` | ⏳ Process night of 1 Jul |
| Future BD members (242 total, due 2 Jul → 2027) | 242 | `skipped / future_due` parked | ✅ Will release on their own dates |

### Why Adam Davis hasn't processed yet — and why it isn't a bug
- Engine candidate query requires `bd_next_due_date <= today` (UTC date).
- Adam's BD due date is **28 Jun 2026**.
- The most recent cron tick that touched the engine ran **27 Jun 03:00 UTC**. On that date `"2026-06-28" > "2026-06-27"` → he was correctly re-skipped (his date hadn't arrived).
- The next tick runs **tonight, 28 Jun 03:00 UTC**. Then `"2026-06-28" <= "2026-06-28"` → he is released, charged £99, subscription created.
- Same logic puts karlypriest through tonight, roamfitness + sebastian through on 1 Jul, etc.

### What we DON'T have (the real gap)
We have no operator-facing proof that the cron ran successfully and what it did. That's why this conversation keeps going in circles — you have to ask me, I have to read tables, you have to take my word for it. The fix is **observability, not more engine code.**

## Part 2 — The only change I want to make this round

Add one new card to `/admin/ops` called **"Renewal engine — last 7 nights."** Read-only. No code touches the engine itself.

For each of the last 7 nightly runs, show:
- Date / status (succeeded / failed / no-op)
- Rows attempted, renewed, awaiting_payment, errored
- Members processed (name + outcome chip), each linking to their /admin/members/{id} timeline
- Next 14 days of upcoming due dates with member + amount

Data source: `cron.job_run_details` for the run, `legacy_stripe_link.last_attempt_at` joined to `bd_member_seed` for outcomes. No new tables, no schema migration.

Acceptance: every morning you can open `/admin/ops`, see "Last night: 2 members processed → karlypriest £99 ✓, adam@onlinecoaching.pro £99 ✓" without asking me anything.

That is the **only** product change in this turn. No engine edits, no schema changes, no new crons.

## Part 3 — Relaunch email copy (draft only, no send infra)

You said you'll send from your Campaigns tool, so I'll deliver finished HTML + plain-text copy to `/mnt/documents/` for you to paste in. No Lovable email infrastructure touched.

**Tone**: punchy, friendly, confident, world-class SaaS. No jargon. No "MVP" — translated to "we're shipping every day."

**Subject (A/B options)**
- A: "REPs is back — and bigger than before"
- B: "Your REPs has had a glow-up 👀"

**Body outline**
1. **One-line opener** — "REPs has relaunched."
2. **What changed** — new register, verification, public shop-front, real protection for trainers.
3. **What's coming** — Pro tier (full business OS — clients, payments, bookings, reviews) launching soon, exclusive Founding £59/mo for early movers.
4. **What to do today (single CTA)** — "Verify your account in under 5 minutes" → upload ID, qualification, insurance → get the green tick on your public profile.
5. **Pricing transparency** — "You were on £34. On your next renewal you'll move to £99/yr for Core — same Verified status, plus every new feature we ship. No add-ons, no surprises."
6. **Honesty line** — "You'll spot some placeholders here and there — we ship updates every single day. If you'd rather not be along for the ride, you can close your account in Settings → Account."
7. **Sign-off** — short, founder voice.

**Single CTA button**: "Verify my account" → `https://repsuk.org/dashboard`

**Deliverables to `/mnt/documents/`**:
- `relaunch-email.html` — branded HTML matching REPs tokens (dark wash, orange CTA, white wordmark)
- `relaunch-email.txt` — plain-text fallback
- `relaunch-email-preview.png` — screenshot QA of the rendered HTML

I'll generate, render, screenshot, and verify before handing over.

## Out of scope (intentionally)
- No new migrations
- No engine logic changes
- No new email infrastructure (you're using Campaigns)
- No price changes — £99 is already live in `src/lib/billing.ts`
- No bulk send from Lovable
