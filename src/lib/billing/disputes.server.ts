// Chargeback / dispute lifecycle — server logic.
//
// Stripe disputes are a separate concept from failed payments. A dispute means
// the cardholder has formally challenged a charge. While the dispute is open
// (or lost), the member is NOT in good financial standing:
//
//   - they are removed from "Active paying members" (subscriptions.payment_standing flips)
//   - their public "REPS Verified" trust badge is suppressed
//   - their Stripe subscription is cancelled immediately so no more charges run
//   - a Member Timeline entry is written via the `disputes` table
//   - a chargeback-received / -won / -lost email is sent
//
// Verification *evidence* (identity, qualifications, insurance) is never
// touched here — that record stands regardless of payment standing.

import type Stripe from "stripe";

import type { StripeEnv } from "./stripe.server";

export type DisputeLifecycleStage =
  | "opened"
  | "funds_withdrawn"
  | "funds_reinstated"
  | "won"
  | "lost";

function deriveStage(
  eventType: string,
  dispute: Stripe.Dispute,
): DisputeLifecycleStage {
  switch (eventType) {
    case "charge.dispute.funds_withdrawn":
      return "funds_withdrawn";
    case "charge.dispute.funds_reinstated":
      return "funds_reinstated";
    case "charge.dispute.closed":
      return dispute.status === "won" ? "won" : "lost";
    case "charge.dispute.created":
    case "charge.dispute.updated":
    default:
      return "opened";
  }
}

async function resolveUserForDispute(
  dispute: Stripe.Dispute,
  stripe: Stripe,
): Promise<{
  userId: string | null;
  subscriptionId: string | null;
  customerId: string | null;
}> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

  const customerId =
    typeof dispute.charge === "object" && dispute.charge && "customer" in dispute.charge
      ? (dispute.charge as Stripe.Charge).customer && typeof (dispute.charge as Stripe.Charge).customer === "string"
        ? ((dispute.charge as Stripe.Charge).customer as string)
        : null
      : null;

  const piId =
    typeof dispute.payment_intent === "string"
      ? dispute.payment_intent
      : dispute.payment_intent?.id ?? null;
  const chargeId =
    typeof dispute.charge === "string" ? dispute.charge : dispute.charge?.id ?? null;

  // Try to resolve customer/subscription via the charge if not already known.
  let resolvedCustomer = customerId;
  let resolvedSubscriptionId: string | null = null;
  if ((chargeId || piId) && !resolvedCustomer) {
    try {
      if (piId) {
        const pi = await stripe.paymentIntents.retrieve(piId);
        resolvedCustomer = (typeof pi.customer === "string" ? pi.customer : pi.customer?.id) ?? null;
      } else if (chargeId) {
        const ch = await stripe.charges.retrieve(chargeId);
        resolvedCustomer = (typeof ch.customer === "string" ? ch.customer : ch.customer?.id) ?? null;
      }
    } catch {
      // Best-effort; we'll still record what we have.
    }
  }

  // Find a Stripe subscription on the related invoice (if any).
  if (piId) {
    try {
      const pi = (await stripe.paymentIntents.retrieve(piId, {
        expand: ["invoice"],
      })) as unknown as { invoice?: string | { subscription?: string | { id?: string } | null } | null };
      const invoice = pi.invoice && typeof pi.invoice !== "string" ? pi.invoice : null;
      if (invoice) {
        const subRef = invoice.subscription;
        resolvedSubscriptionId =
          typeof subRef === "string" ? subRef : subRef?.id ?? null;
      }
    } catch {
      /* ignore */
    }
  }

  // Map customer -> user_id via subscriptions table.
  let userId: string | null = null;
  if (resolvedCustomer) {
    const { data } = await supabaseAdmin
      .from("subscriptions")
      .select("user_id, stripe_subscription_id")
      .eq("stripe_customer_id", resolvedCustomer)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    userId = (data as { user_id: string | null } | null)?.user_id ?? null;
    if (!resolvedSubscriptionId) {
      resolvedSubscriptionId =
        (data as { stripe_subscription_id: string | null } | null)?.stripe_subscription_id ??
        null;
    }
  }

  return {
    userId,
    subscriptionId: resolvedSubscriptionId,
    customerId: resolvedCustomer,
  };
}

// Effectively-permanent auth ban duration (Supabase requires an interval).
// 100 years is treated as "banned until an admin lifts it".
const DISPUTE_AUTH_BAN_DURATION = "876000h";

async function suspendMemberForDispute(opts: {
  userId: string;
  subscriptionId: string | null;
  disputeRowId: string | null;
  stage: DisputeLifecycleStage;
  stripe: Stripe;
}): Promise<void> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

  const standing =
    opts.stage === "lost" ? "chargeback_lost" : "payment_disputed";

  // 1. Flip standing (and link to dispute) on every live subscription for
  // this user — they should not count as an active paying member.
  const subUpdate: Record<string, unknown> = { payment_standing: standing };
  if (opts.disputeRowId) subUpdate.dispute_id = opts.disputeRowId;
  await supabaseAdmin
    .from("subscriptions")
    .update(subUpdate as never)
    .eq("user_id", opts.userId)
    .eq("environment", "live");

  // 2. Cancel the related Stripe subscription so no further charges run.
  if (opts.subscriptionId) {
    try {
      await opts.stripe.subscriptions.cancel(opts.subscriptionId, {
        invoice_now: false,
        prorate: false,
      });
    } catch (err) {
      console.warn("[disputes] stripe.subscriptions.cancel failed:", err);
    }
    await supabaseAdmin
      .from("subscriptions")
      .update({
        status: "canceled",
        cancel_at_period_end: false,
      } as never)
      .eq("stripe_subscription_id", opts.subscriptionId);
  }

  // 3. Hide the public professional profile — chargeback = presumed-bad-actor
  // until proven otherwise; the profile must not remain live.
  try {
    await supabaseAdmin
      .from("professionals")
      .update({
        is_published: false,
        unpublished_reason: "dispute_suspended",
        unpublished_at: new Date().toISOString(),
        suspended_at: new Date().toISOString(),
        suspension_reason: "payment_dispute",
      } as never)
      .eq("id", opts.userId);
  } catch (err) {
    console.warn("[disputes] profile hide failed:", err);
  }

  // 4. Ban the auth user so any active session is killed and new logins are
  // rejected until an admin lifts the ban (dispute won path lifts it).
  try {
    await supabaseAdmin.auth.admin.updateUserById(opts.userId, {
      ban_duration: DISPUTE_AUTH_BAN_DURATION,
    } as never);
  } catch (err) {
    console.warn("[disputes] auth ban failed:", err);
  }
}

async function liftSuspensionAfterWin(
  userId: string,
  disputeStripeId: string,
): Promise<void> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  // Mark standing as chargeback_won so admin sees the outcome, but do NOT
  // automatically reinstate the cancelled subscription — the member must
  // resubscribe explicitly.
  await supabaseAdmin
    .from("subscriptions")
    .update({ payment_standing: "chargeback_won" } as never)
    .eq("user_id", userId)
    .eq("environment", "live")
    .eq("payment_standing", "payment_disputed");

  // Lift the auth ban so they can log in and resubscribe.
  try {
    await supabaseAdmin.auth.admin.updateUserById(userId, {
      ban_duration: "none",
    } as never);
  } catch (err) {
    console.warn("[disputes] auth unban failed:", err);
  }

  // Clear the professional suspension flags. Profile stays unpublished — they
  // must resubscribe to relist — but the dispute-specific flags are gone so
  // support/admin sees a clean record.
  try {
    await supabaseAdmin
      .from("professionals")
      .update({
        suspended_at: null,
        suspension_reason: null,
      } as never)
      .eq("id", userId);
  } catch (err) {
    console.warn("[disputes] profile suspension clear failed:", err);
  }

  // Send resubscribe email with a link back to /pricing.
  try {
    const { data: authUser } = await supabaseAdmin.auth.admin.getUserById(userId);
    const email = authUser?.user?.email;
    if (email) {
      const { data: profile } = await supabaseAdmin
        .from("profiles")
        .select("full_name")
        .eq("id", userId)
        .maybeSingle();
      const proName =
        ((profile?.full_name ?? "") as string)
          .toString()
          .split(" ")[0] || null;
      const { sendTransactionalEmailServer } = await import("@/lib/email/send.server");
      await sendTransactionalEmailServer({
        templateName: "dispute-won-resubscribe",
        recipientEmail: email,
        idempotencyKey: `dispute-won-resubscribe:${disputeStripeId}`,
        templateData: { proName },
      });
    }
  } catch (err) {
    console.warn("[disputes] resubscribe email failed:", err);
  }
}

async function sendDisputeEmail(opts: {
  userId: string | null;
  stage: DisputeLifecycleStage;
  amountPence: number;
  stripeDisputeId: string;
}) {
  if (!opts.userId) return;
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data: authUser } = await supabaseAdmin.auth.admin.getUserById(opts.userId);
  const email = authUser?.user?.email;
  if (!email) return;
  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("full_name")
    .eq("id", opts.userId)
    .maybeSingle();
  const proName =
    ((profile?.full_name ?? "") as string)
      .toString()
      .split(" ")[0] || null;

  // Only "opened" fires a member-facing dispute email now. "won" is handled
  // by liftSuspensionAfterWin (dispute-won-resubscribe email). "lost" is
  // handled via _closeMembershipImpl in handlePlatformDispute (member-cancelled
  // email). This function is retained for the opened case only.
  if (opts.stage !== "opened") return;

  try {
    const { sendTransactionalEmailServer } = await import("@/lib/email/send.server");
    await sendTransactionalEmailServer({
      templateName: "chargeback-received",
      recipientEmail: email,
      idempotencyKey: `chargeback-received:${opts.stripeDisputeId}`,
      templateData: {
        proName,
        amount: `£${(opts.amountPence / 100).toFixed(2)}`,
      },
    });
  } catch (err) {
    console.warn("[disputes] email send failed:", err);
  }
}

async function insertOpsAlert(
  kind: string,
  severity: "info" | "warn" | "high" | "critical",
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
    console.warn(`[ops_alerts] insert ${kind} failed:`, err);
  }
}


/**
 * Entry point for the Stripe webhook. Handles platform (non-Connect) dispute
 * events end-to-end: records the dispute, suspends the member, cancels their
 * subscription, and sends the matching transactional email.
 */
export async function handlePlatformDispute(
  dispute: Stripe.Dispute,
  eventType: string,
  stripe: Stripe,
  env: StripeEnv,
): Promise<{ userId: string | null }> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const stage = deriveStage(eventType, dispute);
  const { userId, subscriptionId, customerId } = await resolveUserForDispute(
    dispute,
    stripe,
  );

  const amountPence =
    typeof dispute.amount === "number" ? dispute.amount : 0;
  const fundsWithdrawn =
    stage === "funds_withdrawn" ? amountPence : 0;
  const fundsReinstated =
    stage === "funds_reinstated" ? amountPence : 0;

  // Upsert dispute row (keyed by stripe_dispute_id).
  const baseRow: Record<string, unknown> = {
    stripe_dispute_id: dispute.id,
    stripe_charge_id:
      typeof dispute.charge === "string" ? dispute.charge : dispute.charge?.id ?? null,
    stripe_payment_intent_id:
      typeof dispute.payment_intent === "string"
        ? dispute.payment_intent
        : dispute.payment_intent?.id ?? null,
    stripe_subscription_id: subscriptionId,
    stripe_customer_id: customerId,
    user_id: userId,
    amount_pence: amountPence,
    currency: dispute.currency ?? "gbp",
    reason: dispute.reason ?? null,
    status: dispute.status ?? null,
    lifecycle_stage: stage,
    evidence_due_by: dispute.evidence_details?.due_by
      ? new Date(dispute.evidence_details.due_by * 1000).toISOString()
      : null,
    payload: dispute as unknown as object,
    updated_at: new Date().toISOString(),
  };
  if (stage === "won" || stage === "lost") {
    baseRow.closed_at = new Date().toISOString();
  }

  // Try insert first; on conflict, update and accumulate funds.
  const { data: inserted, error: insertErr } = await supabaseAdmin
    .from("disputes")
    .insert({
      ...baseRow,
      funds_withdrawn_pence: fundsWithdrawn,
      funds_reinstated_pence: fundsReinstated,
    } as never)
    .select("id")
    .maybeSingle();

  let disputeRowId: string | null =
    (inserted as { id?: string } | null)?.id ?? null;

  if (insertErr && (insertErr as { code?: string }).code === "23505") {
    // Already recorded — update and bump funds counters.
    const { data: existing } = await supabaseAdmin
      .from("disputes")
      .select("id, funds_withdrawn_pence, funds_reinstated_pence")
      .eq("stripe_dispute_id", dispute.id)
      .maybeSingle();
    disputeRowId =
      (existing as { id?: string } | null)?.id ?? disputeRowId;
    const existingWithdrawn =
      (existing as { funds_withdrawn_pence?: number } | null)
        ?.funds_withdrawn_pence ?? 0;
    const existingReinstated =
      (existing as { funds_reinstated_pence?: number } | null)
        ?.funds_reinstated_pence ?? 0;
    await supabaseAdmin
      .from("disputes")
      .update({
        ...baseRow,
        funds_withdrawn_pence: existingWithdrawn + fundsWithdrawn,
        funds_reinstated_pence: existingReinstated + fundsReinstated,
      } as never)
      .eq("stripe_dispute_id", dispute.id);
  } else if (insertErr) {
    throw insertErr;
  }

  // Business effects keyed off lifecycle stage.
  if (userId && stage === "opened") {
    await suspendMemberForDispute({
      userId,
      subscriptionId,
      disputeRowId,
      stage,
      stripe,
    });
    await sendDisputeEmail({
      userId,
      stage,
      amountPence,
      stripeDisputeId: dispute.id,
    });
    await insertOpsAlert("payments.dispute_opened", "high", {
      user_id: userId,
      dispute_id: disputeRowId,
      stripe_dispute_id: dispute.id,
      amount_pence: amountPence,
      evidence_due_by: baseRow.evidence_due_by ?? null,
    });
  }

  if (userId && stage === "lost") {
    // Dispute lost = same outcome as an immediate member cancel: full close,
    // auth-user delete, member-cancelled email. Skip the standalone
    // chargeback-resolved-lost email — it's redundant with the cancel email.
    try {
      const { _closeMembershipImpl } = await import(
        "@/lib/admin/close-membership.server"
      );
      await _closeMembershipImpl({
        user_id: userId,
        mode: "end_now_delete",
        reason: "chargeback_lost",
        notes: `Chargeback lost (dispute ${dispute.id})`,
        actor_id: "dispute_lost",
      });
    } catch (e: any) {
      if (!/no email on auth account/i.test(e?.message ?? "")) {
        console.warn("[disputes] lost-path close failed:", e?.message ?? e);
      }
    }
    await insertOpsAlert("payments.dispute_lost", "high", {
      user_id: userId,
      dispute_id: disputeRowId,
      stripe_dispute_id: dispute.id,
      amount_pence: amountPence,
    });
  }

  if (userId && stage === "won") {
    await liftSuspensionAfterWin(userId, dispute.id);
    await insertOpsAlert("payments.dispute_won", "info", {
      user_id: userId,
      dispute_id: disputeRowId,
      stripe_dispute_id: dispute.id,
      amount_pence: amountPence,
    });
  }

  if (stage === "funds_withdrawn" || stage === "funds_reinstated") {
    await insertOpsAlert(
      stage === "funds_withdrawn"
        ? "payments.dispute_funds_withdrawn"
        : "payments.dispute_funds_reinstated", "info",
      {
        user_id: userId,
        dispute_id: disputeRowId,
        stripe_dispute_id: dispute.id,
        amount_pence: amountPence,
      },
    );
  }

  // Touch payment_events.user_id for the dispute event we just processed so
  // the Member Timeline picks it up under the "payment" lane.
  // (The webhook will set processed_at after we return.)
  void env;
  return { userId };
}
