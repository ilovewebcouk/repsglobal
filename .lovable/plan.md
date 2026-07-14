
## What's wrong today

The provider dashboard reuses the **trainer-shaped** readiness and NeedsAttention cards. That's why the signals feel off:

- Verification currently uses the trainer trust state (identity + **insurance** + **qualifications**), but providers actually have a completely different 3-step flow (**identity + provider name lock-in + domain verification** — see `getProviderVerificationSummary`).
- "Insurance expires in X days" and "Upload a qualification certificate" can appear for providers even though they don't apply.
- Website nudges point at the **trainer** website sections/editor (`about`, `method`, `transformations`…), not the provider directory page.
- Nothing signals the **certificate logo (160 × 60)** — even though the checkout server function refuses to run without it.
- Nothing signals the **cover image** (`websites.hero_image_url`) or **listing logo** (`profiles.avatar_url`) used on `/find-a-training-provider` and `/t/$slug`.
- Nothing prompts the two big adoption moments the user called out: **"Get your first qualification endorsed"** and **"Issue your first certificate"**.

## Scope

- Only the **provider branch** of `DashboardHome.tsx` changes (the `isOrganisation` block).
- Trainer dashboard is untouched.
- **Visual layout, spacing, typography, tokens all stay identical** — same two-column grid, same panels, same ring, same badges/tones. We're only swapping the signals inside those two cards.
- No schema changes. Everything needed already lives in existing tables (`profiles`, `professionals`, `websites`, `provider_domain_verifications`, `reps_courses`, `certificate_registrations`, `certificate_batches`).

## The two cards, re-signalled

### "Needs your attention" — provider version

Ordered by priority. Cap at 8 visible items (same as today).

1. **Danger / warn strip**
   - Unread enquiries (keep — same query)
   - Reviews needing a response (keep)
   - Support replies waiting (keep)

2. **Provider verification (3 steps)** — replaces the trainer verify row
   - If identity not approved → "Verify your identity with Stripe Identity" → `/dashboard/verification`
   - If name not locked → "Lock in your provider name" → `/dashboard/verification`
   - If domain not approved → "Confirm your provider email domain" → `/dashboard/verification` (with sub-copy reflecting `unstarted / email_sent / pending_admin_review`)

3. **Branding & listing readiness**
   - If `profiles.avatar_url` missing → "Add your provider logo" → opens the logo popover on the welcome banner (deep link `?edit=logo`)
   - If `websites.hero_image_url` missing → "Add a cover image for your listing" → deep link `?edit=cover`
   - If `profiles.certificate_logo_url` missing → **"Upload your certificate logo (160 × 60 px)"** → `/dashboard/students?tab=certificates` (matches the existing gate)
   - If `websites.tagline` or public bio empty → "Write a short tagline for your provider page"

4. **Publish state — provider directory page** (`/t/$slug`, not `/c/$slug`)
   - If never published → "Your provider page has never been published"
   - If `has_unpublished_changes` → "You have unpublished changes on your provider page"

5. **Adoption milestones (the two the user asked for)**
   - If no `reps_courses` row with `status = 'accredited'` → **"Get your first qualification endorsed"** → `/dashboard/qualifications` (or wherever the endorsement submission form lives — will confirm during build by grep)
   - If verification complete + branding complete + at least one accredited course + no `certificate_registrations` row with `status = 'issued'` for this `provider_id` → **"Issue your first certificate"** → `/dashboard/students`

6. **Empty state** — when nothing above triggers, the same "All caught up" empty state renders (identical component).

### "Your REPS readiness" ring — provider version

Same visual card, ring, and per-pillar rows. New pillars, new weights:

| Pillar | Weight | What counts as "done" |
| --- | --- | --- |
| **Verification** | 35% | 3-of-3 from `getProviderVerificationSummary` (identity + name locked + domain approved) |
| **Branding & listing** | 30% | 5 checks: logo, cover image, certificate logo, tagline, public bio present |
| **Provider page** | 20% | Published at least once AND `has_unpublished_changes = false` |
| **Endorsement & certificates** | 15% | 2 checks: ≥1 accredited course, ≥1 issued certificate |

Overall % is the weighted rollup, same rounding as today. Ring turns emerald at 100% (unchanged behaviour).

Per-row detail lines follow the same pattern as the trainer card ("2 of 5 done", "Publish your provider page", etc.).

## Technical details

New server function `getProviderReadiness` in `src/lib/dashboard/provider-readiness.functions.ts`:

- `.middleware([requireSupabaseAuthWithImpersonation])`
- Asserts `professionals.account_type = 'organisation'`
- Runs its own `Promise.all` batch: reuse `getProviderVerificationSummary` internals (identity + name + domain), plus `profiles(avatar_url, certificate_logo_url)`, `websites(hero_image_url, tagline, about, published_at, published_snapshot, has_unpublished_changes)`, `reps_courses(count where status='accredited' and provider_id=me)`, `certificate_registrations(count where provider_id=me and status='issued')`
- Returns a `ProviderReadinessResult` shaped for the four pillars above, plus flags each card needs (`hasLogo`, `hasCover`, `hasCertLogo`, `hasTagline`, `hasBio`, `providerPagePublished`, `providerPageHasUnpublishedChanges`, `accreditedCourseCount`, `issuedCertificateCount`, plus the raw `ProviderVerificationSummary`).

New components in the same file as the trainer versions (`src/components/dashboard/hub/index.tsx`):

- `ProviderNeedsAttention` — mirrors `NeedsAttention`'s shape but takes `providerReadiness` and produces the item list above. Same `Attention` type, same `PPanel` chrome.
- `ProviderReadinessCard` — mirrors `CompletenessCard`'s shape but reads from `ProviderReadinessResult` and the new 4-pillar breakdown.
- Existing `useHubData` gains a `providerReadiness` query (only enabled when `accountType === 'organisation'`) so we don't pay for it on trainer sessions.

Wiring change in `src/components/dashboard/organisation/DashboardHome.tsx`:

- In the `isOrganisation` branch, swap:
  - `<NeedsAttention …/>` → `<ProviderNeedsAttention providerReadiness={hub.providerReadiness.data ?? null} unreadEnquiries={…} pendingReviewReplies={…} unreadSupport={hub.supportUnread} />`
  - `<CompletenessCard readiness={hub.readiness.data ?? null} />` → `<ProviderReadinessCard providerReadiness={hub.providerReadiness.data ?? null} />`
- Also drop the `enqStats` hard-coded `0` — pass the real value (the query already exists in `useHubData`); the trainer branch already does this.

Deep links for branding nudges:

- `ProviderWelcomeBanner` already has the logo and cover popovers. Add read of `?edit=logo|cover` from the route search on mount so the matching popover opens automatically when arriving from a "Needs your attention" click. This is a small addition; the visual banner does not change.

## Out of scope (call-outs)

- No changes to the **trainer** dashboard, readiness function, or NeedsAttention component.
- No visual redesign — the two panels keep their exact tokens, radii, spacing, ring, and empty state. Only what appears **inside** them changes.
- No new tables, no new columns, no new RLS. The `certificate_logo_url`, `hero_image_url`, `avatar_url`, `reps_courses.status`, and `certificate_registrations.status` columns already exist and already have the right policies for owner reads.
- No admin dashboard changes.
- Not renaming "REPs readiness" — it stays that way.

## Acceptance checks (post-build)

- Fresh provider (no verification, no images, no courses, no certs) sees exactly the right nudges — verification 3 rows + branding rows + endorsement + certificate onboarding — with no "insurance" or "qualification certificate" leakage.
- Fully-verified provider with logo, cover, certificate logo, published `/t/$slug`, ≥1 accredited course, ≥1 issued certificate → ring at 100%, "All caught up" empty state.
- Clicking each nudge lands on the correct destination (verification, `/dashboard/students?tab=certificates`, welcome-banner popover, etc.).
- Trainer dashboard behaves exactly as before (regression check).
