# Verified tier — world-class rebuild (3-nav IA)

Reshaping the Verified dashboard from scratch around three jobs-to-be-done:
**Listing** (be found) · **Trust** (be believed) · **Settings** (be in control).
Dashboard is the home/scoreboard where daily activity (enquiries, reviews,
next action) actually happens.

Locked Phase 1 mock-ups are NOT touched — this is dashboard-only.

## New sidebar (Verified)

```
Dashboard            ← scoreboard + enquiries inbox + reviews (daily home)
─────────────────────
Listing              ← profile + services + photos + locations (one page, anchor-nav)
Trust                ← identity + insurance + qualifications (merged)
Settings             ← account · billing · notifications · security
```

Shop-front, Profile, Services, Verification, CPD nav items are removed for
Verified. Pro keeps its existing 14-item nav unchanged.

## Pass 1 — IA reshape + tier gates (this turn)

1. `DashboardShell` — `VERIFIED_NAV` collapses to the 4 items above.
2. `/dashboard/shop-front` — Verified sees an upsell screen, not the editor.
   Pro keeps the editor unchanged.
3. New route `/dashboard/listing` — composes Profile + Services + Photos +
   Locations as one scrolling page with sticky in-page anchor nav. Existing
   `/dashboard/profile` + `/dashboard/services` redirect into the right
   anchor on `/dashboard/listing`.
4. New route `/dashboard/trust` — merges identity + insurance + qualifications
   cards onto one page. `/dashboard/verification` + `/dashboard/cpd` redirect.
5. In-person/online delivery-mode toggle stays in ONE place (Services
   anchor). Profile-side picker is removed.

## Pass 2 — Dashboard scoreboard (next turn)

- **Listing Health ring (0–100)**: weighted score across photos, bio,
  specialisms, locations, verification, reviews, response time. Shows the
  two lowest-scoring items as actionable callouts.
- **KPI row**: Profile views 7d, directory impressions 7d, enquiries 30d,
  reply rate. Sparkline per tile.
- **Next best action card**: rule-driven recommendation (e.g. "Add a 2nd
  photo — listings with 3+ photos get 2.4× more enquiries").
- **Enquiries inbox preview** (last 5) + link to full inbox.
- **Reviews preview** (latest 3) + "Request a review" CTA.

## Pass 3 — Enquiries inbox + Reviews (next turn)

- `/dashboard/enquiries` (visible at top of Dashboard, not a nav item):
  table view of `enquiries` for this professional, with reply, mark
  won/lost, and reply-time tracking.
- `/dashboard/reviews` (same): request-review-by-email (unique tokenised
  link → public review form → professional reply). New tables:
  `review_requests`, extension to existing `reviews`.

## Pass 4 — Settings rebuild + migrations (next turn)

Five sub-tabs deep-linked via `?tab=`:
1. **Account** — email/phone change, timezone/locale/units, soft-delete.
2. **Notifications** — `notification_preferences` table.
3. **Billing** — current plan, renewal date, Stripe Billing Portal, invoices.
4. **Integrations** — custom reply-to email (Google Cal stub: beta badge).
5. **Security** — password change, sign-out everywhere, MFA enrol.

Migrations: `professionals.timezone/locale/unit_system/reply_to_email/
deleted_at`, new `notification_preferences` table.

## Pass 5 — Onboarding wizard

First-login 3-step wizard (photo → bio → specialisms) → "Listing live"
celebration → drops user on Dashboard with health score visible.

---

Execution order: Pass 1 → 2 → 3 → 4 → 5. Each pass is independently
shippable. Pass 1 starts NOW.
