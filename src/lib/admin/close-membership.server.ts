// Canonical close-membership worker. Server-only — never import from a
// client-reachable file at module scope. Used by `closeMembership` (the
// admin server fn), `cancelAndDeleteMember` (back-compat shim), the
// Stripe webhook self-cancel cleanup, and the dispute-lost handler.

type StripeEnv = "live" | "sandbox";

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

export interface CloseMembershipInput {
  user_id: string;
  mode: CloseMode;
  reason: CancelReason;
  notes?: string | null;
  /** 'admin:<uuid>' or 'stripe_webhook' or 'dispute_lost'. */
  actor_id: string;
}

export interface CloseMembershipResult {
  ok: true;
  mode: CloseMode;
  cancelled: number;
  emailSent: boolean;
  emailError?: string;
}

async function sendCancellationEmail(opts: {
  to: string;
  fullName: string | null;
  reason: CancelReason;
  userId: string;
}): Promise<{ ok: boolean; error?: string }> {
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
    const subject =
      typeof tmpl.subject === "function" ? tmpl.subject(props) : tmpl.subject;
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

export async function _closeMembershipImpl(
  input: CloseMembershipInput,
): Promise<CloseMembershipResult> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

  // Snapshot identity.
  const { data: authUser } = await supabaseAdmin.auth.admin.getUserById(input.user_id);
  const email = (authUser?.user?.email ?? "").toLowerCase().trim();
  if (!email) throw new Error("Member has no email on auth account");

  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("full_name, display_name")
    .eq("id", input.user_id)
    .maybeSingle();

  const { data: professional } = await supabaseAdmin
    .from("professionals")
    .select("slug, primary_profession, city, is_published")
    .eq("id", input.user_id)
    .maybeSingle();

  const { data: subs } = await supabaseAdmin
    .from("subscriptions")
    .select("id, stripe_subscription_id, environment, tier, status")
    .eq("user_id", input.user_id);

  const lastTier =
    (subs ?? []).find((s: any) => ["active", "trialing", "past_due"].includes(s.status))?.tier ??
    (subs ?? [])[0]?.tier ??
    null;

  const fullName =
    (profile as any)?.full_name ?? (profile as any)?.display_name ?? null;

  /* ─── Mode A: schedule_end_period (non-destructive) ─── */
  if (input.mode === "schedule_end_period") {
    const live =
      (subs ?? []).find(
        (r: any) =>
          r.stripe_subscription_id &&
          ["active", "trialing", "past_due"].includes(r.status),
      ) ?? (subs ?? [])[0];
    if (!live?.stripe_subscription_id) {
      throw new Error("No Stripe subscription on file");
    }
    const env = (live.environment === "live" ? "live" : "sandbox") as StripeEnv;
    const { createStripeClient } = await import("@/lib/billing/stripe.server");
    const stripe = createStripeClient(env);
    await stripe.subscriptions.update(live.stripe_subscription_id, {
      cancel_at_period_end: true,
    });

    // Mirror back so /admin/billing reflects the schedule immediately.
    const { getMirrorSubscription } = await import("@/lib/billing/stripe-mirror.server");
    const mirror = await getMirrorSubscription(live.stripe_subscription_id, env);
    if (mirror) {
      await supabaseAdmin
        .from("subscriptions")
        .update({
          status: mirror.status as any,
          cancel_at_period_end: mirror.cancel_at_period_end,
          current_period_end: mirror.current_period_end,
          updated_at: new Date().toISOString(),
        } as never)
        .eq("id", live.id);
    }

    const emailRes = await sendCancellationEmail({
      to: email,
      fullName,
      reason: input.reason,
      userId: input.user_id,
    });

    try {
      await supabaseAdmin.rpc("log_admin_action", {
        _actor_id: input.actor_id.startsWith("admin:")
          ? input.actor_id.slice(6)
          : null,
        _action: "member.schedule_cancel",
        _target_table: "subscriptions",
        _target_id: input.user_id,
        _reason: input.notes ?? input.reason,
      } as never);
    } catch {
      /* best-effort */
    }

    return {
      ok: true,
      mode: input.mode,
      cancelled: 0,
      emailSent: emailRes.ok,
      emailError: emailRes.error,
    };
  }

  /* ─── Mode B + C: end_now_delete / delete_only ─── */

  const { createStripeClient } = await import("@/lib/billing/stripe.server");
  let cancelled = 0;
  if (input.mode === "end_now_delete") {
    for (const s of (subs ?? []) as any[]) {
      if (!s.stripe_subscription_id) continue;
      try {
        const stripe = createStripeClient(
          (s.environment === "live" ? "live" : "sandbox") as StripeEnv,
        );
        await stripe.subscriptions.cancel(s.stripe_subscription_id);
        cancelled++;
      } catch (e) {
        console.warn(
          "[closeMembership] stripe cancel failed",
          s.stripe_subscription_id,
          e,
        );
      }
    }
  }

  // Stamp retention columns onto every related subscription row BEFORE the
  // auth-user delete so cancellation history survives the SET NULL cascade.
  try {
    await supabaseAdmin
      .from("subscriptions")
      .update({
        cancelled_email: email,
        cancelled_full_name: fullName,
        cancellation_reason: input.reason,
        cancellation_notes: input.notes,
        closed_by_actor: input.actor_id,
        canceled_at: new Date().toISOString(),
        status: "canceled" as any,
        updated_at: new Date().toISOString(),
      } as never)
      .eq("user_id", input.user_id);
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
          former_user_id: input.user_id,
          last_tier: lastTier,
          deletion_reason: input.reason,
          deletion_notes: input.notes,
          marketing_opt_in: true,
          source: "cancellation",
          deleted_at: new Date().toISOString(),
        } as never,
        { onConflict: "email" },
      );
  } catch (e) {
    console.warn("[closeMembership] archive failed", e);
  }

  // Email BEFORE delete (audit trail still has the email address).
  const emailRes = await sendCancellationEmail({
    to: email,
    fullName,
    reason: input.reason,
    userId: input.user_id,
  });

  const { error: delErr } = await supabaseAdmin.auth.admin.deleteUser(input.user_id);
  if (delErr) throw delErr;

  try {
    await supabaseAdmin.rpc("log_admin_action", {
      _actor_id: input.actor_id.startsWith("admin:")
        ? input.actor_id.slice(6)
        : null,
      _action: "member.close_and_delete",
      _target_table: "auth.users",
      _target_id: input.user_id,
      _before_state: {
        email,
        full_name: fullName,
        last_tier: lastTier,
        stripe_subs_cancelled: cancelled,
        reason: input.reason,
        mode: input.mode,
        actor: input.actor_id,
      },
      _reason: input.notes ?? input.reason,
    } as never);
  } catch (e) {
    console.warn("[closeMembership] audit log failed", e);
  }

  return {
    ok: true,
    mode: input.mode,
    cancelled,
    emailSent: emailRes.ok,
    emailError: emailRes.error,
  };
}
