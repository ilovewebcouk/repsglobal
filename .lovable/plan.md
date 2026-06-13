# Plan — Save UX + Trains-at + Gym shop-fronts + Gym directory (10/10 revision)

Three phases. Ship Phase 1 now. Phase 2 unlocks when ≥10 gyms cross the 3-coach threshold. Phase 3 unlocks on first inbound claim request.

**10/10 additions baked into Phase 1:**
1. Density aggregation computed from day one (rendered in Phase 2 UI)
2. `verified_by_gym` flag on the link from day one (defaults false; flips true in Phase 3)
3. Anti-spam limits on custom gym submissions (max 2 pending per pro, soft 1/hour)
4. Phase 1 has its own discovery surface: chips visible on `FeaturedProCard`, filter hint on `/coaches`

---

## Phase 1 — Foundation (ship now)

### 1A. Save UX — pure auto-save
- Remove the orange `Save changes` button.
- `SaveStatusPill` is the only save surface: hidden → `Editing…` → `Saving…` → `Saved · just now` (fades 4s) → `Couldn't save — Retry`.
- Validation errors block auto-save + show `Fix N issues` chip that scroll-focuses the first error.
- `⌘/Ctrl+S` instant flush; only path that fires a confirmation toast.
- `beforeunload` guard kept (fires only while `saving` or `dirty+errors`).
- No DB/mutation changes.

### 1B. Gyms data model (one migration)

```text
gyms
├ id, slug (unique), name
├ chain_slug, chain_name              -- 'pure-gym' / 'PureGym'
├ area, city, postcode, lat, lng
├ status: 'active' | 'pending_review' | 'rejected'
├ claim_status: 'unclaimed' | 'pending' | 'verified'   -- Phase 3 fills
├ claimed_by uuid (nullable)
├ logo_url, hero_url, tagline, facilities text[]       -- claim-only, nullable
├ created_by uuid, created_at, updated_at

professional_gyms
├ professional_id → professionals
├ gym_id → gyms
├ position smallint (0..2)
├ verified_by_gym boolean default false        -- 10/10 addition #2
├ created_at
UNIQUE (professional_id, gym_id)
UNIQUE (professional_id, position)
Trigger: max 3 active rows per professional

gym_submission_throttle    -- 10/10 addition #3
├ professional_id, created_at
Trigger on gyms INSERT (status='pending_review'):
  - count pending submissions by this pro → reject if >2
  - count submissions in last 1h → reject if >=1
```

- RLS: `gyms` public SELECT where `status='active'`; authenticated INSERT forces `status='pending_review'` + `created_by=auth.uid()`; admin UPDATE.
- `professional_gyms`: pro manages own rows; public SELECT joined to active gyms; only admin/gym-claim flow may set `verified_by_gym=true`.
- Grants per `public-schema-grants`.
- Seed ~60 venues: Major UK (PureGym, The Gym Group, David Lloyd, Virgin Active, Nuffield, Bannatyne) + Premium (Third Space, Equinox, KX, BXR, Embody) + Boutique (F45, Barry's, 1Rebel, Psycle, Frame, Gymbox) across London + 5 cities. Real names/areas only.

### 1C. Density aggregation (10/10 addition #1)
- Materialized view `gym_density` (gym_id, coach_count, top_specialisms jsonb).
- Refreshed by trigger on `professional_gyms` insert/delete and on `professionals.specialisms` update.
- Exposed via `getGymDensity(gym_slug)` server fn for Phase 2 consumption. Not rendered in Phase 1 UI but the data is live and correct from day one.

### 1D. Editor `GymPicker`
- Slots into "Where you work" card in `/dashboard/profile`.
- **Conditional render**: only when `practice_mode` ⊇ in-person OR hybrid.
- Header: `Trains at (optional · max 3)`.
- Active gyms = removable chips with chain text + area + muted "Pending review" dot when applicable.
- "Add gym" opens shadcn `Command` palette → server-fn typeahead against `gyms` (ilike on name+area, limit 8, `status='active'`).
- Empty match → inline "Can't find it? Add `<query>`" form (name, area, city) → inserts as `pending_review` (subject to throttle trigger; UI surfaces "You've reached your pending limit — wait for review" when blocked).
- All writes feed the auto-save pill.

### 1E. Public surfaces (Phase 1)
- `FeaturedProCard`: wire real `trains_at` row, hide row when empty. Chips render as small text + chain marker (10/10 addition #4 — proof the data exists on every directory card).
- `/pro/$slug` + `/c/$slug`: "Where I train" mini-block. Chips render as **static text in Phase 1** — `/at/$slug` doesn't exist yet.
- `/coaches` search: add `gym` zod search-param + filter chip ("Train at: Third Space ×"). Loader inner-joins `professional_gyms`. Empty/intro state adds one line: *"Train at a specific gym? Filter by venue."* (10/10 addition #4).

### 1F. Admin moderation
- `/admin/gyms` under `_authenticated/_admin/`: status filter, approve/reject pending submissions, edit name/area/chain, view throttle history.

**Phase 1 ship criteria:** auto-save clean, pros tag up to 3 gyms, spam-protected custom adds, search filters by gym, FeaturedProCards show chips, admin moderates. Zero public gym pages live.

---

## Phase 2 — Gym shop-fronts + city directory (≥10 gyms ≥3 pros)

### 2A. `/at/$slug` — gym shop-front
Mirrors `/c/$slug` structurally.

```
HERO         dark gradient + chain marker (or claim-only hero photo)
             Eyebrow: UNCLAIMED VENUE / REPS VERIFIED VENUE
             H1: "{Gym name}"
             Sub: "{Area} · {N} REPs-verified coaches train here"
             CTAs: Browse coaches · Claim this venue
             Floating trust card

DENSITY      "12 verified coaches · top specialisms: fat loss (5), strength (3), pre/post-natal (2)"
STRIP        — the headline differentiator, ships with the page

COACHES      FeaturedProCard grid. Sort: verified_by_gym > featured > rating > recently active.
             Verified-link coaches get a subtle "✓ Verified at {gym}" micro-badge once Phase 3 ships.

ABOUT        Claim-only block — hidden until claimed
FAQ          Standard set
FINAL CTA    "Train here? Add this venue to your profile."
```

**Visibility gate (non-negotiable):** `≥3 active professional_gyms` rows OR `claim_status='verified'`. Below threshold → soft 404 "Coming soon" + back-link to `/in/$city`.

### 2B. `/gyms` directory + `/in/$location` cross-wiring
- `/gyms` mirrors `/coaches` structurally (city, chain, facilities filters).
- `/in/$location` gains "Gyms in {city}" rail under coaches grid.

### 2C. Flip Phase-1 static chips to live `<Link>` for gyms above threshold.

---

## Phase 3 — Claim + chains + compares (on first inbound demand)

### 3A. Claim flow
`/at/$slug/claim` → `gym_claim_requests` table → email-domain match against gym website OR manual admin approval. On approval: `claim_status='verified'`, About + facilities unlock.

### 3B. Verified gym → verified coach link
When a gym claim is approved, the gym owner can mark linked coaches as `verified_by_gym=true` from their dashboard. Verified coaches get the "✓ Verified at Third Space" micro-badge on their profile chip + on the gym page.

### 3C. Chain parent pages
`/gyms/chains/$chain-slug` aggregates every site, total coaches, ratings, locations. B2B wedge.

### 3D. Gym-vs-gym compares
`/gyms/compare/$a-vs-$b` with comparison-methodology rigor.

---

## Files (Phase 1)

**New**
- `supabase/migrations/<ts>_gyms.sql` (tables, grants, RLS, triggers, materialized view, seed)
- `src/lib/gyms.functions.ts` — `searchGyms`, `requestGym`, `setProGyms`, `getProGyms`, `getGymDensity`
- `src/components/profile/GymPicker.tsx`
- `src/routes/_authenticated/_admin/admin.gyms.tsx`

**Edited**
- `src/routes/_authenticated/_professional/dashboard_.profile.tsx` — remove Save button, slot `GymPicker` conditionally, ⌘S flush
- `src/components/profile/SaveStatusPill.tsx` — primary save surface
- `src/components/directory/FeaturedProCard.tsx` — wire `trains_at` row + chips
- `src/routes/pro.$slug.tsx`, `src/routes/c.$slug.tsx` — "Where I train" static-text block
- `/coaches` loader + filter bar — `gym` search-param + chip + intro hint

---

## Verification (Phase 1)

1. Edit headline → pill cycles Editing → Saving → Saved. No orange button. ⌘S = one toast.
2. Validation error blocks auto-save; "Fix 1 issue" scroll-focuses field.
3. Online-only pro: GymPicker not rendered.
4. In-person pro: typeahead returns seed; max 3 enforced; remove works.
5. Custom gym: pending chip appears; 3rd pending submission blocked with clear message; rapid resubmit blocked by 1h throttle.
6. Coach profile + FeaturedProCard show up to 3 chips; row hidden when empty.
7. `/coaches?gym=third-space-mayfair` filters; chip removable; intro hint visible when no filter applied.
8. `/admin/gyms` lists pending; approve flips to active.
9. `getGymDensity('third-space-mayfair')` returns correct coach_count + top_specialisms (data verified even though no UI consumes it yet).
10. `reps-build-compliance` audit exits 0.

---

## Ship order (Phase 1)

1. Migration + seed + density view + throttle trigger
2. Save UX cleanup (standalone PR)
3. `GymPicker` + editor wiring
4. FeaturedProCard chips + profile static chips
5. `/coaches` gym filter + intro hint
6. Admin moderation
