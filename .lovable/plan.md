## Root cause

`listSupportNotifications` (the admin bell) runs on every admin page, including while the admin is **impersonating** a professional. `requireSupabaseAuthWithImpersonation` deliberately swaps `context.userId` to the impersonated pro and `context.supabase` to the service-role client, leaving the real admin id only on `context.realUserId`.

`assertAdmin` then calls `has_role(userId, 'admin')` with the **impersonated pro's** id → not an admin → throws `Forbidden`, blanking the screen.

## Fix (one file, ~3 lines)

`src/lib/support/tickets.functions.ts` — update `assertAdmin` to check the real caller, not the impersonated identity:

```ts
async function assertAdmin(ctx: { supabase: any; userId: string; realUserId?: string }) {
  const checkUserId = ctx.realUserId ?? ctx.userId;
  const { data, error } = await ctx.supabase.rpc("has_role", {
    _user_id: checkUserId,
    _role: "admin",
  });
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Forbidden");
}
```

`realUserId` is always populated by `requireSupabaseAuthWithImpersonation` (equal to `userId` when not impersonating), so all 15 call sites keep working unchanged. Service-role `supabase` can still run the `has_role` RPC.

## Out of scope
- No other ticket fns change.
- Does not touch the impersonation middleware or any other module.
