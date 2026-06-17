import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

async function assertAdmin(ctx: { supabase: any; userId: string }) {
  const { data, error } = await ctx.supabase.rpc("has_role", {
    _user_id: ctx.userId,
    _role: "admin",
  });
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Forbidden");
}

const BulkAction = z.enum([
  "resolve",
  "reopen",
  "pending",
  "delete",   // soft-delete → Trash (recoverable)
  "restore",  // Trash → previous status (status preserved on row)
  "purge",    // hard-delete from Trash (irreversible, typed-count confirm)
  "close",    // archive — replies start a new ticket
  "priority",
  "assign",
  "spam",
  "not_spam",
]);

/**
 * Apply a single action to many tickets in one SQL update.
 * Returns the previous row states so the UI can offer Undo (status/priority/assignee only).
 * Writes a single admin_audit_log row per bulk action.
 */
export const bulkUpdateTickets = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (d: {
      ids: string[];
      action: z.infer<typeof BulkAction>;
      payload?: {
        priority?: "urgent" | "high" | "normal" | "low";
        assigneeId?: string | null;
        confirmCount?: number; // required for `delete`
      };
    }) =>
      z
        .object({
          ids: z.array(z.string().uuid()).min(1).max(500),
          action: BulkAction,
          payload: z
            .object({
              priority: z.enum(["urgent", "high", "normal", "low"]).optional(),
              assigneeId: z.string().uuid().nullable().optional(),
              confirmCount: z.number().int().optional(),
            })
            .optional(),
        })
        .parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // Snapshot previous state for Undo + audit
    const { data: before, error: bErr } = await supabaseAdmin
      .from("support_tickets")
      .select("id, status, priority, assignee_id, resolved_at, closed_at, deleted_at")
      .in("id", data.ids);
    if (bErr) throw new Error(bErr.message);
    const previousStates = (before ?? []) as Array<{
      id: string;
      status: string;
      priority: string;
      assignee_id: string | null;
      resolved_at: string | null;
      closed_at: string | null;
      deleted_at: string | null;
    }>;

    let updated = 0;

    if (data.action === "purge") {
      // Hard delete — only allowed from Trash (deleted_at must be set on every row).
      if (
        typeof data.payload?.confirmCount !== "number" ||
        data.payload.confirmCount !== data.ids.length
      ) {
        throw new Error("Delete forever requires typed confirmation of the exact count");
      }
      const nonTrash = previousStates.filter((r) => !r.deleted_at);
      if (nonTrash.length > 0) {
        throw new Error("Only tickets already in Trash can be deleted forever.");
      }
      const { error: dErr, count } = await supabaseAdmin
        .from("support_tickets")
        .delete({ count: "exact" })
        .in("id", data.ids);
      if (dErr) throw new Error(dErr.message);
      updated = count ?? 0;
    } else {
      const nowIso = new Date().toISOString();
      const patch: Record<string, any> = {};
      if (data.action === "resolve") {
        patch.status = "resolved";
        patch.resolved_at = nowIso;
        patch.closed_at = null;
      } else if (data.action === "reopen") {
        patch.status = "open";
        patch.resolved_at = null;
        patch.closed_at = null;
        patch.deleted_at = null; // reopening from Trash also restores
      } else if (data.action === "pending") {
        patch.status = "pending";
        patch.resolved_at = null;
        patch.closed_at = null;
      } else if (data.action === "close") {
        // Archive — replies start a new linked ticket (handled in mailgun route).
        patch.status = "closed";
        patch.resolved_at = nowIso;
        patch.closed_at = nowIso;
      } else if (data.action === "spam") {
        patch.status = "spam";
        patch.resolved_at = null;
        patch.closed_at = null;
      } else if (data.action === "not_spam") {
        patch.status = "open";
        patch.resolved_at = null;
        patch.closed_at = null;
      } else if (data.action === "delete") {
        // Soft delete → Trash. Status preserved so Restore brings it back.
        patch.deleted_at = nowIso;
      } else if (data.action === "restore") {
        patch.deleted_at = null;
      } else if (data.action === "priority") {
        if (!data.payload?.priority) throw new Error("Priority required");
        patch.priority = data.payload.priority;
      } else if (data.action === "assign") {
        patch.assignee_id = data.payload?.assigneeId ?? null;
      }
      const { error: uErr, count } = await supabaseAdmin
        .from("support_tickets")
        .update(patch as never, { count: "exact" })
        .in("id", data.ids);
      if (uErr) throw new Error(uErr.message);
      updated = count ?? 0;
    }

    // Single audit row per bulk action
    await supabaseAdmin.rpc("log_admin_action", {
      _actor_id: context.userId,
      _action: `bulk_tickets.${data.action}`,
      _target_table: "support_tickets",
      _before_state: { tickets: previousStates },
      _after_state: { ids: data.ids, payload: data.payload ?? null },
    });


    return { updated, previousStates };
  });

/**
 * Undo a previous bulk action by restoring each ticket's prior status/priority/assignee.
 * Cannot undo `delete`.
 */
export const undoBulkUpdateTickets = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (d: {
      previousStates: Array<{
        id: string;
        status: string;
        priority: string;
        assignee_id: string | null;
        resolved_at: string | null;
      }>;
    }) =>
      z
        .object({
          previousStates: z
            .array(
              z.object({
                id: z.string().uuid(),
                status: z.string(),
                priority: z.string(),
                assignee_id: z.string().uuid().nullable(),
                resolved_at: z.string().nullable(),
              }),
            )
            .min(1)
            .max(500),
        })
        .parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // Group by status/priority/assignee tuple to minimise updates
    let restored = 0;
    for (const row of data.previousStates) {
      const { error } = await supabaseAdmin
        .from("support_tickets")
        .update({
          status: row.status,
          priority: row.priority,
          assignee_id: row.assignee_id,
          resolved_at: row.resolved_at,
        } as never)
        .eq("id", row.id);
      if (!error) restored += 1;
    }

    await supabaseAdmin.rpc("log_admin_action", {
      _actor_id: context.userId,
      _action: "bulk_tickets.undo",
      _target_table: "support_tickets",
      _after_state: { restored_count: restored },
    });


    return { restored };
  });
