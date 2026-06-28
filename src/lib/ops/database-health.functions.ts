// Database Health (v1) — connectivity, active connections, slow queries,
// storage usage. Read-only. Admin-only.

import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

async function assertAdmin(ctx: { supabase: unknown; userId: string }) {
  const supa = ctx.supabase as { rpc: (n: string, p: object) => Promise<{ data: unknown }> };
  const { data } = await supa.rpc("has_role", { _user_id: ctx.userId, _role: "admin" });
  if (!data) throw new Error("Forbidden");
}

export interface SlowQueryRow {
  query: string;
  mean_ms: number;
  calls: number;
}

export interface DatabaseHealthSnapshot {
  ok: boolean;
  active_connections: number;
  max_connections: number;
  long_running_queries: number;
  database_bytes: number;
  slow_queries: SlowQueryRow[];
  checked_at: string;
  error?: string;
}

const FALLBACK: DatabaseHealthSnapshot = {
  ok: false,
  active_connections: 0,
  max_connections: 0,
  long_running_queries: 0,
  database_bytes: 0,
  slow_queries: [],
  checked_at: new Date(0).toISOString(),
};

export const getDatabaseHealth = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<DatabaseHealthSnapshot> => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    try {
      const { data, error } = await supabaseAdmin.rpc("ops_db_health" as never);
      if (error) return { ...FALLBACK, error: error.message };
      return {
        ...FALLBACK,
        ...(data as unknown as Partial<DatabaseHealthSnapshot>),
        slow_queries: Array.isArray((data as { slow_queries?: unknown } | null)?.slow_queries)
          ? (data as unknown as DatabaseHealthSnapshot).slow_queries
          : [],
      };
    } catch (e) {
      return { ...FALLBACK, error: (e as Error).message };
    }
  });
