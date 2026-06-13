/**
 * Admin-only: force-reset a pro's legal name after identity approval.
 *
 * Phase 2.1 / Sub-pass 0b. After identity approval, profiles.full_name is
 * immutable from the dashboard (enforced by tg_lock_full_name_after_identity_approved).
 * If a real-world correction is needed (typo, deed-poll change, etc.) an
 * admin uses this server fn — it runs as service_role via supabaseAdmin so
 * the trigger lets it through, and it logs the change with an explicit
 * reason in identity_name_changes for the audit trail.
 */

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const Input = z.object({
  user_id: z.string().uuid(),
  new_full_name: z.string().trim().min(1).max(120),
  reason: z.string().trim().min(8).max(500),
});

export const forceResetLegalName = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => Input.parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    // Authorize: must be admin.
    const { data: isAdmin } = await supabase.rpc("has_role", {
      _user_id: userId,
      _role: "admin",
    });
    if (!isAdmin) {
      return { ok: false as const, error: "Forbidden" };
    }

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // Read current name for the audit row's old_value (the AFTER trigger will
    // also write a row, but we add an explicit one with the admin's reason).
    const { data: prev } = await supabaseAdmin
      .from("profiles")
      .select("full_name")
      .eq("id", data.user_id)
      .maybeSingle();
    const oldName = (prev as { full_name?: string | null } | null)?.full_name ?? null;

    const { error: updErr } = await supabaseAdmin
      .from("profiles")
      .update({ full_name: data.new_full_name })
      .eq("id", data.user_id);
    if (updErr) {
      return { ok: false as const, error: updErr.message };
    }

    // Explicit audit row with reason + actor (the trigger-written 'admin' row
    // has no reason field populated, so we add this one for the queue UI).
    await supabaseAdmin.from("identity_name_changes").insert({
      user_id: data.user_id,
      old_full_name: oldName,
      new_full_name: data.new_full_name,
      changed_by: userId,
      reason: data.reason,
      source: "admin",
    });

    return { ok: true as const };
  });
