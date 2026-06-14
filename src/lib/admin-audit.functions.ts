import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

const logAdminActionSchema = z.object({
  action: z.string().min(1),
  targetTable: z.string().optional(),
  targetId: z.string().uuid().optional(),
  beforeState: z.record(z.unknown()).optional(),
  afterState: z.record(z.unknown()).optional(),
  reason: z.string().optional(),
});

/**
 * Log a privileged admin action to the audit trail.
 *
 * Every Phase B–F admin mutation should call this so the platform
 * retains a tamper-resistant record of who changed what and when.
 *
 * Requires: signed-in user with `admin` role.
 */
export const logAdminAction = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) => logAdminActionSchema.parse(data))
  .handler(async ({ data, context }) => {
    const { userId, supabase } = context;

    const { data: isAdmin } = await supabase.rpc("has_role", {
      _user_id: userId,
      _role: "admin",
    });

    if (!isAdmin) {
      throw new Error("Forbidden: admin role required");
    }

    const rpcParams: Record<string, unknown> = {
      _actor_id: userId,
      _action: data.action,
    };
    if (data.targetTable) rpcParams._target_table = data.targetTable;
    if (data.targetId) rpcParams._target_id = data.targetId;
    if (data.beforeState) rpcParams._before_state = data.beforeState as unknown;
    if (data.afterState) rpcParams._after_state = data.afterState as unknown;
    if (data.reason) rpcParams._reason = data.reason;

    const { data: logId, error } = await supabase.rpc(
      "log_admin_action",
      rpcParams as Parameters<typeof supabase.rpc>[1],
    );

    if (error) {
      throw new Error(`Audit log failed: ${error.message}`);
    }

    return { id: logId as string };
  });
