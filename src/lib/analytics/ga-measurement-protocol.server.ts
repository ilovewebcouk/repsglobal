/**
 * Google Analytics 4 — Measurement Protocol.
 *
 * Fires server-side `purchase` events from the Stripe webhook so revenue is
 * recorded even when the browser tab closes before the /checkout/return page
 * loads. Runs on the Cloudflare Worker runtime (fetch only).
 *
 * Requires two env vars:
 *   GA4_MEASUREMENT_ID          — e.g. "G-JNSVN6QD87"
 *   GA4_MP_API_SECRET           — created in GA4 → Admin → Data streams → Measurement Protocol
 */

const ENDPOINT = "https://www.google-analytics.com/mp/collect";

export interface GaMpPurchaseInput {
  clientId: string | null;        // GA _ga cookie id, if we captured it
  userId?: string | null;         // Supabase user id, if known
  transactionId: string;          // Stripe subscription id / session id
  value: number;                  // amount in currency units (e.g. 34)
  currency: string;               // ISO 4217 (e.g. "GBP")
  tier: string;                   // "verified" | "pro"
  period: string;                 // "monthly" | "annual"
}

/** Fire-and-forget GA4 purchase event. Never throws — analytics must not
 * block webhook acknowledgement to Stripe. */
export async function sendGaPurchase(input: GaMpPurchaseInput): Promise<void> {
  const measurementId = process.env.GA4_MEASUREMENT_ID;
  const apiSecret = process.env.GA4_MP_API_SECRET;
  if (!measurementId || !apiSecret) return;

  // GA4 requires a client_id. If we never captured the browser cookie
  // (webhook without prior begin_checkout), synthesise a stable one from
  // the transaction so revenue still lands, attributed to a new visitor.
  const clientId = input.clientId ?? `srv.${input.transactionId}`;

  const body = {
    client_id: clientId,
    ...(input.userId ? { user_id: input.userId } : {}),
    non_personalized_ads: true,
    events: [
      {
        name: "purchase",
        params: {
          transaction_id: input.transactionId,
          value: input.value,
          currency: input.currency,
          items: [
            {
              item_id: `${input.tier}_${input.period}`,
              item_name: input.tier === "pro" ? "REPS Pro" : "REPS Core",
              item_category: input.tier,
              item_variant: input.period,
              price: input.value,
              quantity: 1,
            },
          ],
        },
      },
    ],
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
    console.warn("[ga4-mp] purchase send failed:", err);
  }
}
