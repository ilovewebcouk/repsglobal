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

/* ─────────────── Cancel + delete (canonical close-account flow) ───────────────
 *
 * Business rule: "No active account without an active subscription."
 *
 * Every UI button that ends a member's relationship with REPS — Member 360
 * Billing actions, the support-ticket "Cancel this member's account" card,
 * a member-requested cancellation via support — funnels through this one
 * server fn so behaviour can't diverge across surfaces.
 *
 * Order of operations (best-effort cancel first, then archive, then delete):
 *   1. Snapshot identity + tier from profile / professional / subscription.
 *   2. Cancel every Stripe subscription on file (live + sandbox).
 *   3. Archive the contact into `mailing_list_contacts` (uniqueness by lower(email))
 *      so the email survives the cascade for future campaigns.
 *   4. Send the "member-cancelled" confirmation via Mailgun. Sends BEFORE we
 *      delete the auth row so the address is still in `auth.users` for logs.
 *   5. Delete the auth user — cascades to profiles, professionals, reviews, etc.
 *   6. Write an admin audit-log entry.
 */

export type CancelReason =
  | "admin_cancel_immediate"
  | "admin_cancel_period_end"
  | "admin_end_trial"
  | "admin_delete"
  | "member_request";

const REASON_LABEL: Record<CancelReason, string> = {
  admin_cancel_immediate: "cancelled by admin",
  admin_cancel_period_end: "cancelled at admin's request",
  admin_end_trial: "trial ended by admin",
  admin_delete: "removed by admin",
  member_request: "at your request",
};

export const cancelAndDeleteMember = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { user_id: string; reason: CancelReason; notes?: string }) => {
    if (!d?.user_id) throw new Error("user_id required");
    const REASONS: CancelReason[] = [
      "admin_cancel_immediate",
      "admin_cancel_period_end",
      "admin_end_trial",
      "admin_delete",
      "member_request",
    ];
    if (!REASONS.includes(d.reason)) throw new Error("invalid reason");
    return {
      user_id: d.user_id,
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

    // 1) Snapshot — pull what we need before the cascade wipes it.
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

    // 2) Best-effort cancel every Stripe subscription (live + sandbox).
    const { createStripeClient } = await import("@/lib/billing/stripe.server");
    let cancelled = 0;
    for (const s of (subs ?? []) as any[]) {
      if (!s.stripe_subscription_id) continue;
      try {
        const stripe = createStripeClient((s.environment === "live" ? "live" : "sandbox") as StripeEnv);
        await stripe.subscriptions.cancel(s.stripe_subscription_id);
        cancelled++;
      } catch (e) {
        console.warn("[cancelAndDeleteMember] stripe cancel failed", s.stripe_subscription_id, e);
      }
    }

    // 3) Archive the contact (idempotent upsert on lower(email)).
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
      console.warn("[cancelAndDeleteMember] archive failed", e);
    }

    // 4) Send the confirmation email (before delete so the audit trail is clean).
    let emailResult: { ok: boolean; error?: string } = { ok: true };
    try {
      const React = await import("react");
      const { render } = await import("@react-email/components");
      const { TEMPLATES } = await import("@/lib/email-templates/registry");
      const tmpl = TEMPLATES["member-cancelled"];
      if (tmpl) {
        const props = {
          proName: fullName ?? undefined,
          reasonLabel: REASON_LABEL[data.reason],
        };
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const element = React.createElement(tmpl.component as any, props);
        const html = await render(element);
        const text = await render(element, { plainText: true });
        const subject =
          typeof tmpl.subject === "function" ? tmpl.subject(props) : tmpl.subject;
        const { sendViaMailgun } = await import("@/lib/email/mailgun.server");
        const sendRes = await sendViaMailgun({
          to: email,
          subject,
          html,
          text,
          templateName: "member-cancelled",
          idempotencyKey: `member-cancelled-${data.user_id}-${Date.now()}`,
        });
        emailResult = { ok: sendRes.ok, error: sendRes.error };
      }
    } catch (e: any) {
      console.warn("[cancelAndDeleteMember] email failed", e);
      emailResult = { ok: false, error: e?.message ?? String(e) };
    }

    // 5) Delete the auth user (cascades via FKs to profiles, professionals, etc.).
    const { error: delErr } = await supabaseAdmin.auth.admin.deleteUser(data.user_id);
    if (delErr) throw delErr;

    // 6) Audit log.
    try {
      await supabaseAdmin.rpc("log_admin_action", {
        _actor_id: context.userId,
        _action: "member.cancel_and_delete",
        _target_table: "auth.users",
        _target_id: data.user_id,
        _before_state: {
          email,
          full_name: fullName,
          last_tier: lastTier,
          stripe_subs_cancelled: cancelled,
          reason: data.reason,
        },
        _reason: data.notes ?? data.reason,
      });
    } catch (e) {
      console.warn("[cancelAndDeleteMember] audit log failed", e);
    }

    return {
      ok: true,
      cancelled,
      emailSent: emailResult.ok,
      emailError: emailResult.error,
    };
  });


/* ─────────────── Find a member by email (used by support tickets) ───────────────
 *
 * Support tickets only carry the requester's email, not their user_id. This
 * fn walks `auth.users` (paginated, 200/page — fine for REPs' headcount) to
 * find a match and returns just enough to render a "Close this member's
 * account" card in the ticket sheet.
 */
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
