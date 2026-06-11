## Goal

After signing in at `/auth`, each demo account lands where it belongs:

| Role | Lands at |
|---|---|
| `admin` (pros@repsuk.org) | `/admin` |
| `professional` | `/dashboard` (existing pro onboarding) |
| `client` | `/clients` (new minimal landing) |

Today all three land on `/dashboard` because there is no role check after sign-in and no client surface exists.

## Scope

In scope:
1. A server function that returns the signed-in user's effective role (`admin` > `professional` > `client`).
2. A post-sign-in redirect on `/auth` that uses that role to navigate.
3. Move the existing top-level admin routes under `_authenticated/_admin/` and add an admin-only `beforeLoad` gate using `has_role('admin')`. This is required anyway — `/admin*` is currently ungated, so anyone can load it.
4. A new auth-gated client landing at `/_authenticated/clients/index.tsx` with: greeting, "Find a professional" CTA, and a simple list of any active `coach_client` links for the user. No new tables.
5. A guard at the top of the existing `/dashboard` (pro onboarding) that bounces admins → `/admin` and clients → `/clients`, so deep links route correctly too.

Out of scope:
- Redesigning `/admin` or the pro dashboard.
- Building a real client portal (messaging, programmes, check-ins).
- Touching any locked Phase 1 visual.

## Technical detail

### New server function
`src/lib/auth/role.functions.ts`
```ts
export const getMyEffectiveRole = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data } = await context.supabase
      .from("user_roles").select("role").eq("user_id", context.userId);
    const roles = new Set((data ?? []).map(r => r.role));
    if (roles.has("admin")) return "admin" as const;
    if (roles.has("professional")) return "professional" as const;
    return "client" as const;
  });
```

### /auth post-sign-in
In the existing auth route's `onAuthStateChange` / sign-in success handler, call `getMyEffectiveRole()` and `navigate({ to: dest, replace: true })` where `dest` is `/admin`, `/dashboard`, or `/clients`. Honour an existing `?redirect=` search param if present.

### Admin gate
- Create `src/routes/_authenticated/_admin/route.tsx`:
  ```tsx
  beforeLoad: async ({ context }) => {
    const role = await getMyEffectiveRole();
    if (role !== "admin") throw redirect({ to: "/dashboard" });
  }
  ```
- Move existing files:
  - `admin.tsx` → `_authenticated/_admin/admin.index.tsx` (or rename to `_authenticated/_admin/index.tsx` → URL `/admin`)
  - `admin_.cpd.tsx` → `_authenticated/_admin/admin.cpd.tsx`, etc. for all `admin_.*.tsx`
- Update every `createFileRoute("/admin/...")` string to `"/_authenticated/_admin/admin/..."` (filenames keep dot-separated convention; route IDs reflect the layout segment).
- Internal `<Link to="/admin/...">` references stay the same — URLs are unchanged.

### Client landing
`src/routes/_authenticated/clients.index.tsx`:
- Header with greeting (uses `profiles.full_name`).
- Card grid: any rows from `coach_client` where `client_id = auth.uid()` AND `status = 'active'`, joined to `professionals` (slug, headline, city, photo). Empty state: "You're not connected to a coach yet — find one on the global register" → `/find-a-professional`.
- Server fn `getMyCoaches` using `requireSupabaseAuth` + RLS.

### /dashboard guard
At the top of `src/routes/_authenticated/dashboard.tsx`:
```ts
beforeLoad: async () => {
  const role = await getMyEffectiveRole();
  if (role === "admin") throw redirect({ to: "/admin" });
  if (role === "client") throw redirect({ to: "/clients" });
}
```

## Verification

1. `bun run build` clean.
2. Sign in as `pros@repsuk.org` → lands on `/admin`. Visiting `/dashboard` bounces to `/admin`.
3. Sign in as the demo professional → lands on `/dashboard`. Visiting `/admin` bounces to `/dashboard`.
4. Sign in as the demo client → lands on `/clients`. Visiting `/admin` or `/dashboard` bounces to `/clients`.
5. Signed-out visit to `/admin` → redirects to `/auth?redirect=/admin`.
