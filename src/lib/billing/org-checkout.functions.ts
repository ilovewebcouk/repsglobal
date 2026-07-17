import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { ORG_TIERS } from "../billing";
import { getOrCreateCustomer } from "./customer.server";

/**
 * Auth-required Stripe checkout for the REPs Training Provider Membership
 * annual subscription — £479/yr, lookup key `training_provider_annual`. Mirrors
 * `createCheckoutSession` in ./billing.functions.ts but only supports the
 * single organisation tier that exists today.
 */

const inputSchema = z.object({
  environment: z.enum(["sandbox", "live"]),
  // GA4 client_id from the browser's _ga cookie — carried into Stripe metadata
  // so the webhook can attribute the server-side `purchase` event to the same
  // visitor session.
  gaClientId: z.string().max(64).nullable().optional(),
});

export const createOrgCheckoutSession = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => inputSchema.parse(data))
  .handler(async ({ data, context }): Promise<{ url: string } | { error: string }> => {
    try {
      const { userId, claims } = context;
      const email = (claims.email as string | undefined) ?? null;
      const environment = data.environment;

      const tier = ORG_TIERS.training_provider;

      const {
        createStripeClient,
        resolvePriceByLookupKey,
        getCheckoutOrigin,
        getStripeErrorMessage,
      } = await import("./stripe.server");

      const stripe = createStripeClient(environment);
      const customerId = await getOrCreateCustomer({ userId, email, environment });
      const origin = getCheckoutOrigin();
      const stripePrice = await resolvePriceByLookupKey(stripe, tier.stripePriceLookupKey);

      try {
        const session = await stripe.checkout.sessions.create({
          mode: "subscription",
          customer: customerId,
          line_items: [{ price: stripePrice.id, quantity: 1 }],
          success_url: `${origin}/checkout/return?session_id={CHECKOUT_SESSION_ID}`,
          cancel_url: `${origin}/training-providers?checkout=canceled`,
          allow_promotion_codes: true,
          payment_method_collection: "always",
          custom_text: {
            submit: {
              message:
                "You're joining REPs as a training provider — REPs will review your courses and issue certificates to every completing learner.",
            },
            terms_of_service_acceptance: {
              message: `I agree to the [REPs Terms](${origin}/terms) and [Privacy Policy](${origin}/privacy).`,
            },
          },
          consent_collection: { terms_of_service: "required" },
          subscription_data: {
            metadata: {
              reps_user_id: userId,
              tier: "training_provider",
              billing_period: "annual",
              environment,
              ...(data.gaClientId ? { ga_client_id: data.gaClientId } : {}),
            },
          },
          metadata: {
            reps_user_id: userId,
            tier: "training_provider",
            billing_period: "annual",
            environment,
            ...(data.gaClientId ? { ga_client_id: data.gaClientId } : {}),
          },
        });

        if (!session.url) throw new Error("Stripe did not return a checkout URL");
        return { url: session.url };
      } catch (err) {
        return { error: getStripeErrorMessage(err) };
      }
    } catch (err) {
      return { error: err instanceof Error ? err.message : "Could not start checkout" };
    }
  });
