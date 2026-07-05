// Admin — password reset visibility for Member 360.
// Reads auth.users.recovery_sent_at and the recent recovery email send log
// for a member so support can see whether a reset was requested and whether
// the email actually left the platform.

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const Input = z.object({ user_id: z.string().uuid() });

export type PasswordResetAttempt = {
  id: string;
  status: string;
  error_message: string | null;
  created_at: string;
};

export type PasswordResetInfo = {
  recovery_sent_at: string | null;
  attempts: PasswordResetAttempt[];
};

export const getMemberPasswordResetInfo = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => Input.parse(d))
  .handler(async ({ data, context }): Promise<PasswordResetInfo> => {
    const { supabase, userId } = context;
    const { data: isAdmin } = await supabase.rpc("has_role", {
      _user_id: userId,
      _role: "admin",
    });
    if (!isAdmin) throw new Error("Forbidden");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const authRes = await supabaseAdmin.auth.admin.getUserById(data.user_id);
    const email = authRes.data?.user?.email ?? null;

    const [recoveryRes, logRes] = await Promise.all([
      supabase.rpc("admin_get_recovery_sent_at", { _user_id: data.user_id }),
      email
        ? supabase.rpc("admin_get_recovery_email_log", { _email: email, _limit: 10 })
        : Promise.resolve({ data: [] as PasswordResetAttempt[], error: null } as const),
    ]);

    return {
      recovery_sent_at: (recoveryRes.data as string | null) ?? null,
      attempts: (logRes.data as PasswordResetAttempt[] | null) ?? [],
    };
  });
