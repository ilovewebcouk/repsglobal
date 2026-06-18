import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const Input = z.object({ limit: z.number().int().min(1).max(500).default(100) });

export type AuditLogRow = {
  id: string;
  created_at: string;
  actor_id: string | null;
  actor_name: string | null;
  actor_email: string | null;
  action: string;
  target_table: string | null;
  target_id: string | null;
  target_name: string | null;
  reason: string | null;
  before_state: string | null;
  after_state: string | null;
};

export const listAdminAuditLog = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => Input.parse(d ?? {}))
  .handler(async ({ data, context }): Promise<AuditLogRow[]> => {
    const { supabase, userId } = context;
    const { data: isAdmin } = await supabase.rpc("has_role", {
      _user_id: userId,
      _role: "admin",
    });
    if (!isAdmin) throw new Error("Forbidden");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: rows, error } = await supabaseAdmin
      .from("admin_audit_log")
      .select("id, created_at, actor_id, action, target_table, target_id, reason, before_state, after_state")
      .order("created_at", { ascending: false })
      .limit(data.limit);
    if (error) throw new Error(error.message);

    const actorIds = Array.from(new Set((rows ?? []).map((r) => r.actor_id).filter(Boolean))) as string[];
    const targetIds = Array.from(
      new Set((rows ?? []).filter((r) => r.target_id).map((r) => r.target_id as string)),
    );

    const [profilesRes, usersRes] = await Promise.all([
      actorIds.length
        ? supabaseAdmin.from("profiles").select("id, full_name").in("id", actorIds)
        : Promise.resolve({ data: [] as { id: string; full_name: string | null }[] }),
      actorIds.length
        ? supabaseAdmin.auth.admin
            .listUsers({ page: 1, perPage: 200 })
            .then((r) => ({ data: r.data?.users ?? [] }))
        : Promise.resolve({ data: [] as { id: string; email?: string | null }[] }),
    ]);

    const nameById = new Map<string, string | null>();
    for (const p of (profilesRes.data ?? []) as { id: string; full_name: string | null }[]) {
      nameById.set(p.id, p.full_name);
    }
    const emailById = new Map<string, string | null>();
    for (const u of usersRes.data as { id: string; email?: string | null }[]) {
      if (actorIds.includes(u.id)) emailById.set(u.id, u.email ?? null);
    }

    // target names — only for profiles/professionals targets (lookup by id)
    const targetNameById = new Map<string, string | null>();
    if (targetIds.length) {
      const { data: tp } = await supabaseAdmin
        .from("profiles")
        .select("id, full_name")
        .in("id", targetIds);
      for (const r of (tp ?? []) as { id: string; full_name: string | null }[]) {
        targetNameById.set(r.id, r.full_name);
      }
    }

    return (rows ?? []).map((r) => ({
      id: r.id,
      created_at: r.created_at,
      actor_id: r.actor_id,
      actor_name: r.actor_id ? nameById.get(r.actor_id) ?? null : null,
      actor_email: r.actor_id ? emailById.get(r.actor_id) ?? null : null,
      action: r.action,
      target_table: r.target_table,
      target_id: r.target_id,
      target_name: r.target_id ? targetNameById.get(r.target_id) ?? null : null,
      reason: r.reason,
      before_state: r.before_state == null ? null : JSON.stringify(r.before_state),
      after_state: r.after_state == null ? null : JSON.stringify(r.after_state),
    }));
  });
