// Renewal Engine — operator visibility for the nightly auto-renewal cron.
// Read-only. Powers the "Renewal engine — last 7 nights" card on /admin/billing.
//
// NO engine logic lives here. We just read what already happened so the operator
// stops having to ask whether the cron worked.

import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

async function assertAdmin(ctx: { supabase: unknown; userId: string }) {
  const supa = ctx.supabase as { rpc: (n: string, p: object) => Promise<{ data: unknown }> };
  const { data } = await supa.rpc("has_role", { _user_id: ctx.userId, _role: "admin" });
  if (!data) throw new Error("Forbidden");
}

export type CronRun = {
  jobname: string;
  status: string;
  return_message: string | null;
  start_time: string;
};

export type RenewalAttempt = {
  bd_member_id: number;
  email: string;
  status: string;
  notes: string | null;
  last_attempt_at: string;
  stripe_subscription_id: string | null;
};

export type UpcomingDue = {
  bd_member_id: number;
  email: string;
  name: string | null;
  due_date: string;
  amount_pence: number;
  source: "legacy_link" | "bd_seed";
};

export type RenewalEngineStatus = {
  generated_at: string;
  cron: {
    legacy_last: CronRun | null;
    lifecycle_last: CronRun | null;
    history: CronRun[]; // last 14 entries across both
  };
  attempts_last_7d: RenewalAttempt[];
  upcoming_14d: UpcomingDue[];
};

const VERIFIED_PRICE_PENCE = 9900;

export const getRenewalEngineStatus = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<RenewalEngineStatus> => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const now = new Date();
    const since7d = new Date(now.getTime() - 7 * 86400_000).toISOString();
    const until14d = new Date(now.getTime() + 14 * 86400_000).toISOString();
    const todayIso = now.toISOString();

    // --- Cron history ------------------------------------------------------
    const { data: cronRows } = (await supabaseAdmin.rpc(
      "get_renewal_cron_runs" as never,
      { _limit: 14 } as never,
    )) as { data: CronRun[] | null };
    const history = cronRows ?? [];
    const legacy_last =
      history.find((r) => r.jobname === "legacy-stripe-renewal-daily") ?? null;
    const lifecycle_last =
      history.find((r) => r.jobname === "churn-lifecycle-daily") ?? null;

    // --- Recent renewal attempts (last 7d) --------------------------------
    const { data: attemptsRaw } = await supabaseAdmin
      .from("legacy_stripe_link")
      .select(
        "bd_member_id,email,migration_status,notes,last_attempt_at,stripe_subscription_id",
      )
      .gte("last_attempt_at", since7d)
      .order("last_attempt_at", { ascending: false })
      .limit(200);
    const attempts_last_7d: RenewalAttempt[] = (attemptsRaw ?? []).map((r) => ({
      bd_member_id: Number(r.bd_member_id),
      email: String(r.email ?? ""),
      status: String(r.migration_status ?? ""),
      notes: (r.notes as string | null) ?? null,
      last_attempt_at: String(r.last_attempt_at),
      stripe_subscription_id: (r.stripe_subscription_id as string | null) ?? null,
    }));

    // --- Upcoming 14 days (legacy_link side) ------------------------------
    const { data: legacyDue } = await supabaseAdmin
      .from("legacy_stripe_link")
      .select(
        "bd_member_id,email,next_due_at,migration_status,bd_member_seed!inner(first_name,last_name,bd_next_due_date,migration_cohort_override)",
      )
      .eq("is_lifetime", false)
      .lte("next_due_at", until14d)
      .gte("next_due_at", todayIso)
      .order("next_due_at", { ascending: true })
      .limit(50);

    const upcoming_14d: UpcomingDue[] = (legacyDue ?? []).map((r) => {
      const seed = r.bd_member_seed as {
        first_name?: string | null;
        last_name?: string | null;
      } | null;
      const name = seed
        ? [seed.first_name, seed.last_name].filter(Boolean).join(" ") || null
        : null;
      return {
        bd_member_id: Number(r.bd_member_id),
        email: String(r.email ?? ""),
        name,
        due_date: String(r.next_due_at),
        amount_pence: VERIFIED_PRICE_PENCE,
        source: "legacy_link" as const,
      };
    });

    return {
      generated_at: now.toISOString(),
      cron: { legacy_last, lifecycle_last, history },
      attempts_last_7d,
      upcoming_14d,
    };
  });
