## Brutal honest truth

Dropping the £10 add-on is the right call. Featured-as-a-paid-add-on muddies the trust story (Verified vs Featured) and creates a second SKU to sell, support and refund before you've even proven the core tiers. Making Featured a **perk of the paid tier** does three things at once:

1. Sharpens the upgrade pitch ("Verified pros get featured placement on the homepage, city pages, and profession pages") — Featured becomes a *reason* to subscribe rather than an upsell on top.
2. Keeps Verified as the sole public trust badge — no second "Featured" label muddying the cards.
3. Avatar-backfill until n > 5 is exactly right — better than empty rails or "Featured" being visibly thin.

This is a 10/10 move for where you are right now. The only thing it costs is the £10/mo revenue line, and you weren't going to get meaningful volume on that for months anyway.

---

## Featured logic (the rule the whole system obeys)

A single server-side helper decides who is "featured-eligible" in a given scope (global / city / profession). Pseudocode:

```text
paidPros = pros where subscription.tier IN ('verified','pro','studio')
                    AND status IN ('active','trialing')
                    AND is_published = true
                    AND identity_status = 'approved'
                    (+ scope filter: city ILIKE / primary_profession =)

if paidPros.count > 5:
  pool = paidPros
else:
  pool = pros where is_published = true
                AND avatar_url IS NOT NULL
                AND identity_status = 'approved'
                (+ scope filter)
                ORDER BY paid-tier-first, then quality_score DESC

return deterministic_daily_shuffle(pool, seed = today + scope).take(N)
```

- Threshold (`> 5`) lives in one constant so we can dial it later without touching components.
- Daily seeded shuffle = fair rotation, no admin work, no scarcity weirdness.
- The same helper powers homepage, `/in/$city`, `/professions/$profession`, the directory `featured=true` filter, and the admin "Featured rotation" panel — one source of truth.

---

## Scope of this build

### 1. Backend (one migration + one server-fns module)

- **No schema change needed.** Featured is *derived* from `subscriptions.tier` + `professionals.is_published` + `profiles.avatar_url` + `professional_locations`. Nothing to store.
- New file `src/lib/directory/featured.functions.ts`:
  - `getFeaturedPros({ scope: 'global' | 'city' | 'profession', value?: string, limit: number })` — public server fn using the publishable-key server client (anon-readable: published pros only, safe columns).
  - `getDirectoryHealth()` — admin-only (`requireSupabaseAuth` + `has_role(_, 'admin')`). Returns the KPIs, "listings needing attention" (low `quality_score`, missing avatar / bio / location), geographic coverage (group-by city), and the current featured rotation across all scopes.
- Add a tiny `FEATURED_PAID_THRESHOLD = 5` constant in `src/lib/directory/featured.config.ts`.

### 2. Public surfaces (consume the helper — no card redesigns)

- **Homepage "Featured REPS Professionals"** rail — swap its data source to `getFeaturedPros({ scope: 'global', limit: 8 })`. Card design unchanged.
- **`/professions/$profession`** "Featured personal trainers" rail — `getFeaturedPros({ scope: 'profession', value: profession, limit: 4 })`.
- **`/in/$location`** "Featured in {City}" rail — `getFeaturedPros({ scope: 'city', value: location, limit: 4 })`.
- All three already use `FeaturedProCard` / the homepage card; we only swap the array they map over.

### 3. Directory filter

- Add `featured` to the URL params schema in `/find-a-professional`.
- Add a checkbox under "Verified only" labelled **"Featured only"** with a small tooltip: *"Hand-picked pros currently rotated on the homepage and city pages."*
- When checked, the results query restricts to the featured pool (same helper, scope = 'global', limit = a larger number e.g. 60, fed into the existing filter pipeline).
- Homepage "View all" link → `/find-a-professional?featured=true`.

### 4. `/admin/directory` — wire to live data

Match the mockup. Sole admin = `cruz.pt@icloud.com`, gated by `requireRole(['admin'])`.

- **KPIs row**: Live listings (`count(professionals) where is_published`), Completeness (avg of `quality_score / max_score`), Broken links (placeholder 0 until crawler ships — show "—" not "14"), Featured slots (`featured_count / featured_capacity` across all scopes).
- **Listings needing attention**: lowest `quality_score` pros that are published, with the dominant gap (missing photo / bio / location / specialism). Row click → `/admin/professionals?id=…`.
- **Featured rotation**: shows today's global rotation. "Demote" is hidden for now (rotation is automatic) — replace with a small "Auto-rotated daily" caption + a "Refresh now" button that clears the day's cache for preview.
- **Geographic coverage**: `group by city` from `professional_locations`, top 8.
- **Crawl alerts card**: keep as visible-but-stubbed (button disabled, copy says "Link crawler ships in a later release"). Honest > fake numbers.

### 5. Dashboard surface (paid-pro side)

Single new card on `/dashboard` for paid-tier users:
> **You're featured on REPs** — Verified pros are rotated into our homepage, city, and profession pages automatically. *Last shown: 2 days ago · Next rotation: tomorrow.*

For unpaid pros: same card slot, different copy → "Upgrade to Verified to appear in featured rotations." Links to `/pricing`.

---

## What I deliberately won't do

- No `featured` boolean column, no admin promote/demote UI, no Stripe SKU, no public "Featured" badge on cards.
- No change to the existing homepage / city / profession card visuals.
- No crawler — admin shows "—" + honest stub.

## Out of scope (next passes)

- Admin override ("pin this pro to the top of London for 7 days") — easy to add later via a `featured_overrides` table if you actually want it.
- Per-scope featured caps and waitlists — only needed once a single scope has dozens of paid pros.
- Email when a pro first appears in rotation.

## Technical notes (for me)

- Use a sub-agent to do the `/admin/directory` wire-up in parallel with the public-rail swap — they touch disjoint files.
- `getFeaturedPros` is **public read-only** → server publishable client, narrow `TO anon` SELECT projection (id, slug, full_name, avatar_url, primary_profession, city, headline, identity_status, tier). Make sure the existing anon policies on `professionals` / `profiles` already cover this; if not, the migration adds them (no destructive changes).
- Daily shuffle seed = `YYYY-MM-DD` + scope string, deterministic across SSR + client so hydration matches.
- TanStack Query: `staleTime: 1000 * 60 * 60` (1h) on featured rails — they only change once per day anyway.
