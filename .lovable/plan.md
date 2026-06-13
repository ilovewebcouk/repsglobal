## User cleanup plan

**Keep (2 users):**
- `cruz.pt@icloud.com` — roles: **admin + professional + client** (full visibility into all 3 dashboards). No paid subscription needed (admin bypasses tier gates; pro/client dashboards are role-gated, tier only gates tools inside the pro dashboard).
- `demo-verified@repsuk.org` — role: **professional**, tier: **verified** (unchanged).

**Delete (5 users)** via `supabaseAdmin.auth.admin.deleteUser(id)` — `ON DELETE CASCADE` cleans profiles, user_roles, professionals, clients, subscriptions, etc.:
1. `demo-admin@repsuk.org`
2. `demo-pro@repsuk.org`
3. `demo-client@repsuk.org`
4. `cruz.pt+demo1@icloud.com`
5. `scott@smartdogtraining.com`

**Steps:**
1. Add missing `client` role row for `cruz.pt@icloud.com` and ensure a `clients` row exists (so the client portal renders).
2. Cancel any live Stripe subscriptions tied to `demo-pro` and `cruz.pt+demo1` (test mode) before deleting the auth users, so we don't leave orphaned Stripe subs.
3. Run a one-shot server script that calls `supabaseAdmin.auth.admin.deleteUser(id)` for each of the 5 emails above.
4. Verify with `SELECT` that only the 2 expected users remain and `cruz.pt` holds all 3 roles.
5. Update project memory: "Sole admin = `cruz.pt@icloud.com` (admin + professional + client). Verified demo account = `demo-verified@repsuk.org`."

**Sign-in note:** `cruz.pt@icloud.com` already exists in auth — no password reset needed unless you've forgotten it. Confirm before I run.

**One open question:** do you already know the password for `cruz.pt@icloud.com`, or should I trigger a password reset email as part of the run?
