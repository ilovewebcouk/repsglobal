// Admin Member 360 — billing write actions.
//
// Cancellation contract lives in `closeMembership` (delegating to
// `_closeMembershipImpl` in close-membership.server.ts).
//
// Stripe is the source of truth; after every successful Stripe write the
// matching `public.subscriptions` row is mirrored back so the UI reflects
// immediately without waiting on the webhook round-trip.

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

async function resolveActiveSub(userId: string) {
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
    stripe_subscription_id: live.stripe_subscription_id as string,
    env: (live.environment === "live" ? "live" : "sandbox") as StripeEnv,
    rowId: live.id as string,
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

/* ─────────────── Cancel at period end (RETIRED) ───────────────
 * REPS policy is immediate termination with no grace period. This entry
 * point is kept as a hard-failing stub so any older admin UI wired to it
 * surfaces an obvious error instead of silently reintroducing a grace
 * period. Use `closeMembership` with mode `end_now_delete` instead. */
export const setMemberCancelAtPeriodEnd = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { user_id: string; cancel: boolean }) => {
    if (!d?.user_id) throw new Error("user_id required");
    return { user_id: d.user_id, cancel: !!d.cancel };
  })
  .handler(async ({ context }) => {
    await assertAdmin(context);
    throw new Error(
      "Scheduled cancellation is retired. Use 'Cancel immediately and delete' instead — REPS terminates memberships on cancel with no grace period.",
    );
  });


/* ─────────────── Cancel immediately (no delete) ─────────────── */

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

/* ─────────────── closeMembership — canonical contract ─────────────── */

export type CloseMode = "schedule_end_period" | "end_now_delete" | "delete_only";
export type CancelReason =
  | "admin_cancel_immediate"
  | "admin_cancel_period_end"
  | "admin_end_trial"
  | "admin_delete"
  | "member_request"
  | "self_delete"
  | "chargeback_lost"
  | "stripe_uncollectible";

const ALL_MODES: CloseMode[] = ["schedule_end_period", "end_now_delete", "delete_only"];
const ALL_REASONS: CancelReason[] = [
  "admin_cancel_immediate",
  "admin_cancel_period_end",
  "admin_end_trial",
  "admin_delete",
  "member_request",
  "self_delete",
  "chargeback_lost",
  "stripe_uncollectible",
];

export const closeMembership = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: {
    user_id: string;
    mode: CloseMode;
    reason: CancelReason;
    notes?: string;
  }) => {
    if (!d?.user_id) throw new Error("user_id required");
    if (!ALL_MODES.includes(d.mode)) throw new Error("invalid mode");
    if (!ALL_REASONS.includes(d.reason)) throw new Error("invalid reason");
    return {
      user_id: d.user_id,
      mode: d.mode,
      reason: d.reason,
      notes: d.notes?.trim() || null,
    };
  })
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    if (data.user_id === context.userId) {
      throw new Error("You cannot close your own admin account from here.");
    }
    const { _closeMembershipImpl } = await import("./close-membership.server");
    return _closeMembershipImpl({
      user_id: data.user_id,
      mode: data.mode,
      reason: data.reason,
      notes: data.notes,
      actor_id: `admin:${context.userId}`,
    });
  });

/* ─────────────── Back-compat shim ─────────────── */
// Old callers (route file, support card) imported `cancelAndDeleteMember`.
// Resolves to end_now_delete (or delete_only when there's nothing to
// cancel) — matching the original behaviour exactly.
export const cancelAndDeleteMember = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { user_id: string; reason: CancelReason; notes?: string }) => {
    if (!d?.user_id) throw new Error("user_id required");
    return {
      user_id: d.user_id,
      reason: d.reason,
      notes: d.notes?.trim() || null,
    };
  })
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: subs } = await supabaseAdmin
      .from("subscriptions")
      .select("stripe_subscription_id, status")
      .eq("user_id", data.user_id);
    const hasLiveSub = (subs ?? []).some(
      (s: any) =>
        s.stripe_subscription_id &&
        ["active", "trialing", "past_due"].includes(s.status),
    );
    const mode: CloseMode = hasLiveSub ? "end_now_delete" : "delete_only";
    const { _closeMembershipImpl } = await import("./close-membership.server");
    return _closeMembershipImpl({
      user_id: data.user_id,
      mode,
      reason: data.reason,
      notes: data.notes,
      actor_id: `admin:${context.userId}`,
    });
  });

/* ─────────────── Find a member by email (used by support tickets) ─────────────── */
export const findMemberByEmail = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { email: string }) => {
    const email = (d?.email ?? "").toLowerCase().trim();
    if (!email || !email.includes("@")) throw new Error("email required");
    return { email };
  })
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    let matched: { id: string; email?: string | null } | null = null;
    for (let page = 1; page <= 20 && !matched; page++) {
      const { data: list, error } = await supabaseAdmin.auth.admin.listUsers({
        page,
        perPage: 200,
      });
      if (error) throw new Error(error.message);
      const users = (list?.users ?? []) as { id: string; email?: string | null }[];
      matched = users.find((u) => (u.email ?? "").toLowerCase() === data.email) ?? null;
      if (users.length < 200) break;
    }
    if (!matched) return { found: false as const };

    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("full_name, display_name")
      .eq("id", matched.id)
      .maybeSingle();

    const { data: sub } = await supabaseAdmin
      .from("subscriptions")
      .select("status, tier")
      .eq("user_id", matched.id)
      .in("status", ["active", "trialing", "past_due"])
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    return {
      found: true as const,
      user_id: matched.id,
      full_name:
        (profile as any)?.full_name ?? (profile as any)?.display_name ?? null,
      has_active_subscription: !!sub,
      tier: (sub as any)?.tier ?? null,
    };
  });
