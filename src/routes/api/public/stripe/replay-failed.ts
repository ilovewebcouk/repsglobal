import { createFileRoute } from "@tanstack/react-router";
import type Stripe from "stripe";

import { lookupTierByPriceId } from "@/lib/billing/prices";

/**
 * One-off replay endpoint for payment_events rows that failed processing
 * (typically because the Stripe key lacked subscription_read). Re-runs the
 * same upsert logic against Stripe with the current key.
 *
 * Guarded by the STRIPE_WEBHOOK_SECRET via x-replay-token header.
 * Delete this file after use.
 */
export const Route = createFileRoute("/api/public/stripe/replay-failed")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const secret = process.env.STRIPE_WEBHOOK_SECRET;
        const token = request.headers.get("x-replay-token");
        if (!secret || token !== secret) {
          return new Response("Forbidden", { status: 403 });
        }

        const { supabaseAdmin } = await import(
          "@/integrations/supabase/client.server"
        );
        const { getStripe } = await import("@/lib/billing/stripe.server");
        const stripe = getStripe();

        const { data: rows, error } = await supabaseAdmin
          .from("payment_events")
          .select("id, event_type, payload")
          .is("processed_at", null);
        if (error) {
          return Response.json({ ok: false, error: error.message }, { status: 500 });
        }

        const results: Array<{
          id: string;
          event_type: string;
          ok: boolean;
          error?: string;
          user_id?: string | null;
        }> = [];

        for (const row of (rows ?? []) as unknown as Array<{
          id: string;
          event_type: string;
          payload: Stripe.Event;
        }>) {
          const event = row.payload;
          let userId: string | null = null;
          let processingError: string | null = null;
          try {
            switch (event.type) {
              case "checkout.session.completed": {
                const session = event.data.object as Stripe.Checkout.Session;
                if (session.mode === "subscription" && session.subscription) {
                  const subId =
                    typeof session.subscription === "string"
                      ? session.subscription
                      : session.subscription.id;
                  const sub = await stripe.subscriptions.retrieve(subId);
                  userId = await upsertSubscription(sub);
                }
                break;
              }
              case "customer.subscription.created":
              case "customer.subscription.updated":
              case "customer.subscription.deleted": {
                const sub = event.data.object as Stripe.Subscription;
                userId = await upsertSubscription(sub);
                break;
              }
              case "invoice.payment_succeeded":
              case "invoice.payment_failed": {
                const invoice = event.data.object as Stripe.Invoice;
                const subRef = (
                  invoice as unknown as { subscription?: string | Stripe.Subscription }
                ).subscription;
                const subId = typeof subRef === "string" ? subRef : subRef?.id;
                if (subId) {
                  const sub = await stripe.subscriptions.retrieve(subId);
                  userId = await upsertSubscription(sub);
                }
                break;
              }
              default:
                break;
            }
          } catch (err) {
            processingError = err instanceof Error ? err.message : String(err);
          }

          await supabaseAdmin
            .from("payment_events")
            .update({
              user_id: userId,
              processed_at: processingError ? null : new Date().toISOString(),
              processing_error: processingError,
            } as never)
            .eq("id", row.id);

          results.push({
            id: row.id,
            event_type: row.event_type,
            ok: !processingError,
            error: processingError ?? undefined,
            user_id: userId,
          });
        }

        return Response.json({ ok: true, count: results.length, results });

        async function upsertSubscription(sub: Stripe.Subscription): Promise<string> {
          const customerId =
            typeof sub.customer === "string" ? sub.customer : sub.customer.id;
          const userId = await resolveUserId(customerId, sub.metadata?.reps_user_id ?? null);
          if (!userId) throw new Error(`No REPS user for customer ${customerId}`);

          const priceId = sub.items.data[0]?.price.id ?? null;
          const lookup = priceId ? lookupTierByPriceId(priceId) : null;
          const isLive = ["active", "trialing", "past_due", "unpaid"].includes(sub.status);
          const cpe =
            (sub as unknown as { current_period_end?: number }).current_period_end ??
            sub.items.data[0]?.current_period_end ??
            null;

          await supabaseAdmin.from("subscriptions").upsert(
            {
              user_id: userId,
              stripe_customer_id: customerId,
              stripe_subscription_id: sub.id,
              stripe_price_id: priceId,
              tier: isLive && lookup ? lookup.tier : "free",
              billing_period: isLive && lookup ? lookup.period : null,
              status: sub.status,
              current_period_end: cpe ? new Date(cpe * 1000).toISOString() : null,
              cancel_at_period_end: sub.cancel_at_period_end ?? false,
              is_founding: lookup?.founding ?? false,
              migrated_from_bd: sub.metadata?.migrated_from === "bd",
              metadata: sub.metadata as unknown as object,
              updated_at: new Date().toISOString(),
            } as never,
            { onConflict: "user_id" },
          );
          return userId;
        }

        async function resolveUserId(
          customerId: string | null,
          metadataUserId: string | null,
        ): Promise<string | null> {
          if (metadataUserId) return metadataUserId;
          if (!customerId) return null;
          const { data } = await supabaseAdmin
            .from("subscriptions")
            .select("user_id")
            .eq("stripe_customer_id", customerId)
            .limit(1)
            .maybeSingle();
          if (data?.user_id) return data.user_id;
          try {
            const customer = await stripe.customers.retrieve(customerId);
            if (!customer.deleted) {
              const meta = (customer as Stripe.Customer).metadata?.reps_user_id;
              if (meta) return meta;
            }
          } catch {
            /* ignore */
          }
          return null;
        }
      },
    },
  },
});
