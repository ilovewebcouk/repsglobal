// Payment recovery — surfaces Stripe subscriptions that didn't fully activate
// (status: incomplete / past_due / unpaid) and lets an admin re-enrol them in
// the churn lifecycle and resend the card-update / payment-failed email.
//
// The live webhook handler at src/routes/api/public/payments/webhook.ts ALSO
// does this automatically on every future `invoice.payment_failed`. This
// module exists for:
//   1. Backfilling any sub that failed before the webhook routing existed,
//      e.g. the launch-day BD-migration sub for Raheela Khalid.
//   2. Letting admins manually re-nudge a sub from /admin/reconciliation.

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { FAILED_PAYMENT_STATUSES } from "@/lib/admin/metrics-definitions";

// Canonical "failed payments" set lives in metrics-definitions.ts so the
// /admin red banner, Ops Billing/Customer "Failed payments" tiles,
// /admin/memberships Past-due tile and this recovery list all agree.
const FAILED_STATUSES = [...FAILED_PAYMENT_STATUSES] as const;


export interface PaymentFailedSubRow {
  user_id: string;
  email: string | null;
  full_name: string | null;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  status: string;
  tier: string | null;
  is_legacy_migration: boolean;
  current_period_end: string | null;
  updated_at: string | null;
  last_attempt_at: string | null;
  churn_stage: string | null;
  last_nudge_at: string | null;
  nudge_count: number;
  renewal_token_active: boolean;
}

async function assertAdmin(context: { supabase: unknown; userId: string }) {
  const supa = context.supabase as { rpc: (n: string, p: object) => Promise<{ data: unknown }> };
  const { data: isAdmin } = await supa.rpc("has_role", {
    _user_id: context.userId,
    _role: "admin",
  });
  if (!isAdmin) throw new Error("Forbidden");
}


export const listPaymentFailedSubs = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<PaymentFailedSubRow[]> => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: subs, error } = await supabaseAdmin
      .from("subscriptions")
      .select(
        "user_id, stripe_customer_id, stripe_subscription_id, status, tier, current_period_end, updated_at, metadata, environment",
      )
      .in("status", [...FAILED_STATUSES])
      .eq("environment", "live");
    if (error) throw new Error(error.message);


    const rows = (subs ?? []) as Array<{
      user_id: string;
      stripe_customer_id: string | null;
      stripe_subscription_id: string | null;
      status: string;
      tier: string | null;
      current_period_end: string | null;
      updated_at: string | null;
      metadata: Record<string, unknown> | null;
    }>;
    if (rows.length === 0) return [];

    const userIds = Array.from(new Set(rows.map((r) => r.user_id).filter(Boolean)));
    const customerIds = Array.from(new Set(rows.map((r) => r.stripe_customer_id).filter(Boolean) as string[]));

    const [{ data: profiles }, { data: legacyLinks }, { data: churn }, { data: tokens }] = await Promise.all([
      supabaseAdmin.from("profiles").select("id, full_name").in("id", userIds),
      customerIds.length
        ? supabaseAdmin
            .from("legacy_stripe_link")
            .select("stripe_customer_id, last_attempt_at")
            .in("stripe_customer_id", customerIds)
        : Promise.resolve({ data: [] as Array<{ stripe_customer_id: string; last_attempt_at: string | null }> }),
      supabaseAdmin
        .from("churn_lifecycle")
        .select("user_id, stage, last_nudge_at, nudge_count")
        .in("user_id", userIds),
      supabaseAdmin
        .from("renewal_tokens")
        .select("user_id, consumed_at, expires_at")
        .in("user_id", userIds),
    ]);

    const profilesMap = new Map(
      (profiles ?? []).map((p: { id: string; full_name: string | null }) => [p.id, p.full_name]),
    );
    const legacyMap = new Map<string, string | null>();
    for (const l of (legacyLinks ?? []) as Array<{
      stripe_customer_id: string | null;
      last_attempt_at: string | null;
    }>) {
      if (l.stripe_customer_id) legacyMap.set(l.stripe_customer_id, l.last_attempt_at);
    }

    const churnMap = new Map(
      (churn ?? []).map((c: { user_id: string; stage: string; last_nudge_at: string | null; nudge_count: number }) => [
        c.user_id,
        c,
      ]),
    );
    const activeTokens = new Set(
      (tokens ?? [])
        .filter(
          (t: { user_id: string; consumed_at: string | null; expires_at: string }) =>
            !t.consumed_at && new Date(t.expires_at).getTime() > Date.now(),
        )
        .map((t: { user_id: string }) => t.user_id),
    );

    // auth.users emails
    const emailById = new Map<string, string | null>();
    for (const uid of userIds) {
      const { data } = await supabaseAdmin.auth.admin.getUserById(uid);
      emailById.set(uid, data?.user?.email ?? null);
    }

    return rows.map((r) => {
      const c = churnMap.get(r.user_id);
      return {
        user_id: r.user_id,
        email: emailById.get(r.user_id) ?? null,
        full_name: (profilesMap.get(r.user_id) as string | null | undefined) ?? null,
        stripe_customer_id: r.stripe_customer_id,
        stripe_subscription_id: r.stripe_subscription_id,
        status: r.status,
        tier: r.tier,
        is_legacy_migration:
          r.metadata?.reps_legacy_migration === "true" || r.metadata?.reps_legacy_migration === true,
        current_period_end: r.current_period_end,
        updated_at: r.updated_at,
        last_attempt_at: legacyMap.get(r.stripe_customer_id ?? "") ?? null,
        churn_stage: c?.stage ?? null,
        last_nudge_at: c?.last_nudge_at ?? null,
        nudge_count: c?.nudge_count ?? 0,
        renewal_token_active: activeTokens.has(r.user_id),
      };
    });
  });

export const recoverPaymentFailedSub = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({ user_id: z.string().uuid(), intended_tier: z.enum(["verified", "pro", "studio"]).default("verified") }).parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: authUser } = await supabaseAdmin.auth.admin.getUserById(data.user_id);
    const email = authUser?.user?.email ?? null;
    if (!email) return { ok: false as const, error: "User has no email on auth.users" };

    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("full_name")
      .eq("id", data.user_id)
      .maybeSingle();

    await supabaseAdmin.rpc("enter_churn_stage" as never, {
      _user_id: data.user_id,
      _stage: "at_risk",
      _reason: "Manual recovery: payment failed / incomplete subscription",
      _source_event: "admin.payment_recovery",
      _metadata: { triggered_by: context.userId },
    } as never);

    const { mintAndEmailRenewalToken } = await import("@/lib/churn/lifecycle.functions");
    const graceEnd = new Date(Date.now() + 14 * 86400000);
    const result = await mintAndEmailRenewalToken({
      userId: data.user_id,
      email,
      purpose: "payment_failed",
      templateName: "renewal-payment-failed",
      intendedTier: data.intended_tier,
      templateData: {
        proName:
          ((profile as { full_name?: string | null } | null)?.full_name ?? "").split(" ")[0] || "there",
        amount: data.intended_tier === "pro" ? "£59" : "£34",
        graceEndDate: graceEnd.toLocaleDateString("en-GB", {
          day: "numeric",
          month: "long",
          year: "numeric",
        }),
      },
    });

    return { ok: true as const, suppressed: !!result.suppressed, messageId: result.messageId ?? null };
  });
