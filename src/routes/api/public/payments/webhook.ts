import { createFileRoute } from "@tanstack/react-router";
import type Stripe from "stripe";

import { lookupTierByPriceId } from "@/lib/billing/prices";
import { type StripeEnv, verifyWebhook } from "@/lib/billing/stripe.server";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "stripe-signature, content-type",
} as const;

async function reserveEventRow(event: { id: string; type: string }, raw: unknown): Promise<string | null> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const obj = (raw as { data?: { object?: Record<string, unknown> } }).data?.object ?? {};
  const customerId = typeof obj.customer === "string" ? (obj.customer as string) : null;
  let subscriptionId: string | null = null;
  if (typeof obj.subscription === "string") subscriptionId = obj.subscription as string;
  else if (obj.object === "subscription" && typeof obj.id === "string") subscriptionId = obj.id as string;

  const { data, error } = await supabaseAdmin
    .from("payment_events")
    .insert({
      stripe_event_id: event.id,
      event_type: event.type,
      payload: raw as object,
      stripe_customer_id: customerId,
      stripe_subscription_id: subscriptionId,
      processed_at: null,
      processing_error: null,
    } as never)
    .select("id")
    .single();

  if (error) {
    if ((error as { code?: string }).code === "23505") return null;
    throw error;
  }
  return (data as { id: string }).id;
}

async function finalizeEventRow(rowId: string, opts: { userId: string | null; processingError: string | null }) {
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

async function resolveUserId(opts: { customerId?: string | null; metadataUserId?: string | null }, stripe: Stripe) {
  if (opts.metadataUserId) return opts.metadataUserId;
  if (!opts.customerId) return null;
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data } = await supabaseAdmin
    .from("subscriptions")
    .select("user_id")
    .eq("stripe_customer_id", opts.customerId)
    .limit(1)
    .maybeSingle();
  if (data?.user_id) return data.user_id;
  try {
    const customer = await stripe.customers.retrieve(opts.customerId);
    if (!customer.deleted) {
      const meta = (customer as Stripe.Customer).metadata?.reps_user_id;
      if (meta) return meta;
    }
  } catch { /* ignore */ }
  return null;
}

function periodEndIso(sub: Stripe.Subscription): string | null {
  const cpe =
    (sub as unknown as { current_period_end?: number }).current_period_end ??
    sub.items.data[0]?.current_period_end ??
    null;
  return cpe ? new Date(cpe * 1000).toISOString() : null;
}

async function upsertSubscriptionFromStripe(sub: Stripe.Subscription, stripe: Stripe) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const customerId = typeof sub.customer === "string" ? sub.customer : sub.customer.id;
  const userId = await resolveUserId(
    { customerId, metadataUserId: sub.metadata?.reps_user_id ?? null },
    stripe,
  );
  if (!userId) throw new Error(`No REPS user found for Stripe customer ${customerId}`);

  const item = sub.items.data[0];
  // Prefer lookup_key (stable across sandbox/live) over the env-specific price.id.
  const priceLookup = item?.price.lookup_key ?? item?.price.id ?? null;
  const lookup = priceLookup ? lookupTierByPriceId(priceLookup) : null;
  const isLiveStatus = ["active", "trialing", "past_due", "unpaid"].includes(sub.status);

  const row = {
    user_id: userId,
    stripe_customer_id: customerId,
    stripe_subscription_id: sub.id,
    stripe_price_id: priceLookup,
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
  await supabaseAdmin.from("subscriptions").upsert(row as never, { onConflict: "user_id" });
  return userId;
}

function mapIdentityStatus(s: string | null | undefined, eventType: string): string {
  if (s === "verified" || eventType === "identity.verification_session.verified") return "approved";
  if (eventType === "identity.verification_session.canceled" || s === "canceled") return "rejected";
  if (s === "requires_input") return "needs_more_info";
  return "pending";
}

async function handleIdentityEvent(
  stripe: Stripe,
  event: { type: string; data: { object: unknown } },
  env: StripeEnv,
): Promise<void> {
  const vs = event.data.object as Stripe.Identity.VerificationSession;
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

  const { data: row, error: findErr } = await supabaseAdmin
    .from("identity_documents")
    .select("id, professional_id")
    .eq("stripe_vs_id", vs.id)
    .eq("environment", env)
    .maybeSingle();
  if (findErr) throw new Error(findErr.message);
  if (!row) return; // session not tracked in this env; ack and move on

  const mappedStatus = mapIdentityStatus(vs.status, event.type);
  const reason =
    vs.last_error?.reason ??
    (vs.last_error?.code ? `${vs.last_error.code}` : null);

  const patch: Record<string, unknown> = {
    stripe_status: vs.status,
    stripe_reason: reason,
    status: mappedStatus,
  };

  if (vs.status === "verified") {
    try {
      const full = await stripe.identity.verificationSessions.retrieve(vs.id, {
        expand: ["verified_outputs"],
      });
      const out = full.verified_outputs;
      if (out) {
        const name = [out.first_name, out.last_name].filter(Boolean).join(" ").trim();
        if (name) patch.name_on_doc = name;
        if (out.dob) {
          const { year, month, day } = out.dob;
          if (year && month && day) {
            patch.dob_on_doc = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
          }
        }
      }
    } catch {
      // best-effort enrichment
    }
  }

  if (mappedStatus === "approved" || mappedStatus === "rejected") {
    patch.reviewed_at = new Date().toISOString();
  }
  if (mappedStatus === "approved") {
    patch.admin_note = "Auto-approved by Stripe Identity";
  }

  const { error: upErr } = await supabaseAdmin
    .from("identity_documents")
    .update(patch as never)
    .eq("id", row.id);
  if (upErr) throw new Error(upErr.message);
}

export const Route = createFileRoute("/api/public/payments/webhook")({
  server: {
    handlers: {
      OPTIONS: async () => new Response(null, { status: 204, headers: CORS }),
      POST: async ({ request }) => {
        const rawEnv = new URL(request.url).searchParams.get("env");
        if (rawEnv !== "sandbox" && rawEnv !== "live") {
          console.error("[payments-webhook] invalid or missing env query parameter:", rawEnv);
          return new Response(JSON.stringify({ received: true, ignored: "invalid env" }), {
            status: 200,
            headers: { ...CORS, "Content-Type": "application/json" },
          });
        }
        const env: StripeEnv = rawEnv;

        let event: { id: string; type: string; data: { object: unknown } };
        try {
          event = await verifyWebhook(request, env);
        } catch (err) {
          const message = err instanceof Error ? err.message : "Invalid signature";
          console.error("[payments-webhook] signature verification failed:", message);
          return new Response(`Webhook Error: ${message}`, { status: 400, headers: CORS });
        }

        let rowId: string | null;
        try {
          rowId = await reserveEventRow(event, event);
        } catch (err) {
          const message = err instanceof Error ? err.message : String(err);
          console.error("[payments-webhook] failed to record event:", message);
          return new Response(`Webhook Error: ${message}`, { status: 500, headers: CORS });
        }
        if (rowId === null) {
          return new Response(JSON.stringify({ received: true, duplicate: true }), {
            status: 200,
            headers: { ...CORS, "Content-Type": "application/json" },
          });
        }

        const { createStripeClient } = await import("@/lib/billing/stripe.server");
        const stripe = createStripeClient(env);

        let userId: string | null = null;
        let processingError: string | null = null;

        try {
          switch (event.type) {
            case "checkout.session.completed": {
              const session = event.data.object as Stripe.Checkout.Session;
              if (session.mode === "subscription" && session.subscription) {
                const subId = typeof session.subscription === "string" ? session.subscription : session.subscription.id;
                const sub = await stripe.subscriptions.retrieve(subId);
                userId = await upsertSubscriptionFromStripe(sub, stripe);
              }
              break;
            }
            case "customer.subscription.created":
            case "customer.subscription.updated":
            case "customer.subscription.deleted": {
              const sub = event.data.object as Stripe.Subscription;
              userId = await upsertSubscriptionFromStripe(sub, stripe);
              break;
            }
            case "invoice.payment_succeeded":
            case "invoice.payment_failed": {
              const invoice = event.data.object as Stripe.Invoice;
              const subRef = (invoice as unknown as { subscription?: string | Stripe.Subscription }).subscription;
              const subId = typeof subRef === "string" ? subRef : subRef?.id;
              if (subId) {
                const sub = await stripe.subscriptions.retrieve(subId);
                userId = await upsertSubscriptionFromStripe(sub, stripe);
              }
              break;
            }
            case "identity.verification_session.created":
            case "identity.verification_session.processing":
            case "identity.verification_session.requires_input":
            case "identity.verification_session.verified":
            case "identity.verification_session.canceled": {
              await handleIdentityEvent(stripe, event, env);
              break;
            }
            default:
              break;
          }
        } catch (err) {
          processingError = err instanceof Error ? err.message : String(err);
          console.error(`[payments-webhook] error handling ${event.type}:`, processingError);
        }

        await finalizeEventRow(rowId, { userId, processingError });

        if (processingError) {
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
