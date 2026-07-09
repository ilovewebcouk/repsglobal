// Canonical close-membership worker. Server-only — never import from a
// client-reachable file at module scope. Used by `closeMembership` (the
// admin server fn), `cancelAndDeleteMember` (back-compat shim),
// `deleteMyAccount` (member self-delete), the Stripe webhook self-cancel
// cleanup, and the dispute-lost handler.

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
  | "self_delete"
  | "chargeback_lost"
  | "stripe_uncollectible";

const REASON_LABEL: Record<CancelReason, string> = {
  admin_cancel_immediate: "cancelled by admin",
  admin_cancel_period_end: "cancelled by admin",
  admin_end_trial: "trial ended by admin",
  admin_delete: "removed by admin",
  member_request: "at your request",
  self_delete: "at your request",
  chargeback_lost: "closed following a payment dispute",
  stripe_uncollectible: "closed after payment could not be collected",
};

export interface CloseMembershipInput {
  user_id: string;
  mode: CloseMode;
  reason: CancelReason;
  notes?: string | null;
  /** 'admin:<uuid>', 'user:<uuid>', 'stripe_webhook', or 'dispute_lost'. */
  actor_id: string;
}

export interface CloseMembershipResult {
  ok: true;
  mode: CloseMode;
  cancelled: number;
  emailSent: boolean;
  emailError?: string;
  erasure: {
    piiErased: boolean;
    storageBucketsCleared: string[];
    storageBucketsFailed: string[];
  };
  partialFailures: string[];
}

/* ─────────────── Ops alerts ─────────────── */

type OpsSeverity = "info" | "medium" | "high";

async function insertOpsAlert(
  kind: string,
  severity: OpsSeverity,
  context: Record<string, unknown>,
): Promise<void> {
  try {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin.from("ops_alerts").insert({
      kind,
      severity,
      context: context as never,
    } as never);
  } catch (err) {
    console.warn(`[closeMembership] ops alert insert failed (${kind}):`, err);
  }
}

async function insertCancelOpsAlert(
  userId: string,
  reason: CancelReason,
  email: string | null,
  actor: string,
): Promise<void> {
  await insertOpsAlert(
    "payments.member_cancelled",
    reason === "chargeback_lost" ? "high" : "info",
    { user_id: userId, reason, email, actor },
  );
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

/* ─────────────── Reason → erasure mode ─────────────── */

function erasureModeFor(reason: CancelReason):
  | "full_self_delete"
  | "membership_closed"
  | "chargeback_lost" {
  if (reason === "self_delete") return "full_self_delete";
  if (reason === "chargeback_lost") return "chargeback_lost";
  return "membership_closed";
}

/* ─────────────── Marketing consent (Fix 3) ───────────────
 * Never force marketing_opt_in=true on close. Preserve the member's prior
 * preference from notification_preferences or the existing mailing list
 * row; default to false when unknown. */
async function resolveMarketingOptIn(
  userId: string,
  email: string,
): Promise<boolean> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  try {
    const { data: prefs } = await supabaseAdmin
      .from("notification_preferences")
      .select("marketing_opt_in")
      .eq("user_id", userId)
      .maybeSingle();
    if (prefs && typeof (prefs as any).marketing_opt_in === "boolean") {
      return (prefs as any).marketing_opt_in === true;
    }
  } catch (e) {
    console.warn("[closeMembership] notification_preferences lookup failed", e);
  }
  try {
    const { data: prior } = await supabaseAdmin
      .from("mailing_list_contacts")
      .select("marketing_opt_in")
      .ilike("email", email)
      .maybeSingle();
    if (prior && typeof (prior as any).marketing_opt_in === "boolean") {
      return (prior as any).marketing_opt_in === true;
    }
  } catch (e) {
    console.warn("[closeMembership] mailing_list_contacts lookup failed", e);
  }
  return false;
}

export async function _closeMembershipImpl(
  input: CloseMembershipInput,
): Promise<CloseMembershipResult> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const partialFailures: string[] = [];

  // Snapshot identity.
  const { data: authUser } = await supabaseAdmin.auth.admin.getUserById(input.user_id);
  const email = (authUser?.user?.email ?? "").toLowerCase().trim();
  if (!email) throw new Error("Member has no email on auth account");

  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("full_name")
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
    (profile as any)?.full_name ?? (profile as any)?.full_name ?? null;

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
    partialFailures.push("profile_hide");
  }

  /* ─── end_now_delete / delete_only ─── */

  const { createStripeClient } = await import("@/lib/billing/stripe.server");
  let cancelled = 0;
  if (effectiveMode === "end_now_delete") {
    for (const s of (subs ?? []) as any[]) {
      if (!s.stripe_subscription_id) continue;
      // Skip terminal statuses in Stripe.
      if (s.status && ["canceled", "incomplete_expired"].includes(s.status)) continue;
      try {
        const stripe = createStripeClient(
          (s.environment === "live" ? "live" : "sandbox") as StripeEnv,
        );
        await stripe.subscriptions.cancel(s.stripe_subscription_id);
        cancelled++;
      } catch (e: any) {
        // resource_missing / 404 → already gone, fine.
        if (e?.code === "resource_missing" || e?.statusCode === 404) continue;
        console.warn(
          "[closeMembership] stripe cancel failed",
          s.stripe_subscription_id,
          e,
        );
        partialFailures.push("stripe_cancel");
        await insertOpsAlert("payments.member_close_stripe_cancel_failed", "high", {
          user_id: input.user_id,
          reason: input.reason,
          actor: input.actor_id,
          stripe_subscription_id: s.stripe_subscription_id,
          error: e?.message ?? String(e),
        });
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
    partialFailures.push("retention_stamp");
  }

  // Archive contact (idempotent on email). Marketing consent preserved,
  // NEVER forced true.
  const marketingOptIn = await resolveMarketingOptIn(input.user_id, email);
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
          marketing_opt_in: marketingOptIn,
          source: "cancellation",
          deleted_at: new Date().toISOString(),
        } as never,
        { onConflict: "email" },
      );
  } catch (e) {
    console.warn("[closeMembership] archive failed", e);
    partialFailures.push("mailing_archive");
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
    partialFailures.push("bd_migration_detach");
  }

  // Email BEFORE delete (audit trail still has the email address).
  const emailRes = await sendCancellationEmail({
    to: email,
    fullName,
    reason: input.reason,
    userId: input.user_id,
  });
  if (!emailRes.ok) {
    partialFailures.push("email");
    await insertOpsAlert("payments.member_close_email_failed", "medium", {
      user_id: input.user_id,
      reason: input.reason,
      actor: input.actor_id,
      email,
      error: emailRes.error,
    });
  }

  // PII + storage erasure BEFORE auth delete.
  const { eraseClosedMemberData } = await import("./erase-member-data.server");
  const erasure = await eraseClosedMemberData(input.user_id, {
    erasureMode: erasureModeFor(input.reason),
  });
  if (!erasure.ok || erasure.storageBucketsFailed.length > 0 || !erasure.piiErased) {
    partialFailures.push("erasure");
    await insertOpsAlert("payments.member_close_storage_erasure_failed", "high", {
      user_id: input.user_id,
      reason: input.reason,
      actor: input.actor_id,
      pii_erased: erasure.piiErased,
      pii_error: erasure.piiError,
      buckets_failed: erasure.storageBucketsFailed,
      buckets_cleared: erasure.storageBucketsCleared,
    });
  }

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
        partial_failures: partialFailures,
      },
      _reason: input.notes ?? input.reason,
    } as never);
  } catch (e) {
    console.warn("[closeMembership] audit log failed", e);
    partialFailures.push("audit");
    await insertOpsAlert("payments.member_close_audit_failed", "medium", {
      user_id: input.user_id,
      reason: input.reason,
      actor: input.actor_id,
      error: (e as any)?.message ?? String(e),
    });
  }

  await insertCancelOpsAlert(input.user_id, input.reason, email, input.actor_id);

  if (partialFailures.length > 0) {
    await insertOpsAlert("payments.member_close_partial_failure", "high", {
      user_id: input.user_id,
      reason: input.reason,
      actor: input.actor_id,
      steps: partialFailures,
    });
  }

  return {
    ok: true,
    mode: effectiveMode,
    cancelled,
    emailSent: emailRes.ok,
    emailError: emailRes.error,
    erasure: {
      piiErased: erasure.piiErased,
      storageBucketsCleared: erasure.storageBucketsCleared,
      storageBucketsFailed: erasure.storageBucketsFailed,
    },
    partialFailures,
  };
}
