// Daily churn lifecycle cron.
// Triggered by pg_cron via /api/public/hooks/lifecycle-cron.
//
// Responsibilities:
//   1. Plan A — scan bd_member_seed where migration_status='blocked' AND
//      bd_next_due_date is within 14 days; mint renewal token + email
//      ("card_needed") if user has a claimed auth account.
//   2. Promote dunning rows: at_risk → grace → lapsed (based on time since
//      entering the stage). Send the right email at each step.
//   3. Send winback to lapsed users monthly for 3 months, then dormant.
import { createFileRoute } from "@tanstack/react-router";

const GRACE_DAYS = 14;          // active → grace duration before lapse
const LAPSE_TO_DORMANT_DAYS = 90;
const WINBACK_INTERVAL_DAYS = 30;
const PLAN_A_LOOKAHEAD_DAYS = 14;

type CronResult = {
  plan_a: { scanned: number; emailed: number; skipped: number };
  at_risk_first_nudge: { scanned: number; emailed: number; skipped: number };
  dunning_progressed: number;
  lapsed: number;
  winback_sent: number;
  dormant: number;
  errors: string[];
};


export const Route = createFileRoute("/api/public/hooks/lifecycle-cron")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        // Auth — accept the canonical pg_cron `apikey: <anon>` pattern as
        // well as CRON_SECRET / service-role for manual / legacy callers.
        const cronSecret = process.env.CRON_SECRET;
        const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
        const anonKey =
          process.env.SUPABASE_ANON_KEY ?? process.env.SUPABASE_PUBLISHABLE_KEY;
        const presented =
          request.headers.get("x-cron-secret") ??
          request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ??
          request.headers.get("apikey");
        const accepted =
          (!!cronSecret && presented === cronSecret) ||
          (!!serviceRoleKey && presented === serviceRoleKey) ||
          (!!anonKey && presented === anonKey);
        if (!accepted) {
          return new Response(JSON.stringify({ error: "unauthorized" }), {
            status: 401, headers: { "Content-Type": "application/json" },
          });
        }


        const result = await runLifecycleBatch();
        return new Response(JSON.stringify(result), {
          headers: { "Content-Type": "application/json" },
        });
      },
    },
  },
});

async function runLifecycleBatch(): Promise<CronResult> {
  const result: CronResult = {
    plan_a: { scanned: 0, emailed: 0, skipped: 0 },
    at_risk_first_nudge: { scanned: 0, emailed: 0, skipped: 0 },
    dunning_progressed: 0,
    lapsed: 0,
    winback_sent: 0,
    dormant: 0,
    errors: [],
  };


  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { mintAndEmailRenewalToken } = await import("@/lib/churn/lifecycle.functions");

  // ---- 1. Plan A: BD blocked + due soon -------------------------
  try {
    const cutoff = new Date(Date.now() + PLAN_A_LOOKAHEAD_DAYS * 86400000)
      .toISOString().slice(0, 10);
    const { data: blocked, error } = await supabaseAdmin
      .from("bd_member_seed")
      .select("bd_member_id, email, first_name, claimed_user_id, bd_next_due_date, migration_status")
      .eq("migration_status", "blocked")
      .lte("bd_next_due_date", cutoff)
      .is("migration_stripe_customer_id", null);
    if (error) throw error;
    for (const row of (blocked ?? []) as Array<{
      bd_member_id: number; email: string | null; first_name: string | null;
      claimed_user_id: string | null; bd_next_due_date: string | null;
    }>) {
      result.plan_a.scanned += 1;
      if (!row.claimed_user_id || !row.email) {
        result.plan_a.skipped += 1;
        continue;
      }
      // Throttle: skip if we've nudged in last 5 days
      const { data: existing } = await supabaseAdmin
        .from("churn_lifecycle").select("last_nudge_at, stage")
        .eq("user_id", row.claimed_user_id).maybeSingle();
      if (existing?.last_nudge_at) {
        const ageMs = Date.now() - new Date(existing.last_nudge_at as string).getTime();
        if (ageMs < 5 * 86400000) { result.plan_a.skipped += 1; continue; }
      }
      await supabaseAdmin.rpc("enter_churn_stage" as never, {
        _user_id: row.claimed_user_id, _stage: "at_risk",
        _reason: "BD anniversary approaching — no Stripe customer",
        _source_event: "plan_a_cron",
        _metadata: { bd_member_id: row.bd_member_id, due: row.bd_next_due_date },
      } as never);
      try {
        await mintAndEmailRenewalToken({
          userId: row.claimed_user_id,
          email: row.email,
          purpose: "card_needed",
          templateName: "renewal-card-needed",
          intendedTier: "verified",
          templateData: {
            proName: row.first_name ?? "there",
            renewalDate: row.bd_next_due_date
              ? new Date(row.bd_next_due_date).toLocaleDateString("en-GB", {
                  day: "numeric", month: "long", year: "numeric",
                })
              : "soon",
            amount: "£99",
          },
        });
        result.plan_a.emailed += 1;
      } catch (e) {
        result.errors.push(`plan_a ${row.bd_member_id}: ${e instanceof Error ? e.message : String(e)}`);
      }
    }
  } catch (e) {
    result.errors.push(`plan_a scan: ${e instanceof Error ? e.message : String(e)}`);
  }

  // ---- 1b. First-nudge for Stripe-failed at_risk members ---------
  // Covers any at_risk row with nudge_count = 0 that didn't receive an
  // email synchronously from the Stripe webhook (e.g. webhook send error,
  // or member promoted via subscription.updated without a recovery email).
  // Idempotent: mintAndEmailRenewalToken uses a day-bucketed key, so a
  // second run on the same UTC day collapses to one send.
  try {
    const { data: pending } = await supabaseAdmin
      .from("churn_lifecycle")
      .select("user_id, entered_at, source_event, nudge_count, last_nudge_at")
      .eq("stage", "at_risk")
      .eq("nudge_count", 0)
      .is("last_nudge_at", null);
    for (const r of (pending ?? []) as Array<{
      user_id: string; entered_at: string; source_event: string | null;
      nudge_count: number; last_nudge_at: string | null;
    }>) {
      result.at_risk_first_nudge.scanned += 1;
      // Skip the BD blocked path — already handled by Plan A above with
      // a different template ("card_needed") and its own throttle.
      if (r.source_event === "plan_a_cron") {
        result.at_risk_first_nudge.skipped += 1;
        continue;
      }
      try {
        const { data: authUser } = await supabaseAdmin.auth.admin.getUserById(r.user_id);
        const email = authUser?.user?.email ?? null;
        if (!email) {
          result.at_risk_first_nudge.skipped += 1;
          continue;
        }
        const { data: profile } = await supabaseAdmin
          .from("profiles").select("full_name").eq("id", r.user_id).maybeSingle();
        const { data: sub } = await supabaseAdmin
          .from("subscriptions")
          .select("tier, billing_period, status")
          .eq("user_id", r.user_id).maybeSingle();
        // Derive failed amount from the most recent payment_failed event.
        const { data: ev } = await supabaseAdmin
          .from("payment_events")
          .select("payload, event_type, created_at")
          .eq("user_id", r.user_id)
          .in("event_type", ["invoice.payment_failed"])
          .order("created_at", { ascending: false })
          .limit(1).maybeSingle();
        const evPayload = (ev as { payload?: { amount_due?: number; data?: { object?: { amount_due?: number } } } } | null)?.payload;
        const evAmt = evPayload?.amount_due ?? evPayload?.data?.object?.amount_due ?? 0;
        let amountStr = "";
        if (evAmt > 0) {
          const v = evAmt / 100;
          amountStr = `£${v.toFixed(v % 1 === 0 ? 0 : 2)}`;
        } else {
          // Fallback: derive from plan; tier=free / unknown → omit currency.
          const tier = (sub as { tier?: string } | null)?.tier;
          if (tier === "pro") amountStr = "£59";
          else if (tier === "verified") amountStr = "£99";
          else amountStr = "your last invoice amount";
        }
        const intendedTier = (sub as { tier?: string } | null)?.tier === "pro" ? "pro" : "verified";
        const graceEnd = new Date(
          new Date(r.entered_at).getTime() + GRACE_DAYS * 86400000,
        );
        await mintAndEmailRenewalToken({
          userId: r.user_id, email, purpose: "payment_failed",
          templateName: "renewal-payment-failed",
          intendedTier,
          templateData: {
            proName: (profile as { full_name?: string | null } | null)?.full_name?.split(" ")[0] ?? "there",
            amount: amountStr,
            graceEndDate: graceEnd.toLocaleDateString("en-GB", {
              day: "numeric", month: "long", year: "numeric",
            }),
          },
        });
        result.at_risk_first_nudge.emailed += 1;
      } catch (e) {
        result.errors.push(`at_risk_first_nudge ${r.user_id}: ${e instanceof Error ? e.message : String(e)}`);
      }
    }
  } catch (e) {
    result.errors.push(`at_risk_first_nudge scan: ${e instanceof Error ? e.message : String(e)}`);
  }


  // ---- 2. Dunning progression: at_risk → grace → lapsed ----------
  try {
    const { data: rows } = await supabaseAdmin
      .from("churn_lifecycle")
      .select("user_id, stage, entered_at, nudge_count, last_nudge_at, source_event")
      .in("stage", ["at_risk", "grace"]);
    for (const r of (rows ?? []) as Array<{
      user_id: string; stage: "at_risk" | "grace";
      entered_at: string; nudge_count: number; last_nudge_at: string | null;
      source_event: string | null;
    }>) {
      const ageDays = (Date.now() - new Date(r.entered_at).getTime()) / 86400000;
      if (r.stage === "at_risk" && ageDays >= GRACE_DAYS) {
        await supabaseAdmin.rpc("enter_churn_stage" as never, {
          _user_id: r.user_id, _stage: "grace",
          _reason: "Auto-promoted from at_risk after grace window",
          _source_event: "lifecycle_cron",
        } as never);
        result.dunning_progressed += 1;
      } else if (r.stage === "grace" && ageDays >= GRACE_DAYS) {
        await supabaseAdmin.rpc("enter_churn_stage" as never, {
          _user_id: r.user_id, _stage: "lapsed",
          _reason: "Grace window ended without renewal",
          _source_event: "lifecycle_cron",
        } as never);
        result.lapsed += 1;
      }
    }
  } catch (e) {
    result.errors.push(`dunning: ${e instanceof Error ? e.message : String(e)}`);
  }

  // ---- 3. Winback for lapsed (monthly, up to 3 times) ------------
  try {
    const { data: lapsed } = await supabaseAdmin
      .from("churn_lifecycle")
      .select("user_id, entered_at, nudge_count, last_nudge_at")
      .eq("stage", "lapsed");
    for (const r of (lapsed ?? []) as Array<{
      user_id: string; entered_at: string; nudge_count: number; last_nudge_at: string | null;
    }>) {
      const ageDays = (Date.now() - new Date(r.entered_at).getTime()) / 86400000;
      if (ageDays >= LAPSE_TO_DORMANT_DAYS || r.nudge_count >= 3) {
        await supabaseAdmin.rpc("enter_churn_stage" as never, {
          _user_id: r.user_id, _stage: "dormant",
          _reason: "Winback exhausted",
          _source_event: "lifecycle_cron",
        } as never);
        result.dormant += 1;
        continue;
      }
      if (r.last_nudge_at) {
        const sinceMs = Date.now() - new Date(r.last_nudge_at).getTime();
        if (sinceMs < WINBACK_INTERVAL_DAYS * 86400000) continue;
      }
      const { data: authUser } = await supabaseAdmin.auth.admin.getUserById(r.user_id);
      const email = authUser?.user?.email ?? null;
      const { data: profile } = await supabaseAdmin
        .from("profiles").select("full_name").eq("id", r.user_id).maybeSingle();
      if (!email) continue;
      try {
        await mintAndEmailRenewalToken({
          userId: r.user_id, email, purpose: "reactivate",
          templateName: "winback-lapsed",
          intendedTier: "verified",
          templateData: { proName: (profile as { full_name?: string | null } | null)?.full_name?.split(" ")[0] ?? "there" },
        });
        result.winback_sent += 1;
      } catch (e) {
        result.errors.push(`winback ${r.user_id}: ${e instanceof Error ? e.message : String(e)}`);
      }
    }
  } catch (e) {
    result.errors.push(`winback: ${e instanceof Error ? e.message : String(e)}`);
  }

  return result;
}
