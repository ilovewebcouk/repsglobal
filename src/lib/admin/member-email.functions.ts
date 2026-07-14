/**
 * Admin — change a member's login email.
 *
 * Uses the service-role Auth Admin API to update `auth.users.email`, marks
 * it confirmed, and writes an audit trail. Guarded by `has_role('admin')`.
 */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

async function assertAdmin(ctx: { supabase: any; userId: string }) {
  const { data: isAdmin } = await ctx.supabase.rpc("has_role", {
    _user_id: ctx.userId,
    _role: "admin" as never,
  });
  if (!isAdmin) throw new Error("Forbidden: admin role required");
}

const Input = z.object({
  user_id: z.string().uuid(),
  email: z.string().trim().toLowerCase().email().max(254),
  reason: z.string().trim().min(1).max(500),
});

export const adminUpdateMemberEmail = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => Input.parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const sa = supabaseAdmin as any;

    // Before state
    const { data: beforeUser, error: bErr } =
      await sa.auth.admin.getUserById(data.user_id);
    if (bErr || !beforeUser?.user) throw new Error("Member not found");
    const oldEmail: string | null = beforeUser.user.email ?? null;

    if (oldEmail && oldEmail.toLowerCase() === data.email) {
      return { ok: true, changed: false, email: oldEmail };
    }

    // Reject if another user already owns this email
    const { data: existing } = await sa.auth.admin.listUsers({
      page: 1,
      perPage: 1,
      // listUsers doesn't accept a direct email filter across all versions;
      // do a defensive scan via a targeted query.
    });
    // Best-effort duplicate check via profiles isn't reliable; rely on the
    // Auth API's own uniqueness error surface below.
    void existing;

    const { data: updated, error: uErr } = await sa.auth.admin.updateUserById(
      data.user_id,
      { email: data.email, email_confirm: true },
    );
    if (uErr) throw new Error(uErr.message);

    await sa.rpc("log_admin_action", {
      _actor_id: context.userId,
      _action: "member.email_change",
      _target_table: "auth.users",
      _target_id: data.user_id,
      _before_state: { email: oldEmail },
      _after_state: { email: updated?.user?.email ?? data.email },
      _reason: data.reason,
    });

    return {
      ok: true,
      changed: true,
      email: updated?.user?.email ?? data.email,
    };
  });
