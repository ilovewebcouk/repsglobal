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

async function suspendMemberForDispute(opts: {
  userId: string;
  subscriptionId: string | null;
  stage: DisputeLifecycleStage;
  stripe: Stripe;
}): Promise<void> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

  const standing =
    opts.stage === "lost" ? "chargeback_lost" : "payment_disputed";

  // Flip standing on every live subscription for this user — they should not
  // count as an active paying member while disputed.
  await supabaseAdmin
    .from("subscriptions")
    .update({ payment_standing: standing } as never)
    .eq("user_id", opts.userId)
    .eq("environment", "live");

  // Cancel the related Stripe subscription so no further charges run.
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
}

async function liftSuspensionAfterWin(userId: string): Promise<void> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  // Mark standing as chargeback_won so admin sees the outcome, but do NOT
  // automatically reinstate the cancelled subscription — the member must
  // resubscribe explicitly. has_active_paid_membership() treats anything
  // != 'ok' as suspended, so this is intentional.
  await supabaseAdmin
    .from("subscriptions")
    .update({ payment_standing: "chargeback_won" } as never)
    .eq("user_id", userId)
    .eq("environment", "live")
    .eq("payment_standing", "payment_disputed");
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
    .select("display_name, full_name")
    .eq("id", opts.userId)
    .maybeSingle();
  const proName =
    ((profile?.display_name ?? profile?.full_name ?? "") as string)
      .toString()
      .split(" ")[0] || null;

  let templateName: string | null = null;
  if (opts.stage === "opened") templateName = "chargeback-received";
  else if (opts.stage === "won") templateName = "chargeback-resolved-won";
  else if (opts.stage === "lost") templateName = "chargeback-resolved-lost";
  if (!templateName) return;

  try {
    const { sendTransactionalEmailServer } = await import("@/lib/email/send.server");
    await sendTransactionalEmailServer({
      templateName,
      recipientEmail: email,
      idempotencyKey: `${templateName}:${opts.stripeDisputeId}`,
      templateData: {
        proName,
        amount: `£${(opts.amountPence / 100).toFixed(2)}`,
      },
    });
  } catch (err) {
    console.warn("[disputes] email send failed:", err);
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
  const { error: insertErr } = await supabaseAdmin
    .from("disputes")
    .insert({
      ...baseRow,
      funds_withdrawn_pence: fundsWithdrawn,
      funds_reinstated_pence: fundsReinstated,
    } as never);

  if (insertErr && (insertErr as { code?: string }).code === "23505") {
    // Already recorded — update and bump funds counters.
    const { data: existing } = await supabaseAdmin
      .from("disputes")
      .select("funds_withdrawn_pence, funds_reinstated_pence")
      .eq("stripe_dispute_id", dispute.id)
      .maybeSingle();
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
  if (userId && (stage === "opened" || stage === "lost")) {
    await suspendMemberForDispute({
      userId,
      subscriptionId,
      stage,
      stripe,
    });
  }
  if (userId && stage === "won") {
    await liftSuspensionAfterWin(userId);
  }

  if (stage === "opened" || stage === "won" || stage === "lost") {
    await sendDisputeEmail({
      userId,
      stage,
      amountPence,
      stripeDisputeId: dispute.id,
    });
  }

  // Touch payment_events.user_id for the dispute event we just processed so
  // the Member Timeline picks it up under the "payment" lane.
  // (The webhook will set processed_at after we return.)
  void env;
  return { userId };
}
