import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type BdSeedStats = {
  total: number;
  seeded: number;
  remaining: number;
};

export type BdSeedBatchResult = {
  attempted: number;
  inserted: number;
  failed: { bd_member_id: number; email: string; error: string }[];
  stats: BdSeedStats;
};

async function loadStats(): Promise<BdSeedStats> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const [{ count: total }, { count: seeded }] = await Promise.all([
    supabaseAdmin.from("bd_member_seed").select("*", { count: "exact", head: true }),
    supabaseAdmin
      .from("bd_migration")
      .select("*", { count: "exact", head: true })
      .eq("status", "seeded"),
  ]);
  const t = total ?? 0;
  const s = seeded ?? 0;
  return { total: t, seeded: s, remaining: Math.max(0, t - s) };
}

async function assertAdmin(context: { supabase: any; userId: string }) {
  const { data: isAdmin } = await context.supabase.rpc("has_role", {
    _user_id: context.userId,
    _role: "admin",
  });
  if (!isAdmin) throw new Response("Forbidden", { status: 403 });
}

export const getBdSeedStats = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<BdSeedStats> => {
    await assertAdmin(context);
    return loadStats();
  });

export const seedBdDirectory = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { limit?: number; dryRun?: boolean }) => ({
    limit: Math.min(Math.max(input?.limit ?? 25, 1), 500),
    dryRun: Boolean(input?.dryRun),
  }))
  .handler(async ({ data, context }): Promise<BdSeedBatchResult> => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // Pick rows that don't yet have a bd_migration row with status='seeded'
    const { data: seededRows } = await supabaseAdmin
      .from("bd_migration")
      .select("bd_member_id")
      .eq("status", "seeded");
    const seededIds = new Set((seededRows ?? []).map((r) => String(r.bd_member_id)));

    const { data: candidates, error: candErr } = await supabaseAdmin
      .from("bd_member_seed")
      .select("bd_member_id,email,first_name,last_name")
      .order("bd_member_id", { ascending: true });
    if (candErr) throw new Response(candErr.message, { status: 500 });

    const pending = (candidates ?? []).filter(
      (r) => !seededIds.has(String(r.bd_member_id)),
    );
    const batch = pending.slice(0, data.limit);

    const failed: BdSeedBatchResult["failed"] = [];
    let inserted = 0;

    if (data.dryRun) {
      return {
        attempted: batch.length,
        inserted: 0,
        failed: [],
        stats: await loadStats(),
      };
    }

    for (const row of batch) {
      const fullName =
        `${row.first_name ?? ""} ${row.last_name ?? ""}`.trim() ||
        String(row.email).split("@")[0];
      try {
        // Try to find existing auth user by email; create if absent.
        let userId: string | null = null;

        const { data: existing } = await supabaseAdmin
          .from("bd_migration")
          .select("rep_user_id")
          .eq("bd_member_id", String(row.bd_member_id))
          .maybeSingle();
        if (existing?.rep_user_id) {
          userId = existing.rep_user_id;
        }

        if (!userId) {
          const { data: created, error: createErr } =
            await supabaseAdmin.auth.admin.createUser({
              email: String(row.email),
              email_confirm: true,
              user_metadata: {
                signup_kind: "professional",
                full_name: fullName,
              },
            });
          if (createErr || !created?.user) {
            // Email may already exist on auth.users — look it up via profiles fallback
            const { data: page } = await supabaseAdmin.auth.admin.listUsers({
              page: 1,
              perPage: 200,
            });
            const found = page?.users.find(
              (u) => (u.email ?? "").toLowerCase() === String(row.email).toLowerCase(),
            );
            if (!found) {
              throw new Error(createErr?.message ?? "createUser failed");
            }
            userId = found.id;
          } else {
            userId = created.user.id;
          }
        }

        const { error: rpcErr } = await supabaseAdmin.rpc(
          "seed_bd_member_into_directory",
          { _bd_member_id: row.bd_member_id, _user_id: userId! },
        );
        if (rpcErr) throw new Error(rpcErr.message);

        inserted += 1;
      } catch (e) {
        failed.push({
          bd_member_id: Number(row.bd_member_id),
          email: String(row.email),
          error: e instanceof Error ? e.message : String(e),
        });
      }
    }

    return {
      attempted: batch.length,
      inserted,
      failed,
      stats: await loadStats(),
    };
  });
