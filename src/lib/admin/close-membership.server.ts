// Canonical close-membership worker. Server-only — never import from a
// client-reachable file at module scope. Used by `closeMembership` (the
// admin server fn), `cancelAndDeleteMember` (back-compat shim), the
// Stripe webhook self-cancel cleanup, and the dispute-lost handler.

type StripeEnv = "live" | "sandbox";

// `schedule_end_period` is retained in the type union for back-compat with
// older admin UI code paths, but the implementation now escalates it to
// immediate close. REPS policy: cancel = immediate termination, no grace.
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
  admin_cancel_period_end: "cancelled by admin",
  admin_end_trial: "trial ended by admin",
  admin_delete: "removed by admin",
  member_request: "at your request",
  chargeback_lost: "closed following a payment dispute",
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

async function insertCancelOpsAlert(
  userId: string,
  reason: CancelReason,
  email: string | null,
  actor: string,
): Promise<void> {
  try {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin.from("ops_alerts").insert({
      kind: "payments.member_cancelled",
      severity: reason === "chargeback_lost" ? "high" : "info",
      context: { user_id: userId, reason, email, actor } as never,
    } as never);
  } catch (err) {
    console.warn("[closeMembership] ops alert insert failed:", err);
  }
}

async function sendCancellationEmail(opts: {
  to: string;
  fullName: string | null;
  reason: CancelReason;
  userId: string;
}): Promise<{ ok: boolean; error?: string }> {
  try {
    const { sendTransactionalEmailServer } = await import("@/lib/email/send.server");
    const dayBucket = Math.floor(Date.now() / 86_400_000);
    const result = await sendTransactionalEmailServer({
      templateName: "member-cancelled",
      recipientEmail: opts.to,
      idempotencyKey: `member-cancelled-${opts.userId}-${dayBucket}`,
      templateData: {
        proName: opts.fullName ?? undefined,
        reasonLabel: REASON_LABEL[opts.reason],
      },
    });
    return { ok: result.success !== false };
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

  /* ─── Policy escalation: schedule_end_period is no longer supported ───
   * REPS cancels immediately with no grace period. Any legacy caller (older
   * admin UI or a Stripe portal misconfiguration) that requests period-end
   * scheduling is silently escalated to immediate close + delete. */
  const effectiveMode: CloseMode =
    input.mode === "schedule_end_period" ? "end_now_delete" : input.mode;

  /* ─── Hide the public profile FIRST ───
   * Do this before Stripe/auth-delete steps so the profile disappears even
   * if a later step fails and Stripe retries the webhook. */
  try {
    await supabaseAdmin
      .from("professionals")
      .update({
        is_published: false,
        unpublished_reason: "membership_closed",
        unpublished_at: new Date().toISOString(),
      } as never)
      .eq("id", input.user_id);
  } catch (e) {
    console.warn("[closeMembership] profile hide failed", e);
  }

  /* ─── end_now_delete / delete_only ─── */

  const { createStripeClient } = await import("@/lib/billing/stripe.server");
  let cancelled = 0;
  if (effectiveMode === "end_now_delete") {
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

  // Detach any legacy BD-migration link so the closed account stops
  // rendering as a "BD" member with a stale BD renewal date in admin views.
  try {
    await supabaseAdmin
      .from("bd_migration")
      .update({
        rep_user_id: null,
        rep_subscription_id: null,
        bd_renewal_date: null,
      } as never)
      .eq("rep_user_id", input.user_id);
  } catch (e) {
    console.warn("[closeMembership] bd_migration detach failed", e);
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
        mode: effectiveMode,
        actor: input.actor_id,
      },
      _reason: input.notes ?? input.reason,
    } as never);
  } catch (e) {
    console.warn("[closeMembership] audit log failed", e);
  }

  await insertCancelOpsAlert(input.user_id, input.reason, email, input.actor_id);

  return {
    ok: true,
    mode: effectiveMode,
    cancelled,
    emailSent: emailRes.ok,
    emailError: emailRes.error,
  };
}
