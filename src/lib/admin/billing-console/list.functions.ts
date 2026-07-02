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
 * Contact resolution chain for billing rows where the webhook event arrived
 * without a linked user_id. We walk three sources in priority order:
 *   1. `subscriptions` mirror   → live REPs member (preferred, has user_id)
 *   2. `legacy_stripe_link`     → un-migrated BD member (email + bd_member_id)
 *   3. `legacy_stripe_payments` → historic charge → customer/email map
 *      (covers chargebacks on legacy charges whose customer is long-gone)
 * Plus a last-resort extractor that pulls email/name straight off the
 * Stripe event payload (receipt_email, billing_details, dispute evidence).
 */
export type ContactHit = {
  userId: string | null;
  email: string | null;
  fullName: string | null;
  source: "subscription" | "legacy_link" | "legacy_payment" | "payload";
};

async function resolveContactsByCustomerIds(
  supabase: any,
  customerIds: string[],
): Promise<Map<string, ContactHit>> {
  const out = new Map<string, ContactHit>();
  const ids = Array.from(new Set(customerIds.filter(Boolean)));
  if (!ids.length) return out;

  // 1. subscriptions mirror
  const { data: subRows } = await supabase
    .from("subscriptions")
    .select("user_id, stripe_customer_id")
    .in("stripe_customer_id", ids)
    .eq("environment", "live");
  for (const r of (subRows ?? []) as Array<{ user_id: string; stripe_customer_id: string | null }>) {
    if (r.stripe_customer_id && r.user_id && !out.has(r.stripe_customer_id)) {
      out.set(r.stripe_customer_id, { userId: r.user_id, email: null, fullName: null, source: "subscription" });
    }
  }

  // 2. legacy_stripe_link (un-migrated BD members) for any remaining ids
  const missing = ids.filter((id) => !out.has(id));
  if (missing.length) {
    const { data: legRows } = await supabase
      .from("legacy_stripe_link")
      .select("stripe_customer_id, email, bd_member_id")
      .in("stripe_customer_id", missing);
    const bdIds: number[] = [];
    const byCust = new Map<string, { email: string | null; bd_member_id: number | null }>();
    for (const r of (legRows ?? []) as Array<{ stripe_customer_id: string; email: string | null; bd_member_id: number | null }>) {
      byCust.set(r.stripe_customer_id, { email: r.email, bd_member_id: r.bd_member_id });
      if (r.bd_member_id) bdIds.push(r.bd_member_id);
    }
    const nameByBd = new Map<number, string>();
    if (bdIds.length) {
      const { data: seedRows } = await supabase
        .from("bd_member_seed")
        .select("bd_member_id, first_name, last_name")
        .in("bd_member_id", bdIds);
      for (const r of (seedRows ?? []) as Array<{ bd_member_id: number; first_name: string | null; last_name: string | null }>) {
        const name = [r.first_name, r.last_name].filter(Boolean).join(" ").trim();
        if (name) nameByBd.set(r.bd_member_id, name);
      }
    }
    for (const [custId, info] of byCust) {
      out.set(custId, {
        userId: null,
        email: info.email,
        fullName: info.bd_member_id ? nameByBd.get(info.bd_member_id) ?? null : null,
        source: "legacy_link",
      });
    }
  }

  return out;
}

/**
 * For events that carry only a charge id (typical of legacy chargebacks),
 * walk `legacy_stripe_payments` to recover the customer id + email.
 */
async function resolveContactsByChargeIds(
  supabase: any,
  chargeIds: string[],
): Promise<Map<string, { stripeCustomerId: string | null; email: string | null }>> {
  const out = new Map<string, { stripeCustomerId: string | null; email: string | null }>();
  const ids = Array.from(new Set(chargeIds.filter(Boolean)));
  if (!ids.length) return out;
  const { data } = await supabase
    .from("legacy_stripe_payments")
    .select("charge_id, stripe_customer_id, email")
    .in("charge_id", ids);
  for (const r of (data ?? []) as Array<{ charge_id: string; stripe_customer_id: string | null; email: string | null }>) {
    if (!out.has(r.charge_id)) out.set(r.charge_id, { stripeCustomerId: r.stripe_customer_id, email: r.email });
  }
  return out;
}

/** Last-resort: pull contact info straight off the Stripe event object. */
function extractPayloadContact(obj: any): { email: string | null; fullName: string | null } {
  if (!obj) return { email: null, fullName: null };
  const email =
    obj.receipt_email ??
    obj.billing_details?.email ??
    obj.customer_email ??
    obj.evidence?.customer_email_address ??
    null;
  const fullName =
    obj.billing_details?.name ??
    obj.evidence?.customer_name ??
    obj.customer_name ??
    null;
  return { email: email ?? null, fullName: fullName ?? null };
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
  if (tier === "verified") return Math.round(3400 / 12);
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

    // Per-event metadata pass (so we know charge ids before resolving contacts)
    type Meta = {
      e: typeof events[number];
      obj: any;
      status: PaymentRow["status"];
      amount: number;
      currency: string;
      chargeId: string | null;
      piId: string | null;
      customerId: string | null;
    };
    const metas: Meta[] = events.map((e) => {
      const obj = e.payload?.data?.object ?? {};
      let status: PaymentRow["status"] = "succeeded";
      let amount = 0;
      let currency = "gbp";
      let chargeId: string | null = null;
      let piId: string | null = null;
      if (e.event_type === "invoice.paid") {
        status = "succeeded"; amount = obj.amount_paid ?? 0; currency = obj.currency ?? "gbp";
        chargeId = obj.charge ?? null; piId = obj.payment_intent ?? null;
      } else if (e.event_type === "charge.refunded") {
        status = "refunded"; amount = obj.amount_refunded ?? obj.amount ?? 0; currency = obj.currency ?? "gbp";
        chargeId = obj.id ?? null; piId = typeof obj.payment_intent === "string" ? obj.payment_intent : null;
      } else if (e.event_type === "charge.failed") {
        status = "failed"; amount = obj.amount ?? 0; currency = obj.currency ?? "gbp";
        chargeId = obj.id ?? null; piId = typeof obj.payment_intent === "string" ? obj.payment_intent : null;
      } else if (e.event_type === "charge.dispute.created") {
        status = "disputed"; amount = obj.amount ?? 0; currency = obj.currency ?? "gbp";
        chargeId = typeof obj.charge === "string" ? obj.charge : null;
      }
      return { e, obj, status, amount, currency, chargeId, piId, customerId: e.stripe_customer_id };
    });

    // Backfill customer ids via legacy_stripe_payments (for legacy chargebacks where
    // the dispute event has no customer id but we have the charge id locally).
    const chargeIds = metas.map((m) => m.chargeId).filter(Boolean) as string[];
    const chargeMap = await resolveContactsByChargeIds(supabaseAdmin, chargeIds);
    for (const m of metas) {
      if (!m.customerId && m.chargeId) {
        const hit = chargeMap.get(m.chargeId);
        if (hit?.stripeCustomerId) m.customerId = hit.stripeCustomerId;
      }
    }

    // Batch contact resolution (subscriptions → legacy_link → bd_member_seed)
    const customerIds = Array.from(new Set(metas.map((m) => m.customerId).filter(Boolean) as string[]));
    const contactByCustomer = await resolveContactsByCustomerIds(supabaseAdmin, customerIds);

    // Hydrate profile names + emails for any resolved user_ids
    const userIds = Array.from(new Set([
      ...(events.map((e) => e.user_id).filter(Boolean) as string[]),
      ...Array.from(contactByCustomer.values()).map((c) => c.userId).filter(Boolean) as string[],
    ]));
    const profileMap = new Map<string, { full_name: string | null }>();
    const emailMap = new Map<string, string | null>();
    if (userIds.length) {
      const { data: profs } = await supabaseAdmin.from("profiles").select("id, full_name").in("id", userIds);
      for (const p of (profs ?? []) as Array<{ id: string; full_name: string | null }>) profileMap.set(p.id, { full_name: p.full_name });
      try {
        let page = 1;
        while (page < 30) {
          const { data: ud, error } = await supabaseAdmin.auth.admin.listUsers({ page, perPage: 200 });
          if (error) break;
          for (const u of ud.users) if (userIds.includes(u.id)) emailMap.set(u.id, u.email ?? null);
          if (ud.users.length < 200) break;
          page += 1;
        }
      } catch { /* best-effort */ }
    }

    const out: PaymentRow[] = [];
    for (const m of metas) {
      const e = m.e;
      const custHit = m.customerId ? contactByCustomer.get(m.customerId) : null;
      const resolvedUserId = e.user_id ?? custHit?.userId ?? null;
      const profName = resolvedUserId ? profileMap.get(resolvedUserId)?.full_name ?? null : null;
      const profEmail = resolvedUserId ? emailMap.get(resolvedUserId) ?? null : null;
      const chargeHit = m.chargeId ? chargeMap.get(m.chargeId) : null;
      const payload = extractPayloadContact(m.obj);
      const fullName = profName ?? custHit?.fullName ?? payload.fullName ?? null;
      const email = profEmail ?? custHit?.email ?? chargeHit?.email ?? payload.email ?? null;

      if (data.search) {
        const q = data.search.toLowerCase();
        const hay = `${email ?? ""} ${fullName ?? ""} ${m.chargeId ?? ""} ${m.piId ?? ""} ${m.customerId ?? ""}`.toLowerCase();
        if (!hay.includes(q)) continue;
      }

      out.push({
        id: e.id,
        createdAt: e.created_at,
        userId: resolvedUserId,
        email,
        fullName,
        amountPence: m.amount,
        currency: m.currency,
        status: m.status,
        stripeChargeId: m.chargeId,
        stripeCustomerId: m.customerId,
        stripePaymentIntentId: m.piId,
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
        "id, opened_at, user_id, reason, amount_pence, currency, status, lifecycle_stage, evidence_due_by, stripe_dispute_id, stripe_charge_id, stripe_customer_id",
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
      stripe_customer_id: string | null;
    }>;

    // Backfill customer_id via charge_id → legacy_stripe_payments for legacy chargebacks.
    const chargeIds = disputes.map((d) => d.stripe_charge_id).filter(Boolean) as string[];
    const chargeMap = await resolveContactsByChargeIds(supabaseAdmin, chargeIds);
    const customerIdByDispute = new Map<string, string | null>();
    for (const d of disputes) {
      let cust = d.stripe_customer_id ?? null;
      if (!cust && d.stripe_charge_id) cust = chargeMap.get(d.stripe_charge_id)?.stripeCustomerId ?? null;
      customerIdByDispute.set(d.id, cust);
    }

    const customerIds = Array.from(new Set(Array.from(customerIdByDispute.values()).filter(Boolean) as string[]));
    const contactByCustomer = await resolveContactsByCustomerIds(supabaseAdmin, customerIds);

    const userIds = Array.from(new Set<string>([
      ...(disputes.map((d) => d.user_id).filter(Boolean) as string[]),
      ...Array.from(contactByCustomer.values()).map((c) => c.userId).filter(Boolean) as string[],
    ]));
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

    return disputes.map((d) => {
      const cust = customerIdByDispute.get(d.id) ?? null;
      const custHit = cust ? contactByCustomer.get(cust) : null;
      const resolvedUserId = d.user_id ?? custHit?.userId ?? null;
      const profName = resolvedUserId ? profMap.get(resolvedUserId) ?? null : null;
      const profEmail = resolvedUserId ? emailMap.get(resolvedUserId) ?? null : null;
      const chargeHit = d.stripe_charge_id ? chargeMap.get(d.stripe_charge_id) : null;
      return {
        id: d.id,
        openedAt: d.opened_at,
        userId: resolvedUserId,
        email: profEmail ?? custHit?.email ?? chargeHit?.email ?? null,
        fullName: profName ?? custHit?.fullName ?? null,
        reason: d.reason,
        amountPence: d.amount_pence ?? 0,
        currency: d.currency ?? "gbp",
        status: d.status,
        lifecycleStage: d.lifecycle_stage,
        evidenceDueBy: d.evidence_due_by,
        stripeDisputeId: d.stripe_dispute_id,
        stripeChargeId: d.stripe_charge_id,
      };
    });
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
      .select("id, created_at, user_id, payload, stripe_customer_id")
      .eq("event_type", "charge.refunded")
      .gte("created_at", sinceIso)
      .order("created_at", { ascending: false })
      .limit(data.limit);

    const events = (rows ?? []) as Array<{
      id: string;
      created_at: string;
      user_id: string | null;
      payload: any;
      stripe_customer_id: string | null;
    }>;

    // Pre-derive charge ids so we can backfill customer ids for legacy refunds.
    const chargeIds = events.map((e) => (e.payload?.data?.object?.id as string | null) ?? null).filter(Boolean) as string[];
    const chargeMap = await resolveContactsByChargeIds(supabaseAdmin, chargeIds);
    const customerIdByEvent = new Map<string, string | null>();
    for (const e of events) {
      let cust = e.stripe_customer_id;
      const chId = e.payload?.data?.object?.id as string | null;
      if (!cust && chId) cust = chargeMap.get(chId)?.stripeCustomerId ?? null;
      customerIdByEvent.set(e.id, cust);
    }

    const customerIds = Array.from(new Set(Array.from(customerIdByEvent.values()).filter(Boolean) as string[]));
    const contactByCustomer = await resolveContactsByCustomerIds(supabaseAdmin, customerIds);

    const userIds = Array.from(new Set<string>([
      ...(events.map((e) => e.user_id).filter(Boolean) as string[]),
      ...Array.from(contactByCustomer.values()).map((c) => c.userId).filter(Boolean) as string[],
    ]));
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
      const cust = customerIdByEvent.get(e.id) ?? null;
      const custHit = cust ? contactByCustomer.get(cust) : null;
      const resolvedUserId = e.user_id ?? custHit?.userId ?? null;
      const profName = resolvedUserId ? profMap.get(resolvedUserId) ?? null : null;
      const profEmail = resolvedUserId ? emailMap.get(resolvedUserId) ?? null : null;
      const chargeHit = obj.id ? chargeMap.get(obj.id) : null;
      const payload = extractPayloadContact(obj);
      return {
        id: e.id,
        createdAt: e.created_at,
        userId: resolvedUserId,
        email: profEmail ?? custHit?.email ?? chargeHit?.email ?? payload.email ?? null,
        fullName: profName ?? custHit?.fullName ?? payload.fullName ?? null,
        amountPence: obj.amount_refunded ?? obj.amount ?? 0,
        currency: obj.currency ?? "gbp",
        reason: obj.refunds?.data?.[0]?.reason ?? null,
        stripeChargeId: obj.id ?? null,
      };
    });
  });

