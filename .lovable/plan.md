## What broke

1. **The Leads page is rendering the wrong sidebar tier.**
   - `src/routes/_authenticated/_professional/dashboard_.leads.tsx:82` mounts `<DashboardShell role="trainer" ...>` **without** a `tier` prop.
   - `src/components/dashboard/DashboardShell.tsx:447-450` defaults `tier = "pro"`.
   - Result: a **Verified** member who lands on `/dashboard/leads` gets the **Pro nav** rendered in the sidebar.

2. **The credit wallet is not in Settings yet.**
   - The database layer exists, but `src/routes/_authenticated/_professional/dashboard_.settings.tsx` currently has no credits / usage / top-up UI.
   - So right now there is **no visible wallet surface** in settings.

3. **Brutal truth:** this is not world-class right now.
   - It is a **trust-breaking UI regression**: even if the route/data permissions still hold, showing Pro-only navigation to Verified members is sloppy and confusing.
   - The wallet work is also only half-done until the Settings surface exists.

## Plan

### 1. Fix the tier leak at the source
- Update `/dashboard/leads` to read the real tier via `useTrainerTier()` and pass it into `DashboardShell`.
- Remove the dangerous fallback behavior that silently promotes trainer pages to Pro nav.
- Make trainer-shell usage explicit so a missing `tier` cannot quietly render the wrong nav again.

### 2. Harden the shell so this cannot recur
- Refactor `DashboardShell` so trainer pages do **not** default to `"pro"`.
- Use a safe trainer-tier resolution pattern:
  - either require `tier` for every trainer page,
  - or have the shell derive it internally from route context for trainer role.
- Audit the trainer routes and align them to one consistent pattern.

### 3. Put the credit wallet inside Settings
- Add an **AI Credits & Usage** section to `src/routes/_authenticated/_professional/dashboard_.settings.tsx`.
- Include:
  - current balance
  - monthly refill amount
  - recent credit transactions
  - top-up pack CTA area
- Keep it **inside the existing Settings page**, not as a detached page.

### 4. Verify against the live preview before claiming fixed
- Re-open `/dashboard/leads` as a Verified account.
- Confirm the sidebar only shows the Verified nav set.
- Open `/dashboard/settings` and confirm the wallet section is present.
- Capture screenshots of both states after the fix.

## Technical notes

- Root cause file: `src/routes/_authenticated/_professional/dashboard_.leads.tsx`
- Bad default file: `src/components/dashboard/DashboardShell.tsx`
- Wallet UI target: `src/routes/_authenticated/_professional/dashboard_.settings.tsx`
- Expected Verified nav after fix:
```text
Dashboard
Leads
Public Profile
Shop-front
Verification
Education & CPD
Settings
```

## Deliverables

1. Verified members no longer see Pro/Studio sidebar links on `/dashboard/leads`.
2. The shell is hardened so missing tier props do not silently render the wrong nav.
3. The credit wallet appears inside Settings.
4. Post-fix browser verification + screenshots.