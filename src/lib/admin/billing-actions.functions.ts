// Admin Member 360 — billing write actions.
//
// Canonical cancellation contract lives in `closeMembership` below.
// Three honest modes:
//   - schedule_end_period  → sets cancel_at_period_end=true on Stripe.
//                            NO delete. Profile stays live until period end.
//                            Member can resume from the Stripe portal.
//   - end_now_delete       → cancels Stripe immediately, archives email,
//                            records cancelled_email/full_name/reason on the
//                            subscription row, deletes the auth user.
//                            (Sub row is kept via ON DELETE SET NULL FK.)
//   - delete_only          → no Stripe sub on file; archive + delete.
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

/* ─────────────── closeMembership — canonical contract ─────────────── */

export type CloseMode = "schedule_end_period" | "end_now_delete" | "delete_only";

export type CancelReason =
  | "admin_cancel_immediate"
  | "admin_cancel_period_end"
  | "admin_end_trial"
  | "admin_delete"
  | "member_request"
  | "chargeback_lost";

const REASON_LABEL: Record<CancelReason, string> = {
  admin_cancel_immediate: "cancelled by admin",
  admin_cancel_period_end: "scheduled to end at period close",
  admin_end_trial: "trial ended by admin",
  admin_delete: "removed by admin",
  member_request: "at your request",
  chargeback_lost: "closed due to a payment dispute",
};

async function sendCancellationEmail(opts: {
  to: string;
  fullName: string | null;
  reason: CancelReason;
  userId: string;
}) {
  try {
    const React = await import("react");
    const { render } = await import("@react-email/components");
    const { TEMPLATES } = await import("@/lib/email-templates/registry");
    const tmpl = TEMPLATES["member-cancelled"];
    if (!tmpl) return { ok: true };
    const props = {
      proName: opts.fullName ?? undefined,
      reasonLabel: REASON_LABEL[opts.reason],
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const element = React.createElement(tmpl.component as any, props);
    const html = await render(element);
    const text = await render(element, { plainText: true });
    const subject = typeof tmpl.subject === "function" ? tmpl.subject(props) : tmpl.subject;
    const { sendViaMailgun } = await import("@/lib/email/mailgun.server");
    const sendRes = await sendViaMailgun({
      to: opts.to,
      subject,
      html,
      text,
      templateName: "member-cancelled",
      idempotencyKey: `member-cancelled-${opts.userId}-${Date.now()}`,
    });
    return { ok: sendRes.ok, error: sendRes.error };
  } catch (e: any) {
    console.warn("[closeMembership] email failed", e);
    return { ok: false, error: e?.message ?? String(e) };
  }
}

/**
 * The canonical close-membership function. Every UI entry point that ends
 * a member's relationship with REPS funnels through this single fn so
 * behaviour can't diverge across surfaces (Member 360, support ticket,
 * Stripe webhook, dispute lost).
 *
 * mode='schedule_end_period' — paying member, wants to wind down gracefully.
 *   • Stripe: cancel_at_period_end=true (no immediate cancel).
 *   • No auth-user delete. Profile stays live until period close. Member
 *     can resume from the customer portal at any time.
 *   • Email: "scheduled to end" confirmation.
 *
 * mode='end_now_delete' — admin destructive close, or self-cancel cleanup.
 *   • Stripe: cancel every sub on file immediately.
 *   • Stamp cancelled_email / cancelled_full_name / cancellation_reason
 *     onto every related subscription row so the cancellation is readable
 *     after the user is gone (FK is ON DELETE SET NULL).
 *   • Archive email to mailing_list_contacts.
 *   • Send confirmation email via Mailgun.
 *   • Delete auth user (subscription rows survive with user_id=NULL).
 *
 * mode='delete_only' — no Stripe sub; admin tidy-up of orphan account.
 *   • Skips Stripe.
 *   • Archive + delete.
 */
export const closeMembership = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: {
    user_id: string;
    mode: CloseMode;
    reason: CancelReason;
    notes?: string;
  }) => {
    if (!d?.user_id) throw new Error("user_id required");
    const MODES: CloseMode[] = ["schedule_end_period", "end_now_delete", "delete_only"];
    if (!MODES.includes(d.mode)) throw new Error("invalid mode");
    const REASONS: CancelReason[] = [
      "admin_cancel_immediate",
      "admin_cancel_period_end",
      "admin_end_trial",
      "admin_delete",
      "member_request",
      "chargeback_lost",
    ];
    if (!REASONS.includes(d.reason)) throw new Error("invalid reason");
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

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // Snapshot identity.
    const { data: authUser } = await supabaseAdmin.auth.admin.getUserById(data.user_id);
    const email = (authUser?.user?.email ?? "").toLowerCase().trim();
    if (!email) throw new Error("Member has no email on auth account");

    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("full_name, display_name")
      .eq("id", data.user_id)
      .maybeSingle();

    const { data: professional } = await supabaseAdmin
      .from("professionals")
      .select("slug, primary_profession, city, is_published")
      .eq("id", data.user_id)
      .maybeSingle();

    const { data: subs } = await supabaseAdmin
      .from("subscriptions")
      .select("id, stripe_subscription_id, environment, tier, status")
      .eq("user_id", data.user_id);

    const lastTier =
      (subs ?? []).find((s: any) => ["active", "trialing", "past_due"].includes(s.status))?.tier ??
      (subs ?? [])[0]?.tier ??
      null;

    const fullName =
      (profile as any)?.full_name ?? (profile as any)?.display_name ?? null;

    /* ───── Mode A: schedule_end_period (non-destructive) ───── */
    if (data.mode === "schedule_end_period") {
      const { stripe_subscription_id, env, rowId } = await resolveActiveSub(data.user_id);
      const { createStripeClient } = await import("@/lib/billing/stripe.server");
      const stripe = createStripeClient(env);
      await stripe.subscriptions.update(stripe_subscription_id, {
        cancel_at_period_end: true,
      });
      await mirrorBackToLocal(rowId, stripe_subscription_id, env);

      const emailRes = await sendCancellationEmail({
        to: email,
        fullName,
        reason: data.reason,
        userId: data.user_id,
      });

      await logAction(
        context,
        "member.schedule_cancel",
        data.user_id,
        data.notes ?? data.reason,
      );
      return { ok: true, mode: data.mode, cancelled: 0, emailSent: emailRes.ok, emailError: emailRes.error };
    }

    /* ───── Mode B + C: end_now_delete / delete_only ───── */

    // Cancel every Stripe subscription (live + sandbox) — best-effort.
    const { createStripeClient } = await import("@/lib/billing/stripe.server");
    let cancelled = 0;
    if (data.mode === "end_now_delete") {
      for (const s of (subs ?? []) as any[]) {
        if (!s.stripe_subscription_id) continue;
        try {
          const stripe = createStripeClient(
            (s.environment === "live" ? "live" : "sandbox") as StripeEnv,
          );
          await stripe.subscriptions.cancel(s.stripe_subscription_id);
          cancelled++;
        } catch (e) {
          console.warn("[closeMembership] stripe cancel failed", s.stripe_subscription_id, e);
        }
      }
    }

    // Stamp retention columns on every related subscription row BEFORE the
    // auth-user delete so cancellation history survives.
    try {
      await supabaseAdmin
        .from("subscriptions")
        .update({
          cancelled_email: email,
          cancelled_full_name: fullName,
          cancellation_reason: data.reason,
          cancellation_notes: data.notes,
          closed_by_actor: `admin:${context.userId}`,
          canceled_at: new Date().toISOString(),
          status: "canceled" as any,
          updated_at: new Date().toISOString(),
        } as never)
        .eq("user_id", data.user_id);
    } catch (e) {
      console.warn("[closeMembership] retention stamp failed", e);
    }

    // Archive contact (idempotent on email).
    try {
      await supabaseAdmin
        .from("mailing_list_contacts")
        .upsert(
          {
            email,
            full_name: fullName,
            profession: (professional as any)?.primary_profession ?? null,
            city: (professional as any)?.city ?? null,
            former_user_id: data.user_id,
            last_tier: lastTier,
            deletion_reason: data.reason,
            deletion_notes: data.notes,
            marketing_opt_in: true,
            source: "cancellation",
            deleted_at: new Date().toISOString(),
          } as never,
          { onConflict: "email" },
        );
    } catch (e) {
      console.warn("[closeMembership] archive failed", e);
    }

    // Send the confirmation email BEFORE the auth delete (audit trail).
    const emailRes = await sendCancellationEmail({
      to: email,
      fullName,
      reason: data.reason,
      userId: data.user_id,
    });

    // Delete the auth user. With ON DELETE SET NULL on subscriptions.user_id,
    // the cancellation rows survive for analytics.
    const { error: delErr } = await supabaseAdmin.auth.admin.deleteUser(data.user_id);
    if (delErr) throw delErr;

    // Audit log.
    try {
      await supabaseAdmin.rpc("log_admin_action", {
        _actor_id: context.userId,
        _action: "member.close_and_delete",
        _target_table: "auth.users",
        _target_id: data.user_id,
        _before_state: {
          email,
          full_name: fullName,
          last_tier: lastTier,
          stripe_subs_cancelled: cancelled,
          reason: data.reason,
          mode: data.mode,
        },
        _reason: data.notes ?? data.reason,
      });
    } catch (e) {
      console.warn("[closeMembership] audit log failed", e);
    }

    return {
      ok: true,
      mode: data.mode,
      cancelled,
      emailSent: emailRes.ok,
      emailError: emailRes.error,
    };
  });

/* ─────────────── Back-compat shim ─────────────── */
// Old callers (route file, support card) imported `cancelAndDeleteMember`.
// Map the legacy `reason` to a `closeMembership` mode. Every reason except
// the new `schedule_end_period` opt-in resolves to end_now_delete (or
// delete_only when there's nothing to cancel) — matching the original
// behaviour exactly so we don't surprise any caller mid-refactor.
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
    // Delegate via internal helper so we don't re-implement the whole flow.
    // We can't `useServerFn` from the server side; just inline the same
    // resolution logic by calling the underlying handler via internal helper.
    // Easiest: replicate the mode decision and call the same code path.
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
    // Re-invoke closeMembership via direct .handler() is not exported; just
    // duplicate via an HTTP-style fetch is overkill. Easiest: extract the
    // closeMembership logic into a plain helper. For now, perform the same
    // operations inline by importing the worker:
    const { _closeMembershipImpl } = await import("./close-membership.server");
    return _closeMembershipImpl({
      user_id: data.user_id,
      mode,
      reason: data.reason,
      notes: data.notes,
      actor_id: context.userId,
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
