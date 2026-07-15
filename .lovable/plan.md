## Bug

In `src/routes/admin_.certificates.tsx` line 977, the **Provider** button opens `/admin/providers/{provider_id}` — that route doesn't exist. The 404 URL in the screenshot (`/admin/providers/11111111-…`) confirms it. Provider profiles in admin live at `/admin/members/{userId}` (route file `admin_.members_.$userId.tsx`, which already renders `ProviderProfileMirror`).

`certificate_registrations.provider_id` = `professionals.id` = `auth.users.id` (same UUID), so it's the correct value — just the wrong URL.

## Fix

One-line change in `src/routes/admin_.certificates.tsx`:

```tsx
// before
onClick={() => window.open(`/admin/providers/${r.provider_id}`, "_blank")}
// after
onClick={() => window.open(`/admin/members/${r.provider_id}`, "_blank")}
```

Grep the rest of `src/` for any other `/admin/providers/` references and repoint them the same way (only the Search & Revoke tab uses it today, based on the grep — but I'll double-check when applying).

No data, no route, no schema changes.
