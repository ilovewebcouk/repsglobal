# Plan: real admin, password eye, Apple BYOC

Three small, independent changes.

---

## 1. Make `cruz.pt@icloud.com` a real admin

Your account already exists (`auth.users` row found). One migration adds the admin role.

```sql
INSERT INTO public.user_roles (user_id, role)
VALUES ('3d8ffa68-f4b2-46b2-bdac-d06b48fbf445', 'admin')
ON CONFLICT (user_id, role) DO NOTHING;
```

After this runs:
- Sign in at `/auth` → your avatar dropdown shows **Admin console** (already wired via `has_role` + `useSessionUser`).
- The seeded `pros@repsuk.org` admin stays in place; remove later if you want.

No code changes — the navbar already reflects real Supabase role state.

---

## 2. Password eye toggle on `/auth`

Frontend-only change in `src/routes/auth.tsx`:

- Add `const [showPassword, setShowPassword] = useState(false)`.
- Wrap the existing `<Input>` in a relative container, set `type={showPassword ? "text" : "password"}`, and add a right-aligned `<Button variant="ghost" size="icon">` with `Eye` / `EyeOff` (lucide-react) inside.
- Right-pad the input (`pr-10`) so text doesn't slide under the icon.
- `aria-label` toggles between "Show password" / "Hide password"; `aria-pressed={showPassword}`.
- Apply the same treatment to the sign-up password field (and "confirm password" if present) so the UX is consistent.

No new deps — `Eye`/`EyeOff` and `Button` are already in use across the app.

---

## 3. Apple sign-in — BYOC wiring

Two parts: (a) what I'll do in the codebase, (b) what you need to do in Apple Developer + Lovable Cloud dashboard. You can't ship Apple sign-in without (b), but I'll prep everything so it's a 10-minute paste job.

### What I'll do (code)

- Run `supabase--configure_social_auth` with `providers: ["apple"]` (keeps Google + email enabled). This generates/refreshes `src/integrations/lovable/` and installs `@lovable.dev/cloud-auth-js` if not present.
- Confirm the existing "Continue with Apple" button on `/auth` calls:
  ```ts
  await lovable.auth.signInWithOAuth("apple", { redirect_uri: window.location.origin });
  ```
  Add the same `result.error` / `result.redirected` handling pattern already used for Google. (If the button is currently a stub, wire it up.)

That's the full code side. Apple works the moment you paste credentials into the backend dashboard.

### What you do (Apple Developer + dashboard)

You'll need:

1. **Apple Developer account** ($99/yr) — https://developer.apple.com
2. **Services ID** (acts as the Client ID) at Identifiers → "+" → Services IDs.
   - Enable **Sign In with Apple** on it.
   - Configure → add domain `repsglobal.lovable.app` (and `staging.repsuk.org`, plus any other custom domains).
   - Add return URL: `https://ftlrvwripgnpyjlrvtgw.supabase.co/auth/v1/callback`
3. **Sign in with Apple Key (.p8)** at Keys → "+".
   - Enable Sign In with Apple, link to your primary App ID.
   - Download the `.p8` file (only available once — save it).
   - Copy the **Key ID** (10 chars).
4. **Team ID** — top-right of Apple Developer Console (10 chars).
5. In Lovable Cloud backend → **Users → Auth Settings → Sign In Methods → Apple → "Use your own credentials"**:
   - Paste Team ID, Key ID, Client ID (= the Services ID), and the `.p8` contents.
   - Click **Generate Secret** → it builds a JWT valid 6 months.
   - **Set a calendar reminder to regenerate before expiry** — otherwise Apple sign-in breaks silently in ~6 months.

### Risk / caveat

- BYOC = your "REPs" name appears on the Apple consent sheet (good for brand).
- The 6-month JWT is the main operational footgun — I'll add a note to the Phase 2.0 doc as a recurring task.
- We can flip back to Managed Apple any time by clearing the BYOC fields in the dashboard.

---

## Technical notes

- The admin grant is data-only (no schema change); migration approval flow still applies.
- `useSessionUser` already calls `has_role` RPC, 60s staleTime — admin status appears within a minute of grant, immediately on next page load.
- The password toggle stays uncontrolled at the form level; no impact on `signInWithPassword` payload.
- After `configure_social_auth` runs, do not edit `src/integrations/lovable/` — it's managed.

---

## Out of scope

- Building the actual `/admin` console UI (separate task).
- Removing the seeded `pros@repsuk.org` admin (optional cleanup).
- Custom-domain DNS or Apple App ID creation — assume your developer account is in good standing.
