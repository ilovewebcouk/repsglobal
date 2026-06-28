// Production Operations — Billing + Customer health + Alerts.
//
// All server functions are admin-only and READ-ONLY against existing tables.
// No business logic lives here — this is an operational read surface.

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

// ---- Auth helper -----------------------------------------------------------
async function assertAdmin(ctx: { supabase: unknown; userId: string }) {
  const supa = ctx.supabase as { rpc: (n: string, p: object) => Promise<{ data: unknown }> };
  const { data } = await supa.rpc("has_role", { _user_id: ctx.userId, _role: "admin" });
  if (!data) throw new Error("Forbidden");
}

// =============================================================================
// BILLING HEALTH
// =============================================================================

export interface BillingHealthSnapshot {
  payments_today: number;
  revenue_today_pence: number;
  refunds_today: number;
  refund_amount_today_pence: number;
  failed_payments_active: number;
  recoveries_30d: number;
  in_recovery: number;
  webhook_failures_7d: number;
  dlq_size: number;
  stuck_processing: number;
  avg_webhook_latency_ms: number | null;
}

export const getBillingHealth = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<BillingHealthSnapshot> => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const startOfDay = new Date();
    startOfDay.setUTCHours(0, 0, 0, 0);
    const startIso = startOfDay.toISOString();
    const start7dIso = new Date(Date.now() - 7 * 86400_000).toISOString();
    const start30dIso = new Date(Date.now() - 30 * 86400_000).toISOString();

    const [paidToday, refundsToday, failedActive, recovered30d, inRecovery, webhookFails, dlq, stuck, latency] =
      await Promise.all([
        supabaseAdmin.from("payment_events").select("payload, created_at", { count: "exact" })
          .eq("event_type", "invoice.paid").gte("created_at", startIso),
        supabaseAdmin.from("payment_events").select("payload", { count: "exact" })
          .eq("event_type", "charge.refunded").gte("created_at", startIso),
        supabaseAdmin.from("subscriptions").select("user_id", { count: "exact", head: true })
          .eq("environment", "live").in("status", ["past_due", "unpaid", "incomplete"]),
        supabaseAdmin.from("churn_lifecycle").select("user_id", { count: "exact", head: true })
          .eq("stage", "recovered").gte("entered_at", start30dIso),
        supabaseAdmin.from("churn_lifecycle").select("user_id", { count: "exact", head: true })
          .in("stage", ["grace", "at_risk"]),
        supabaseAdmin.from("payment_events").select("id", { count: "exact", head: true })
          .gte("created_at", start7dIso).not("processing_error", "is", null),
        supabaseAdmin.from("payment_events").select("id", { count: "exact", head: true })
          .not("dead_lettered_at", "is", null).is("processed_at", null),
        supabaseAdmin.from("payment_events").select("id", { count: "exact", head: true })
          .is("processed_at", null).is("dead_lettered_at", null)
          .lt("created_at", new Date(Date.now() - 15 * 60_000).toISOString()),
        supabaseAdmin.from("payment_events")
          .select("created_at, processed_at")
          .not("processed_at", "is", null)
          .gte("created_at", new Date(Date.now() - 86400_000).toISOString())
          .limit(500),
      ]);

    // sum revenue paid today (Stripe invoice payload: data.object.amount_paid)
    let revenue = 0;
    for (const r of (paidToday.data ?? []) as Array<{ payload: Record<string, unknown> }>) {
      const obj = (r.payload as { data?: { object?: { amount_paid?: number } } })?.data?.object;
      if (obj && typeof obj.amount_paid === "number") revenue += obj.amount_paid;
    }

    let refundAmt = 0;
    for (const r of (refundsToday.data ?? []) as Array<{ payload: Record<string, unknown> }>) {
      const obj = (r.payload as { data?: { object?: { amount_refunded?: number; amount?: number } } })?.data?.object;
      if (obj) refundAmt += obj.amount_refunded ?? obj.amount ?? 0;
    }

    // Mean webhook latency from sampled rows
    const samples = (latency.data ?? []) as Array<{ created_at: string; processed_at: string }>;
    let latencyMs: number | null = null;
    if (samples.length > 0) {
      const total = samples.reduce(
        (acc, s) => acc + (new Date(s.processed_at).getTime() - new Date(s.created_at).getTime()),
        0,
      );
      latencyMs = Math.round(total / samples.length);
    }

    return {
      payments_today: paidToday.count ?? 0,
      revenue_today_pence: revenue,
      refunds_today: refundsToday.count ?? 0,
      refund_amount_today_pence: refundAmt,
      failed_payments_active: failedActive.count ?? 0,
      recoveries_30d: recovered30d.count ?? 0,
      in_recovery: inRecovery.count ?? 0,
      webhook_failures_7d: webhookFails.count ?? 0,
      dlq_size: dlq.count ?? 0,
      stuck_processing: stuck.count ?? 0,
      avg_webhook_latency_ms: latencyMs,
    };
  });

// Drill-down lists ------------------------------------------------------------

const drillSchema = z.object({
  kind: z.enum([
    "payments_today",
    "refunds_today",
    "failed_active",
    "in_recovery",
    "recoveries_30d",
    "webhook_failures_7d",
    "dlq",
    "stuck",
  ]),
  limit: z.number().int().min(1).max(500).default(100),
});

export interface BillingDrillRow {
  id: string;
  user_id: string | null;
  created_at: string;
  event_type?: string | null;
  status?: string | null;
  amount_pence?: number | null;
  error?: string | null;
  stripe_customer_id?: string | null;
  stripe_subscription_id?: string | null;
  stage?: string | null;
}

export const getBillingDrill = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => drillSchema.parse(d))
  .handler(async ({ data, context }): Promise<BillingDrillRow[]> => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const startOfDay = new Date();
    startOfDay.setUTCHours(0, 0, 0, 0);
    const startIso = startOfDay.toISOString();

    if (data.kind === "payments_today" || data.kind === "refunds_today") {
      const evType = data.kind === "payments_today" ? "invoice.paid" : "charge.refunded";
      const { data: rows } = await supabaseAdmin
        .from("payment_events")
        .select("id, user_id, created_at, event_type, payload, stripe_customer_id, stripe_subscription_id")
        .eq("event_type", evType)
        .gte("created_at", startIso)
        .order("created_at", { ascending: false })
        .limit(data.limit);
      return ((rows ?? []) as Array<{
        id: string; user_id: string | null; created_at: string; event_type: string;
        payload: Record<string, unknown>;
        stripe_customer_id: string | null; stripe_subscription_id: string | null;
      }>).map((r) => {
        const obj = (r.payload as { data?: { object?: { amount_paid?: number; amount_refunded?: number; amount?: number } } })
          ?.data?.object;
        const amt = obj?.amount_paid ?? obj?.amount_refunded ?? obj?.amount ?? null;
        return {
          id: r.id,
          user_id: r.user_id,
          created_at: r.created_at,
          event_type: r.event_type,
          amount_pence: amt,
          stripe_customer_id: r.stripe_customer_id,
          stripe_subscription_id: r.stripe_subscription_id,
        };
      });
    }

    if (data.kind === "webhook_failures_7d" || data.kind === "dlq" || data.kind === "stuck") {
      let q = supabaseAdmin
        .from("payment_events")
        .select("id, user_id, created_at, event_type, processing_error, dead_lettered_at, processed_at, stripe_customer_id, stripe_subscription_id")
        .order("created_at", { ascending: false })
        .limit(data.limit);
      if (data.kind === "webhook_failures_7d") {
        q = q.gte("created_at", new Date(Date.now() - 7 * 86400_000).toISOString()).not("processing_error", "is", null);
      } else if (data.kind === "dlq") {
        q = q.not("dead_lettered_at", "is", null).is("processed_at", null);
      } else {
        q = q.is("processed_at", null).is("dead_lettered_at", null)
          .lt("created_at", new Date(Date.now() - 15 * 60_000).toISOString());
      }
      const { data: rows } = await q;
      return ((rows ?? []) as Array<{
        id: string; user_id: string | null; created_at: string; event_type: string;
        processing_error: string | null; dead_lettered_at: string | null; processed_at: string | null;
        stripe_customer_id: string | null; stripe_subscription_id: string | null;
      }>).map((r) => ({
        id: r.id,
        user_id: r.user_id,
        created_at: r.created_at,
        event_type: r.event_type,
        error: r.processing_error,
        status: r.dead_lettered_at ? "dead_lettered" : r.processed_at ? "processed" : "pending",
        stripe_customer_id: r.stripe_customer_id,
        stripe_subscription_id: r.stripe_subscription_id,
      }));
    }

    if (data.kind === "failed_active") {
      const { data: rows } = await supabaseAdmin
        .from("subscriptions")
        .select("id, user_id, updated_at, status, tier, stripe_customer_id, stripe_subscription_id")
        .eq("environment", "live")
        .in("status", ["past_due", "unpaid", "incomplete"])
        .order("updated_at", { ascending: false })
        .limit(data.limit);
      return ((rows ?? []) as Array<{
        id: string; user_id: string; updated_at: string; status: string; tier: string;
        stripe_customer_id: string | null; stripe_subscription_id: string | null;
      }>).map((r) => ({
        id: r.id,
        user_id: r.user_id,
        created_at: r.updated_at,
        status: r.status,
        event_type: r.tier,
        stripe_customer_id: r.stripe_customer_id,
        stripe_subscription_id: r.stripe_subscription_id,
      }));
    }

    if (data.kind === "in_recovery" || data.kind === "recoveries_30d") {
      let q = supabaseAdmin.from("churn_lifecycle")
        .select("id, user_id, stage, entered_at")
        .order("entered_at", { ascending: false }).limit(data.limit);
      if (data.kind === "in_recovery") q = q.in("stage", ["grace", "at_risk"]);
      else q = q.eq("stage", "recovered").gte("entered_at", new Date(Date.now() - 30 * 86400_000).toISOString());
      const { data: rows } = await q;
      return ((rows ?? []) as Array<{ id: string; user_id: string; stage: string; entered_at: string }>).map((r) => ({
        id: r.id, user_id: r.user_id, created_at: r.entered_at, stage: r.stage,
      }));
    }

    return [];
  });

// =============================================================================
// CUSTOMER HEALTH
// =============================================================================

export interface CustomerHealthSnapshot {
  active_paying: number;
  new_core_7d: number;
  new_pro_7d: number;
  new_studio_7d: number;
  churn_7d: number;
  recoveries_7d: number;
  pending_cancellations: number;
  failed_renewals: number;
  awaiting_payment_update: number;
}

export const getCustomerHealth = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<CustomerHealthSnapshot> => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const start7dIso = new Date(Date.now() - 7 * 86400_000).toISOString();
    const nowIso = new Date().toISOString();

    const [
      newCore, newPro, newStudio,
      churnCount, recoveryCount,
      pendingCancel, failedRenew, awaitingUpdate,
    ] = await Promise.all([
      supabaseAdmin.from("subscriptions").select("id", { count: "exact", head: true })
        .eq("tier", "verified").eq("environment", "live").gte("created_at", start7dIso),
      supabaseAdmin.from("subscriptions").select("id", { count: "exact", head: true })
        .eq("tier", "pro").eq("environment", "live").gte("created_at", start7dIso),
      supabaseAdmin.from("subscriptions").select("id", { count: "exact", head: true })
        .eq("tier", "studio").eq("environment", "live").gte("created_at", start7dIso),
      supabaseAdmin.from("subscriptions").select("id", { count: "exact", head: true })
        .eq("environment", "live").eq("status", "canceled").gte("updated_at", start7dIso),
      supabaseAdmin.from("churn_lifecycle").select("id", { count: "exact", head: true })
        .eq("stage", "recovered").gte("entered_at", start7dIso),
      supabaseAdmin.from("subscriptions").select("id", { count: "exact", head: true })
        .eq("environment", "live").eq("cancel_at_period_end", true),
      supabaseAdmin.from("subscriptions").select("id", { count: "exact", head: true })
        .eq("environment", "live").in("status", ["past_due", "unpaid"]),
      supabaseAdmin.from("renewal_tokens").select("id", { count: "exact", head: true })
        .eq("purpose", "card_needed").is("consumed_at", null).gt("expires_at", nowIso),
    ]);

    // active paying — reuse canonical model via overview RPC if available.
    // Cheap proxy: live + active/trialing distinct user_ids.
    const { count: activeCount } = await supabaseAdmin
      .from("subscriptions")
      .select("user_id", { count: "exact", head: true })
      .eq("environment", "live")
      .in("status", ["active", "trialing"]);

    return {
      active_paying: activeCount ?? 0,
      new_core_7d: newCore.count ?? 0,
      new_pro_7d: newPro.count ?? 0,
      new_studio_7d: newStudio.count ?? 0,
      churn_7d: churnCount.count ?? 0,
      recoveries_7d: recoveryCount.count ?? 0,
      pending_cancellations: pendingCancel.count ?? 0,
      failed_renewals: failedRenew.count ?? 0,
      awaiting_payment_update: awaitingUpdate.count ?? 0,
    };
  });

// =============================================================================
// ALERTS
// =============================================================================

export interface OpsAlert {
  id: string;
  kind: string;
  severity: "info" | "warn" | "crit";
  opened_at: string;
  resolved_at: string | null;
  context: Record<string, unknown>;
  ack_by: string | null;
  ack_at: string | null;
}

export const getOpenAlerts = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<OpsAlert[]> => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data } = await supabaseAdmin
      .from("ops_alerts")
      .select("*")
      .is("resolved_at", null)
      .order("opened_at", { ascending: false });
    return (data ?? []) as OpsAlert[];
  });

export const getRecentAlerts = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<OpsAlert[]> => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const since = new Date(Date.now() - 7 * 86400_000).toISOString();
    const { data } = await supabaseAdmin
      .from("ops_alerts")
      .select("*")
      .gte("opened_at", since)
      .order("opened_at", { ascending: false })
      .limit(200);
    return (data ?? []) as OpsAlert[];
  });

export const ackAlert = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ alert_id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("ops_alerts")
      .update({ ack_by: context.userId, ack_at: new Date().toISOString() })
      .eq("id", data.alert_id);
    if (error) throw new Error(error.message);
    return { ok: true as const };
  });

export const runAlertEvaluator = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<{ opened: number }> => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin.rpc("ops_alerts_evaluate" as never);
    if (error) throw new Error(error.message);
    return { opened: Number(data ?? 0) };
  });
