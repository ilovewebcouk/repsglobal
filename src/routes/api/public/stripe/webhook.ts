import { createFileRoute } from "@tanstack/react-router";
import type Stripe from "stripe";

import { lookupTierByPriceId } from "@/lib/billing/prices";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "stripe-signature, content-type",
} as const;

/**
 * Insert a payment_events row immediately after signature verification.
 * Returns the inserted row id, or null if this event id has already been
 * recorded (UNIQUE constraint hit). The "insert first, process second" shape
 * closes the race window two concurrent webhook deliveries would otherwise
 * have if we selected first and inserted last.
 */
async function reserveEventRow(event: Stripe.Event): Promise<string | null> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const obj = event.data.object as unknown as Record<string, unknown>;
  const customerId = typeof obj.customer === "string" ? (obj.customer as string) : null;
  let subscriptionId: string | null = null;
  if (typeof obj.subscription === "string") {
    subscriptionId = obj.subscription as string;
  } else if (obj.object === "subscription" && typeof obj.id === "string") {
    subscriptionId = obj.id as string;
  }

  const { data, error } = await supabaseAdmin
    .from("payment_events")
    .insert({
      stripe_event_id: event.id,
      event_type: event.type,
      payload: event as unknown as object,
      stripe_customer_id: customerId,
      stripe_subscription_id: subscriptionId,
      processed_at: null,
      processing_error: null,
    } as never)
    .select("id")
    .single();

  if (error) {
    // 23505 = unique_violation on stripe_event_id → duplicate delivery.
    if ((error as { code?: string }).code === "23505") return null;
    throw error;
  }
  return (data as { id: string }).id;
}

async function finalizeEventRow(
  rowId: string,
  opts: { userId: string | null; processingError: string | null },
): Promise<void> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  await supabaseAdmin
    .from("payment_events")
    .update({
      user_id: opts.userId,
      processed_at: opts.processingError ? null : new Date().toISOString(),
      processing_error: opts.processingError,
    } as never)
    .eq("id", rowId);
}

async function resolveUserId(opts: {
  customerId?: string | null;
  metadataUserId?: string | null;
}): Promise<string | null> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  if (opts.metadataUserId) return opts.metadataUserId;
  if (!opts.customerId) return null;

  const { data } = await supabaseAdmin
    .from("subscriptions")
    .select("user_id")
    .eq("stripe_customer_id", opts.customerId)
    .limit(1)
    .maybeSingle();

  if (data?.user_id) return data.user_id;

  // Fallback: ask Stripe for the customer's metadata.reps_user_id
  try {
    const { getStripe } = await import("@/lib/billing/stripe.server");
    const stripe = getStripe();
    const customer = await stripe.customers.retrieve(opts.customerId);
    if (!customer.deleted) {
      const meta = (customer as Stripe.Customer).metadata?.reps_user_id;
      if (meta) return meta;
    }
  } catch {
    /* ignore */
  }
  return null;
}

function periodEndIso(sub: Stripe.Subscription): string | null {
  const cpe =
    (sub as unknown as { current_period_end?: number }).current_period_end ??
    sub.items.data[0]?.current_period_end ??
    null;
  return cpe ? new Date(cpe * 1000).toISOString() : null;
}

async function upsertSubscriptionFromStripe(sub: Stripe.Subscription) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const customerId = typeof sub.customer === "string" ? sub.customer : sub.customer.id;
  const userId = await resolveUserId({
    customerId,
    metadataUserId: sub.metadata?.reps_user_id ?? null,
  });
  if (!userId) {
    throw new Error(`No REPS user found for Stripe customer ${customerId}`);
  }

  const priceId = sub.items.data[0]?.price.id ?? null;
  const lookup = priceId ? lookupTierByPriceId(priceId) : null;

  // If subscription is canceled/incomplete_expired etc, drop the user back to free tier.
  const isLiveStatus = ["active", "trialing", "past_due", "unpaid"].includes(sub.status);

  const row = {
    user_id: userId,
    stripe_customer_id: customerId,
    stripe_subscription_id: sub.id,
    stripe_price_id: priceId,
    tier: isLiveStatus && lookup ? lookup.tier : "free",
    billing_period: isLiveStatus && lookup ? lookup.period : null,
    status: sub.status,
    current_period_end: periodEndIso(sub),
    cancel_at_period_end: sub.cancel_at_period_end ?? false,
    is_founding: lookup?.founding ?? false,
    migrated_from_bd: sub.metadata?.migrated_from === "bd",
    metadata: sub.metadata as unknown as object,
    updated_at: new Date().toISOString(),
  };

  // subscriptions.user_id is UNIQUE — there is exactly one row per user.
  // Upserting by user_id cleanly handles resubscribe-after-cancel: the prior
  // row is overwritten with the new stripe_subscription_id, no stale rows
  // accumulate, and getMySubscription no longer needs updated_at ordering.
  await supabaseAdmin
    .from("subscriptions")
    .upsert(row as never, { onConflict: "user_id" });

  return userId;
}

export const Route = createFileRoute("/api/public/stripe/webhook")({
  server: {
    handlers: {
      OPTIONS: async () => new Response(null, { status: 204, headers: CORS }),

      POST: async ({ request }) => {
        const secret = process.env.STRIPE_WEBHOOK_SECRET;
        if (!secret) {
          return new Response("Webhook secret not configured", { status: 500, headers: CORS });
        }

        const signature = request.headers.get("stripe-signature");
        if (!signature) {
          return new Response("Missing stripe-signature", { status: 400, headers: CORS });
        }

        const rawBody = await request.text();
        const { getStripe } = await import("@/lib/billing/stripe.server");
        const stripe = getStripe();

        let event: Stripe.Event;
        try {
          event = await stripe.webhooks.constructEventAsync(rawBody, signature, secret);
        } catch (err) {
          const message = err instanceof Error ? err.message : "Invalid signature";
          console.error("[stripe-webhook] signature verification failed:", message);
          return new Response(`Webhook Error: ${message}`, { status: 400, headers: CORS });
        }

        // Atomic idempotency lock: insert payment_events row first; the
        // UNIQUE(stripe_event_id) constraint rejects duplicate deliveries.
        let rowId: string | null;
        try {
          rowId = await reserveEventRow(event);
        } catch (err) {
          const message = err instanceof Error ? err.message : String(err);
          console.error("[stripe-webhook] failed to record event:", message);
          return new Response(`Webhook Error: ${message}`, { status: 500, headers: CORS });
        }

        if (rowId === null) {
          return new Response(JSON.stringify({ received: true, duplicate: true }), {
            status: 200,
            headers: { ...CORS, "Content-Type": "application/json" },
          });
        }

        let userId: string | null = null;
        let processingError: string | null = null;

        try {
          switch (event.type) {
            case "checkout.session.completed": {
              const session = event.data.object as Stripe.Checkout.Session;
              if (session.mode === "subscription" && session.subscription) {
                const subId = typeof session.subscription === "string" ? session.subscription : session.subscription.id;
                const sub = await stripe.subscriptions.retrieve(subId);
                userId = await upsertSubscriptionFromStripe(sub);
              }
              break;
            }
            case "customer.subscription.created":
            case "customer.subscription.updated":
            case "customer.subscription.deleted": {
              const sub = event.data.object as Stripe.Subscription;
              userId = await upsertSubscriptionFromStripe(sub);
              break;
            }
            case "invoice.payment_succeeded":
            case "invoice.payment_failed": {
              const invoice = event.data.object as Stripe.Invoice;
              const subRef = (invoice as unknown as { subscription?: string | Stripe.Subscription }).subscription;
              const subId = typeof subRef === "string" ? subRef : subRef?.id;
              if (subId) {
                const sub = await stripe.subscriptions.retrieve(subId);
                userId = await upsertSubscriptionFromStripe(sub);
              }
              break;
            }
            case "identity.verification_session.verified":
            case "identity.verification_session.requires_input":
            case "identity.verification_session.processing":
            case "identity.verification_session.canceled":
            case "identity.verification_session.created": {
              await handleIdentityEvent(stripe, event);
              break;
            }
            default:
              // No-op for unhandled events; the row stays for audit.
              break;
          }

        } catch (err) {
          processingError = err instanceof Error ? err.message : String(err);
          console.error(`[stripe-webhook] error handling ${event.type}:`, processingError);
        }

        await finalizeEventRow(rowId, { userId, processingError });

        if (processingError) {
          // 500 makes Stripe retry; signature was valid so this is a processing failure.
          return new Response(JSON.stringify({ received: true, error: processingError }), {
            status: 500,
            headers: { ...CORS, "Content-Type": "application/json" },
          });
        }

        return new Response(JSON.stringify({ received: true }), {
          status: 200,
          headers: { ...CORS, "Content-Type": "application/json" },
        });
      },
    },
  },
});
