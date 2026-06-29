// Billing Console — server fns for /admin/billing.
// One file, four list endpoints + KPI strip. Reuses the shared member-billing-row
// resolver so renewal/trial/cancel pills can't drift from Member 360.

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { FAILED_PAYMENT_STATUSES } from "@/lib/admin/metrics-definitions";
import { computeMemberBillingRow, type SubscriptionRowLite, type MemberBillingPlan } from "@/lib/admin/member-billing-row.server";

async function requireAdmin(supabase: any, userId: string) {
  const { data, error } = await supabase.rpc("has_role", { _user_id: userId, _role: "admin" });
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Forbidden");
}

/**
 * Resolve Stripe customer IDs to REPs user IDs via the local subscriptions
 * mirror. Used by Payments / Disputes / Refunds to fill in "Unknown" rows
 * where the webhook event arrived without a linked user_id but we hold the
 * customer id.
 */
async function resolveUsersByCustomerIds(
  supabase: any,
  customerIds: string[],
): Promise<Map<string, string>> {
  const out = new Map<string, string>();
  const ids = Array.from(new Set(customerIds.filter(Boolean)));
  if (!ids.length) return out;
  const { data } = await supabase
    .from("subscriptions")
    .select("user_id, stripe_customer_id")
    .in("stripe_customer_id", ids)
    .eq("environment", "live");
  for (const r of (data ?? []) as Array<{ user_id: string; stripe_customer_id: string | null }>) {
    if (r.stripe_customer_id && r.user_id && !out.has(r.stripe_customer_id)) {
      out.set(r.stripe_customer_id, r.user_id);
    }
  }
  return out;
}

// ---------------------------------------------------------------------------
// KPIs
// ---------------------------------------------------------------------------

export type BillingKpis = {
  mrrPence: number;
  activePaying: number;
  trialing: number;
  pastDue: number;
  openDisputes: number;
  disputedAmountPence: number;
  refunds30dCount: number;
  refunds30dAmountPence: number;
  mirrorAgeSeconds: number | null;
};

function monthlyPence(tier: string, period: string | null): number {
  if (tier === "verified") return Math.round(9900 / 12);
  if (tier === "pro") return 5900;
  if (tier === "studio") return 14900;
  return 0;
}

export const getBillingKpis = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<BillingKpis> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await requireAdmin(supabaseAdmin, context.userId);

    const start30dIso = new Date(Date.now() - 30 * 86_400_000).toISOString();

    const [subsRes, disputesRes, refundsRes, latestSubRes] = await Promise.all([
      supabaseAdmin
        .from("subscriptions")
        .select("user_id, tier, status, billing_period")
        .eq("environment", "live"),
      supabaseAdmin
        .from("disputes")
        .select("amount_pence, lifecycle_stage")
        .in("lifecycle_stage", ["opened", "funds_withdrawn", "funds_reinstated"]),
      supabaseAdmin
        .from("payment_events")
        .select("payload, created_at")
        .eq("event_type", "charge.refunded")
        .gte("created_at", start30dIso),
      supabaseAdmin
        .from("subscriptions")
        .select("updated_at")
        .order("updated_at", { ascending: false })
        .limit(1),
    ]);

    const subs = (subsRes.data ?? []) as Array<{ user_id: string; tier: string; status: string; billing_period: string | null }>;
    const live = subs.filter((s) => (s.status === "active" || s.status === "trialing") && s.tier !== "free");
    const activePaying = subs.filter((s) => s.status === "active" && s.tier !== "free").length;
    const trialing = subs.filter((s) => s.status === "trialing" && s.tier !== "free").length;
    const pastDue = subs.filter((s) => (FAILED_PAYMENT_STATUSES as readonly string[]).includes(s.status)).length;
    let mrr = 0;
    for (const s of live) mrr += monthlyPence(s.tier, s.billing_period);

    const disputes = (disputesRes.data ?? []) as Array<{ amount_pence: number | null }>;
    const openDisputes = disputes.length;
    const disputedAmountPence = disputes.reduce((acc, d) => acc + (d.amount_pence ?? 0), 0);

    const refunds = (refundsRes.data ?? []) as Array<{ payload: any }>;
    let refundAmt = 0;
    for (const r of refunds) {
      const obj = r.payload?.data?.object;
      if (obj) refundAmt += obj.amount_refunded ?? obj.amount ?? 0;
    }

    let mirrorAgeSeconds: number | null = null;
    const latest = (latestSubRes.data ?? [])[0] as { updated_at: string | null } | undefined;
    if (latest?.updated_at) {
      mirrorAgeSeconds = Math.max(0, Math.round((Date.now() - new Date(latest.updated_at).getTime()) / 1000));
    }

    return {
      mrrPence: mrr,
      activePaying,
      trialing,
      pastDue,
      openDisputes,
      disputedAmountPence,
      refunds30dCount: refunds.length,
      refunds30dAmountPence: refundAmt,
      mirrorAgeSeconds,
    };
  });

// ---------------------------------------------------------------------------
// Payments
// ---------------------------------------------------------------------------

export type PaymentRow = {
  id: string;
  createdAt: string;
  userId: string | null;
  email: string | null;
  fullName: string | null;
  amountPence: number;
  currency: string;
  status: "succeeded" | "failed" | "refunded" | "disputed";
  stripeChargeId: string | null;
  stripeCustomerId: string | null;
  stripePaymentIntentId: string | null;
};

const paymentsSchema = z.object({
  status: z.enum(["all", "succeeded", "failed", "refunded", "disputed"]).default("all"),
  rangeDays: z.number().int().min(1).max(365).default(30),
  search: z.string().trim().max(120).optional(),
  limit: z.number().int().min(1).max(500).default(100),
});

export const listPayments = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => paymentsSchema.parse(d))
  .handler(async ({ data, context }): Promise<PaymentRow[]> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await requireAdmin(supabaseAdmin, context.userId);

    const sinceIso = new Date(Date.now() - data.rangeDays * 86_400_000).toISOString();

    // We surface invoice.paid + charge.refunded + charge.failed + charge.dispute.created
    const evTypes: string[] = [];
    if (data.status === "all") {
      evTypes.push("invoice.paid", "charge.refunded", "charge.failed", "charge.dispute.created");
    } else if (data.status === "succeeded") evTypes.push("invoice.paid");
    else if (data.status === "refunded") evTypes.push("charge.refunded");
    else if (data.status === "failed") evTypes.push("charge.failed");
    else if (data.status === "disputed") evTypes.push("charge.dispute.created");

    let query = supabaseAdmin
      .from("payment_events")
      .select("id, created_at, user_id, event_type, payload, stripe_customer_id")
      .in("event_type", evTypes)
      .gte("created_at", sinceIso)
      .order("created_at", { ascending: false })
      .limit(data.limit);

    const { data: rows } = await query;
    const events = (rows ?? []) as Array<{
      id: string;
      created_at: string;
      user_id: string | null;
      event_type: string;
      payload: any;
      stripe_customer_id: string | null;
    }>;

    // Fallback: link customer ids back to users via the subscriptions mirror
    // so dispute/failed events that arrived without user_id still show a name.
    const customerIds = Array.from(
      new Set(events.map((e) => e.stripe_customer_id).filter(Boolean) as string[]),
    );
    const customerToUser = await resolveUsersByCustomerIds(supabaseAdmin, customerIds);
    const allUserIds = new Set<string>([
      ...(events.map((e) => e.user_id).filter(Boolean) as string[]),
      ...Array.from(customerToUser.values()),
    ]);
    const userIds = Array.from(allUserIds);
    let profileMap = new Map<string, { full_name: string | null }>();
    let emailMap = new Map<string, string | null>();
    if (userIds.length) {
      const { data: profs } = await supabaseAdmin.from("profiles").select("id, full_name").in("id", userIds);
      for (const p of (profs ?? []) as Array<{ id: string; full_name: string | null }>) {
        profileMap.set(p.id, { full_name: p.full_name });
      }
      try {
        const { supabaseAdmin: sa } = await import("@/integrations/supabase/client.server");
        // Pull emails in chunks via auth admin listUsers — best-effort
        let page = 1;
        while (page < 30) {
          const { data: ud, error } = await sa.auth.admin.listUsers({ page, perPage: 200 });
          if (error) break;
          for (const u of ud.users) if (userIds.includes(u.id)) emailMap.set(u.id, u.email ?? null);
          if (ud.users.length < 200) break;
          page += 1;
        }
      } catch { /* best-effort */ }
    }

    const out: PaymentRow[] = [];
    for (const e of events) {
      const obj = e.payload?.data?.object ?? {};
      let status: PaymentRow["status"] = "succeeded";
      let amount = 0;
      let currency = "gbp";
      let chargeId: string | null = null;
      let piId: string | null = null;
      if (e.event_type === "invoice.paid") {
        status = "succeeded";
        amount = obj.amount_paid ?? 0;
        currency = obj.currency ?? "gbp";
        chargeId = obj.charge ?? null;
        piId = obj.payment_intent ?? null;
      } else if (e.event_type === "charge.refunded") {
        status = "refunded";
        amount = obj.amount_refunded ?? obj.amount ?? 0;
        currency = obj.currency ?? "gbp";
        chargeId = obj.id ?? null;
        piId = typeof obj.payment_intent === "string" ? obj.payment_intent : null;
      } else if (e.event_type === "charge.failed") {
        status = "failed";
        amount = obj.amount ?? 0;
        currency = obj.currency ?? "gbp";
        chargeId = obj.id ?? null;
        piId = typeof obj.payment_intent === "string" ? obj.payment_intent : null;
      } else if (e.event_type === "charge.dispute.created") {
        status = "disputed";
        amount = obj.amount ?? 0;
        currency = obj.currency ?? "gbp";
        chargeId = typeof obj.charge === "string" ? obj.charge : null;
      }

      const resolvedUserId =
        e.user_id ?? (e.stripe_customer_id ? customerToUser.get(e.stripe_customer_id) ?? null : null);
      const prof = resolvedUserId ? profileMap.get(resolvedUserId) : null;
      const email = resolvedUserId ? emailMap.get(resolvedUserId) ?? null : null;

      // Search filter (client-side over hydrated rows)
      if (data.search) {
        const q = data.search.toLowerCase();
        const hay = `${email ?? ""} ${prof?.full_name ?? ""} ${chargeId ?? ""} ${piId ?? ""} ${e.stripe_customer_id ?? ""}`.toLowerCase();
        if (!hay.includes(q)) continue;
      }

      out.push({
        id: e.id,
        createdAt: e.created_at,
        userId: resolvedUserId,
        email,
        fullName: prof?.full_name ?? null,
        amountPence: amount,
        currency,
        status,
        stripeChargeId: chargeId,
        stripeCustomerId: e.stripe_customer_id,
        stripePaymentIntentId: piId,
      });
    }

    return out;
  });

// ---------------------------------------------------------------------------
// Subscriptions
// ---------------------------------------------------------------------------

export type SubscriptionRow = {
  userId: string;
  email: string | null;
  fullName: string | null;
  plan: MemberBillingPlan;
  billingPeriod: "annual" | "monthly" | null;
  status: string;
  mrrPence: number;
  renewalDate: string | null;
  isTrial: boolean;
  trialDaysLeft: number | null;
  cancelAtPeriodEnd: boolean;
  stripeSubscriptionId: string | null;
  stripeCustomerId: string | null;
};

const subsSchema = z.object({
  view: z
    .enum(["all", "trialing", "active", "past_due", "canceling", "canceled", "verified", "pro", "studio"])
    .default("all"),
  search: z.string().trim().max(120).optional(),
  limit: z.number().int().min(1).max(1000).default(500),
});

export const listSubscriptions = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => subsSchema.parse(d))
  .handler(async ({ data, context }): Promise<SubscriptionRow[]> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await requireAdmin(supabaseAdmin, context.userId);

    const { data: subsRaw } = await supabaseAdmin
      .from("subscriptions")
      .select(
        "user_id, tier, status, current_period_end, billing_period, stripe_subscription_id, stripe_customer_id, cancel_at_period_end, created_at",
      )
      .eq("environment", "live");

    const allSubs = (subsRaw ?? []) as Array<{
      user_id: string;
      tier: string;
      status: string;
      current_period_end: string | null;
      billing_period: "annual" | "monthly" | null;
      stripe_subscription_id: string | null;
      stripe_customer_id: string | null;
      cancel_at_period_end: boolean | null;
      created_at: string;
      
    }>;

    // One row per user — pick the highest-priority sub for display.
    const PRIORITY: Record<string, number> = {
      active: 5,
      trialing: 4,
      past_due: 3,
      unpaid: 3,
      incomplete: 2,
      canceled: 1,
    };
    const byUser = new Map<string, typeof allSubs[number]>();
    for (const s of allSubs) {
      const existing = byUser.get(s.user_id);
      if (!existing || (PRIORITY[s.status] ?? 0) > (PRIORITY[existing.status] ?? 0)) {
        byUser.set(s.user_id, s);
      }
    }

    const userIds = Array.from(byUser.keys());
    const [profsRes, usersRes] = await Promise.all([
      userIds.length
        ? supabaseAdmin.from("profiles").select("id, full_name").in("id", userIds)
        : Promise.resolve({ data: [] as any[] }),
      (async () => {
        const map = new Map<string, string | null>();
        try {
          let page = 1;
          while (page < 30) {
            const { data: ud, error } = await supabaseAdmin.auth.admin.listUsers({ page, perPage: 200 });
            if (error) break;
            for (const u of ud.users) map.set(u.id, u.email ?? null);
            if (ud.users.length < 200) break;
            page += 1;
          }
        } catch { /* best effort */ }
        return map;
      })(),
    ]);
    const profMap = new Map<string, string | null>();
    for (const p of (profsRes.data ?? []) as Array<{ id: string; full_name: string | null }>) {
      profMap.set(p.id, p.full_name);
    }
    const emailMap = usersRes as Map<string, string | null>;

    const out: SubscriptionRow[] = [];
    for (const s of byUser.values()) {
      const lite: SubscriptionRowLite = {
        user_id: s.user_id,
        tier: s.tier as MemberBillingPlan,
        status: s.status as any,
        created_at: s.created_at,
        current_period_end: s.current_period_end,
        billing_period: s.billing_period,
      };
      // Treat any entitled (active/trialing/past_due) sub as the active paid tier
      // so the plan pill resolves to Core/Pro/Studio instead of falling back to Free.
      const entitledTier =
        (s.status === "active" || s.status === "trialing" || s.status === "past_due") &&
        (s.tier === "verified" || s.tier === "pro" || s.tier === "studio")
          ? (s.tier as MemberBillingPlan)
          : null;
      const row = computeMemberBillingRow({ user_id: s.user_id, subs: [lite], bdNextDueIso: null, activePaidTier: entitledTier });

      const email = emailMap.get(s.user_id) ?? null;
      const fullName = profMap.get(s.user_id) ?? null;

      // View filter
      if (data.view === "trialing" && s.status !== "trialing") continue;
      if (data.view === "active" && s.status !== "active") continue;
      if (data.view === "past_due" && !(FAILED_PAYMENT_STATUSES as readonly string[]).includes(s.status)) continue;
      if (data.view === "canceling" && !s.cancel_at_period_end) continue;
      if (data.view === "canceled" && s.status !== "canceled") continue;
      if (data.view === "verified" && s.tier !== "verified") continue;
      if (data.view === "pro" && s.tier !== "pro") continue;
      if (data.view === "studio" && s.tier !== "studio") continue;

      if (data.search) {
        const q = data.search.toLowerCase();
        const hay = `${email ?? ""} ${fullName ?? ""} ${s.stripe_subscription_id ?? ""} ${s.stripe_customer_id ?? ""} ${s.user_id}`.toLowerCase();
        if (!hay.includes(q)) continue;
      }

      out.push({
        userId: s.user_id,
        email,
        fullName,
        plan: row.plan,
        billingPeriod: s.billing_period,
        status: s.status,
        mrrPence: row.planMrrPence,
        renewalDate: row.renewalDate,
        isTrial: row.isTrial,
        trialDaysLeft: row.trialDaysLeft,
        cancelAtPeriodEnd: !!s.cancel_at_period_end,
        stripeSubscriptionId: s.stripe_subscription_id,
        stripeCustomerId: s.stripe_customer_id,
      });

      if (out.length >= data.limit) break;
    }

    // Default order: trialing first, then active, then past_due, then canceled.
    const order: Record<string, number> = { trialing: 0, active: 1, past_due: 2, unpaid: 2, incomplete: 3, canceled: 4 };
    out.sort((a, b) => (order[a.status] ?? 9) - (order[b.status] ?? 9) || (b.mrrPence - a.mrrPence));
    return out;
  });

// ---------------------------------------------------------------------------
// Disputes
// ---------------------------------------------------------------------------

export type DisputeRow = {
  id: string;
  openedAt: string;
  userId: string | null;
  email: string | null;
  fullName: string | null;
  reason: string | null;
  amountPence: number;
  currency: string;
  status: string;
  lifecycleStage: string;
  evidenceDueBy: string | null;
  stripeDisputeId: string | null;
  stripeChargeId: string | null;
};

export const listDisputes = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<DisputeRow[]> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await requireAdmin(supabaseAdmin, context.userId);

    const { data: rows } = await supabaseAdmin
      .from("disputes")
      .select(
        "id, opened_at, user_id, reason, amount_pence, currency, status, lifecycle_stage, evidence_due_by, stripe_dispute_id, stripe_charge_id",
      )
      .order("opened_at", { ascending: false })
      .limit(500);

    const disputes = (rows ?? []) as Array<{
      id: string;
      opened_at: string;
      user_id: string | null;
      reason: string | null;
      amount_pence: number | null;
      currency: string | null;
      status: string;
      lifecycle_stage: string;
      evidence_due_by: string | null;
      stripe_dispute_id: string | null;
      stripe_charge_id: string | null;
    }>;

    const userIds = Array.from(new Set(disputes.map((d) => d.user_id).filter(Boolean) as string[]));
    const profMap = new Map<string, string | null>();
    const emailMap = new Map<string, string | null>();
    if (userIds.length) {
      const { data: profs } = await supabaseAdmin.from("profiles").select("id, full_name").in("id", userIds);
      for (const p of (profs ?? []) as Array<{ id: string; full_name: string | null }>) profMap.set(p.id, p.full_name);
      try {
        let page = 1;
        while (page < 30) {
          const { data: ud, error } = await supabaseAdmin.auth.admin.listUsers({ page, perPage: 200 });
          if (error) break;
          for (const u of ud.users) if (userIds.includes(u.id)) emailMap.set(u.id, u.email ?? null);
          if (ud.users.length < 200) break;
          page += 1;
        }
      } catch { /* best effort */ }
    }

    return disputes.map((d) => ({
      id: d.id,
      openedAt: d.opened_at,
      userId: d.user_id,
      email: d.user_id ? emailMap.get(d.user_id) ?? null : null,
      fullName: d.user_id ? profMap.get(d.user_id) ?? null : null,
      reason: d.reason,
      amountPence: d.amount_pence ?? 0,
      currency: d.currency ?? "gbp",
      status: d.status,
      lifecycleStage: d.lifecycle_stage,
      evidenceDueBy: d.evidence_due_by,
      stripeDisputeId: d.stripe_dispute_id,
      stripeChargeId: d.stripe_charge_id,
    }));
  });

// ---------------------------------------------------------------------------
// Refunds
// ---------------------------------------------------------------------------

export type RefundRow = {
  id: string;
  createdAt: string;
  userId: string | null;
  email: string | null;
  fullName: string | null;
  amountPence: number;
  currency: string;
  reason: string | null;
  stripeChargeId: string | null;
};

const refundsSchema = z.object({
  rangeDays: z.number().int().min(1).max(365).default(90),
  limit: z.number().int().min(1).max(500).default(200),
});

export const listRefunds = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => refundsSchema.parse(d))
  .handler(async ({ data, context }): Promise<RefundRow[]> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await requireAdmin(supabaseAdmin, context.userId);

    const sinceIso = new Date(Date.now() - data.rangeDays * 86_400_000).toISOString();
    const { data: rows } = await supabaseAdmin
      .from("payment_events")
      .select("id, created_at, user_id, payload")
      .eq("event_type", "charge.refunded")
      .gte("created_at", sinceIso)
      .order("created_at", { ascending: false })
      .limit(data.limit);

    const events = (rows ?? []) as Array<{ id: string; created_at: string; user_id: string | null; payload: any }>;

    const userIds = Array.from(new Set(events.map((e) => e.user_id).filter(Boolean) as string[]));
    const profMap = new Map<string, string | null>();
    const emailMap = new Map<string, string | null>();
    if (userIds.length) {
      const { data: profs } = await supabaseAdmin.from("profiles").select("id, full_name").in("id", userIds);
      for (const p of (profs ?? []) as Array<{ id: string; full_name: string | null }>) profMap.set(p.id, p.full_name);
      try {
        let page = 1;
        while (page < 30) {
          const { data: ud, error } = await supabaseAdmin.auth.admin.listUsers({ page, perPage: 200 });
          if (error) break;
          for (const u of ud.users) if (userIds.includes(u.id)) emailMap.set(u.id, u.email ?? null);
          if (ud.users.length < 200) break;
          page += 1;
        }
      } catch { /* best effort */ }
    }

    return events.map((e) => {
      const obj = e.payload?.data?.object ?? {};
      return {
        id: e.id,
        createdAt: e.created_at,
        userId: e.user_id,
        email: e.user_id ? emailMap.get(e.user_id) ?? null : null,
        fullName: e.user_id ? profMap.get(e.user_id) ?? null : null,
        amountPence: obj.amount_refunded ?? obj.amount ?? 0,
        currency: obj.currency ?? "gbp",
        reason: obj.refunds?.data?.[0]?.reason ?? null,
        stripeChargeId: obj.id ?? null,
      };
    });
  });
