// Admin Member 360 — billing write actions.
//
// Stripe is the source of truth; after every successful write we mirror the
// new state back into `public.subscriptions` so the UI reflects immediately
// without waiting on the webhook round-trip.

import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

type StripeEnv = "live" | "sandbox";

async function assertAdmin(ctx: { supabase: any; userId: string }) {
  const { data: isAdmin } = await ctx.supabase.rpc("has_role", {
    _user_id: ctx.userId,
    _role: "admin" as never,
  });
  if (!isAdmin) throw new Error("Forbidden");
}

type ResolvedSub = {
  stripe_subscription_id: string;
  env: StripeEnv;
  rowId: string;
};

async function resolveActiveSub(userId: string): Promise<ResolvedSub> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await supabaseAdmin
    .from("subscriptions")
    .select("id, stripe_subscription_id, environment, status, created_at")
    .eq("user_id", userId)
    .not("stripe_subscription_id", "is", null)
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  const rows = (data ?? []) as any[];
  const live =
    rows.find((r) => ["active", "trialing", "past_due"].includes(r.status)) ?? rows[0];
  if (!live?.stripe_subscription_id) throw new Error("No Stripe subscription on file");
  return {
    stripe_subscription_id: live.stripe_subscription_id,
    env: (live.environment === "live" ? "live" : "sandbox") as StripeEnv,
    rowId: live.id,
  };
}

async function mirrorBackToLocal(rowId: string, subId: string, env: StripeEnv) {
  const { getMirrorSubscription } = await import("@/lib/billing/stripe-mirror.server");
  const mirror = await getMirrorSubscription(subId, env);
  if (!mirror) return;
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  await supabaseAdmin
    .from("subscriptions")
    .update({
      status: mirror.status as any,
      cancel_at_period_end: mirror.cancel_at_period_end,
      current_period_end: mirror.current_period_end,
      stripe_price_id: mirror.price_id ?? undefined,
      canceled_at: mirror.status === "canceled" ? new Date().toISOString() : null,
      updated_at: new Date().toISOString(),
    } as never)
    .eq("id", rowId);
}

async function logAction(
  context: { supabase: any; userId: string },
  action: string,
  targetUserId: string,
  reason?: string | null,
) {
  try {
    await context.supabase.rpc("log_admin_action", {
      _actor_id: context.userId,
      _action: action,
      _target_table: "subscriptions",
      _target_id: targetUserId,
      _reason: reason ?? undefined,
    });
  } catch {
    /* best-effort */
  }
}

/* ─────────────── End trial now ─────────────── */

export const endMemberTrialNow = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { user_id: string }) => {
    if (!d?.user_id) throw new Error("user_id required");
    return { user_id: d.user_id };
  })
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { stripe_subscription_id, env, rowId } = await resolveActiveSub(data.user_id);
    const { createStripeClient } = await import("@/lib/billing/stripe.server");
    const stripe = createStripeClient(env);
    await stripe.subscriptions.update(stripe_subscription_id, {
      trial_end: "now",
      proration_behavior: "none",
    });
    await mirrorBackToLocal(rowId, stripe_subscription_id, env);
    await logAction(context, "member.end_trial_now", data.user_id);
    return { ok: true };
  });

/* ─────────────── Cancel at period end (toggle) ─────────────── */

export const setMemberCancelAtPeriodEnd = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { user_id: string; cancel: boolean }) => {
    if (!d?.user_id) throw new Error("user_id required");
    return { user_id: d.user_id, cancel: !!d.cancel };
  })
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { stripe_subscription_id, env, rowId } = await resolveActiveSub(data.user_id);
    const { createStripeClient } = await import("@/lib/billing/stripe.server");
    const stripe = createStripeClient(env);
    await stripe.subscriptions.update(stripe_subscription_id, {
      cancel_at_period_end: data.cancel,
    });
    await mirrorBackToLocal(rowId, stripe_subscription_id, env);
    await logAction(
      context,
      data.cancel ? "member.schedule_cancel" : "member.resume_subscription",
      data.user_id,
    );
    return { ok: true };
  });

/* ─────────────── Cancel immediately ─────────────── */

export const cancelMemberSubscriptionNow = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { user_id: string; reason?: string }) => {
    if (!d?.user_id) throw new Error("user_id required");
    return { user_id: d.user_id, reason: d.reason?.trim() || null };
  })
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { stripe_subscription_id, env, rowId } = await resolveActiveSub(data.user_id);
    const { createStripeClient } = await import("@/lib/billing/stripe.server");
    const stripe = createStripeClient(env);
    await stripe.subscriptions.cancel(stripe_subscription_id);
    await mirrorBackToLocal(rowId, stripe_subscription_id, env);
    await logAction(context, "member.cancel_subscription_now", data.user_id, data.reason);
    return { ok: true };
  });
