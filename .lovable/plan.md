## Goal

Kill the "Verified means two different things" problem on Jordon's dashboard, and stop lying about insurance status.

Three fixes, all UI/copy + one trust-state computation tweak. No schema changes, no Stripe price changes — the £99/yr tier keeps the same product/price IDs, only its **display name** changes.

---

## 1. Rename the £99/yr tier "Verified" → "Core"

The tier name collides with the verification status. Renaming to **Core** keeps the ladder readable: **Core → Pro → Studio**.

What changes:

- `src/lib/billing.ts` — tier label/copy constants: `"Verified"` → `"Core"` (and `"Verified plan"` → `"Core plan"`). Keep all Stripe `price_…` / `prod_…` IDs and the internal `tier` enum key (`"verified"`) untouched so subscriptions, webhooks, RLS, and `useTrainerTier()` keep working.
- `src/hooks/use-effective-identity.ts` — `tier === "verified" ? "Verified"` → `"Core"`.
- `src/components/dashboard/DashboardShell.types.ts` / `nav-data` — anywhere a tier label string is rendered, swap to "Core".
- Sidebar member card ("Verified" pill under Jordon's email) → "Core".
- `/pricing`, `/for-professionals`, comparison pages, `/features/*` Verified-vs-Pro matrices, FAQ copy, and any "Join REPS Verified" CTAs → "Join REPS Core" / "Core plan". (Pass: ripgrep for `Verified` in `src/routes/{pricing,for-professionals,features.*,compare*,standards}.tsx`, `src/components/{marketing,pricing}/**`, and the help articles in `src/content/help/**`. Skip matches that refer to the trust state, e.g. "REPS Verified badge".)
- Email templates and any admin copy that says "Verified tier".

What does **not** change:

- The trust badge stays **"REPS Verified"** — that's the 3-of-3 credential.
- DB enum/internal key stays `"verified"` (renaming the enum would touch every RLS policy and subscription row for zero user benefit).
- `is_pro_fully_verified()` and `list_fully_verified_pro_ids()` — unaffected.
- Stripe prices.

Memory update: `mem://index.md` Core line "Phase 2.0 in progress: wire Verified £99/yr…" → "Core £99/yr…", and add a one-liner: *"Tier rename: £99/yr tier is **Core** in all UI/marketing. Internal enum key stays `verified`. The trust badge is **REPS Verified** (3-of-3) — different concept."*

---

## 2. Replace the orange tier chip beside "Jordon Gumbley" with a true verification pill

Today the header (`DashboardHeader` / hub welcome card on `/dashboard`) renders the tier as an orange "Verified" pill right next to the trainer's name. That reads as "your profile is verified" — it isn't (Jordon is 2/3).

Change: render `<VerificationPill identityStatus={…} verification={…} />` (the existing component in `src/components/directory/VerificationPill.tsx`, dark-variant) driven by `getTrustState`:

- All 3 ticks (identity + insurance active + qualification) → emerald **"REPS Verified"** pill.
- Anything less → neutral **"Unverified"** pill.

Tier ("Core / Pro / Studio") moves to: (a) the sidebar member card where it already exists, and (b) a small muted label under the verification pill if needed for hierarchy. The header stops conflating the two.

Files: the welcome/hero card in `src/routes/_authenticated/_professional/dashboard.tsx` (and the hub equivalent for the `/dashboard` Hub redesign) + wherever `DashboardShell` renders the inline tier chip.

---

## 3. Insurance card: show "Expired" instead of "In review" when the cert has lapsed

`getTrustState` already computes `insurance.status = "expired"` correctly when `expiry_date < today`, even if the DB row is still `pending`. The Verification sidebar card on `/dashboard` is reading the raw row status ("Admin is reviewing your certificate · In review") instead of the trust-state-derived status. That's the lie in the screenshot.

Fix the small "Verification" panel on the hub (right-rail card in the screenshot) to consume `getTrustState().insurance.status` and render:

| status | pill | subline | CTA |
|---|---|---|---|
| `active` | emerald "In date" | provider · expires DD MMM YYYY | — |
| `expired` | **rose "Expired"** | "Your certificate lapsed on DD MMM YYYY" | **"Upload renewed certificate"** → `/dashboard/verification#insurance` |
| `pending` (and not expired) | amber "In review" | "Admin is reviewing your certificate" | — |
| `rejected` | rose "Rejected" | reason if present | "Upload new certificate" |
| `none` | neutral "Not started" | "Upload your professional liability cover" | "Upload certificate" |

Same logic should drive the matching row on `/dashboard/verification` (already uses `InsuranceProfileCard` — confirm its pill maps `expired` → rose, not amber/in-review).

Knock-on: the "Needs your attention" list ("Complete your verification") should split into discrete tasks when there's an actionable signal — at minimum surface a dedicated **"Insurance expired — upload renewed certificate"** card when `insurance.status === "expired"`, separate from the generic "Complete your verification" nudge.

---

## Technical notes

- No DB migration. No Stripe product changes.
- `useTrainerTier()` keeps returning `"verified" | "pro" | "studio"` — only display strings change.
- `VerificationPill` already exists; reuse the "onImage" variant for the dark header.
- The trust card's "Insurance on file · In review" copy currently lives in the right-rail `Verification` card on the hub (the screenshot's third panel). That card needs to read from `getTrustState` rather than the raw `insurance_policies.status`.
- Audit: after the rename, grep for stray `"Verified"` referring to the tier (not the badge) in: `src/lib/billing.ts`, `src/components/pricing/**`, `src/routes/pricing.tsx`, `src/routes/for-professionals.tsx`, `src/routes/features.*`, `src/routes/compare*.tsx`, `src/content/help/**`, `src/emails/**`.

---

## Out of scope

- Renaming the `verification_status` enum or the `tier` enum value (cosmetic-only rename keeps blast radius tiny).
- Auto-rejecting expired insurance in admin queue (already on roadmap; today it stays `pending` until an admin actions it — UI just stops lying about that).
- Touching the public profile or `/pro/$slug` — already correct (uses `VerificationPill` + `is_pro_fully_verified`).
