/**
 * Google Analytics 4 — Measurement Protocol.
 *
 * Fires server-side events (purchase, refund, subscription lifecycle) from
 * the Stripe webhook so revenue and churn are recorded even when the browser
 * tab is closed. Runs on the Cloudflare Worker runtime (fetch only).
 *
 * Requires two env vars:
 *   GA4_MEASUREMENT_ID   — e.g. "G-JNSVN6QD87"
 *   GA4_MP_API_SECRET    — GA4 → Admin → Data streams → Measurement Protocol
 */

const ENDPOINT = "https://www.google-analytics.com/mp/collect";

interface GaMpEventEnvelope {
  clientId: string | null;
  userId?: string | null;
  transactionId?: string | null; // used to synthesise clientId when missing
  eventName: string;
  params: Record<string, unknown>;
}

/** Low-level fire-and-forget send. Never throws. */
async function sendGaEvent(envelope: GaMpEventEnvelope): Promise<void> {
  const measurementId = process.env.GA4_MEASUREMENT_ID;
  const apiSecret = process.env.GA4_MP_API_SECRET;
  if (!measurementId || !apiSecret) return;

  const clientId =
    envelope.clientId ??
    (envelope.transactionId ? `srv.${envelope.transactionId}` : `srv.${crypto.randomUUID()}`);

  const body = {
    client_id: clientId,
    ...(envelope.userId ? { user_id: envelope.userId } : {}),
    non_personalized_ads: true,
    events: [{ name: envelope.eventName, params: envelope.params }],
  };

  try {
    await fetch(
      `${ENDPOINT}?measurement_id=${encodeURIComponent(measurementId)}&api_secret=${encodeURIComponent(apiSecret)}`,
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      },
    );
  } catch (err) {
    console.warn(`[ga4-mp] ${envelope.eventName} send failed:`, err);
  }
}

// ─────────────────────────────────────────────────────────────
// Purchase / refund (GA4 ecommerce)
// ─────────────────────────────────────────────────────────────

export interface GaMpPurchaseInput {
  clientId: string | null;
  userId?: string | null;
  transactionId: string;
  value: number;
  currency: string;
  tier: string;   // "verified" | "pro"
  period: string; // "monthly" | "annual"
}

function itemFor(tier: string, period: string, value: number) {
  return {
    item_id: `${tier}_${period}`,
    item_name: tier === "pro" ? "REPS Pro" : "REPS Core",
    item_category: tier,
    item_variant: period,
    price: value,
    quantity: 1,
  };
}

/** GA4 `purchase` — fires on first paid subscription creation. */
export async function sendGaPurchase(input: GaMpPurchaseInput): Promise<void> {
  return sendGaEvent({
    clientId: input.clientId,
    userId: input.userId,
    transactionId: input.transactionId,
    eventName: "purchase",
    params: {
      transaction_id: input.transactionId,
      value: input.value,
      currency: input.currency,
      tier: input.tier,
      plan_period: input.period,
      items: [itemFor(input.tier, input.period, input.value)],
    },
  });
}

export interface GaMpRefundInput {
  clientId: string | null;
  userId?: string | null;
  transactionId: string;         // Stripe charge / subscription id
  value: number;                 // refunded amount in currency units
  currency: string;
  tier?: string | null;
  period?: string | null;
  isFull: boolean;
}

/** GA4 `refund` — nets revenue back out. Include items[] for full refunds. */
export async function sendGaRefund(input: GaMpRefundInput): Promise<void> {
  const tier = input.tier ?? "verified";
  const period = input.period ?? "annual";
  return sendGaEvent({
    clientId: input.clientId,
    userId: input.userId,
    transactionId: input.transactionId,
    eventName: "refund",
    params: {
      transaction_id: input.transactionId,
      value: input.value,
      currency: input.currency,
      tier,
      plan_period: period,
      refund_type: input.isFull ? "full" : "partial",
      ...(input.isFull ? { items: [itemFor(tier, period, input.value)] } : {}),
    },
  });
}

// ─────────────────────────────────────────────────────────────
// Subscription lifecycle (custom SaaS events)
// ─────────────────────────────────────────────────────────────

export type GaLifecycleEvent =
  | "subscription_started"
  | "subscription_renewed"
  | "subscription_cancelled"
  | "subscription_reactivated"
  | "trial_started"
  | "trial_converted"
  | "payment_failed";

export interface GaMpLifecycleInput {
  clientId: string | null;
  userId?: string | null;
  event: GaLifecycleEvent;
  subscriptionId: string;
  tier: string;
  period: string;
  value?: number;                 // present for money-moving events
  currency?: string;
  cancelReason?: string | null;   // for subscription_cancelled
}

/** Fire a subscription lifecycle event. Server-side only. */
export async function sendGaLifecycle(input: GaMpLifecycleInput): Promise<void> {
  const params: Record<string, unknown> = {
    subscription_id: input.subscriptionId,
    tier: input.tier,
    plan_period: input.period,
  };
  if (typeof input.value === "number") params.value = input.value;
  if (input.currency) params.currency = input.currency;
  if (input.cancelReason) params.cancel_reason = input.cancelReason;
  return sendGaEvent({
    clientId: input.clientId,
    userId: input.userId,
    transactionId: input.subscriptionId,
    eventName: input.event,
    params,
  });
}
