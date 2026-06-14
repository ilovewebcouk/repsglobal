import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import {
  CHECKOUT_OFFERS,
  getCheckoutOffer,
  type BillingPeriod,
  type PurchasableTier,
  checkoutOfferForPriceId,
} from "../billing";
import { getOrCreateCustomer } from "./customer.server";

const checkoutInput = z
  .object({
    tier: z.enum(["verified", "pro"]),
    period: z.enum(["monthly", "annual"]),
    environment: z.enum(["sandbox", "live"]),
  })
  .superRefine((value, ctx) => {
    if (!getCheckoutOffer(value.tier, value.period)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "This billing option is not available" });
    }
  });

export const createCheckoutSession = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => checkoutInput.parse(data))
  .handler(async ({ data, context }): Promise<{ url: string } | { error: string }> => {
    try {
      const { userId, claims } = context;
      const email = (claims.email as string | undefined) ?? null;

      const tier = data.tier as PurchasableTier;
      const period = data.period as BillingPeriod;
      const environment = data.environment;
      const offer = getCheckoutOffer(tier, period);
      if (!offer) throw new Error("This billing option is not available");

      const { createStripeClient, resolvePriceByLookupKey, getCheckoutOrigin, getStripeErrorMessage } =
        await import("./stripe.server");
      const stripe = createStripeClient(environment);
      const customerId = await getOrCreateCustomer({ userId, email, environment });
      const origin = getCheckoutOrigin();
      const stripePrice = await resolvePriceByLookupKey(stripe, offer.priceId);

      const submitMessage =
        tier === "verified"
          ? "You're joining the REPs Verified register — qualified, insured, and publicly listed worldwide."
          : offer.trialDays > 0
            ? `£0 today. Your ${offer.trialDays}-day free Pro trial starts the moment you confirm. Cancel any time from your REPs dashboard.`
            : "You're starting REPs Pro — every feature in your tier is included, no paid add-ons.";

      try {
        const session = await stripe.checkout.sessions.create({
          mode: "subscription",
          customer: customerId,
          line_items: [{ price: stripePrice.id, quantity: 1 }],
          success_url: `${origin}/checkout/return?session_id={CHECKOUT_SESSION_ID}`,
          cancel_url: `${origin}/pricing?checkout=canceled`,
          allow_promotion_codes: true,
          payment_method_collection: "always",
          custom_text: {
            submit: { message: submitMessage },
            terms_of_service_acceptance: {
              message: `I agree to the [REPs Terms](${origin}/terms) and [Privacy Policy](${origin}/privacy).`,
            },
          },
          consent_collection: { terms_of_service: "required" },
          subscription_data: {
            ...(offer.trialDays > 0 ? { trial_period_days: offer.trialDays } : {}),
            metadata: {
              reps_user_id: userId,
              tier,
              billing_period: period,
              is_founding: String(offer.founding),
              environment,
            },
          },
          metadata: {
            reps_user_id: userId,
            tier,
            billing_period: period,
            environment,
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

export const createPortalSession = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z.object({ environment: z.enum(["sandbox", "live"]) }).parse(data ?? {}),
  )
  .handler(async ({ data, context }) => {
    const { userId, claims } = context;
    const email = (claims.email as string | undefined) ?? null;
    const customerId = await getOrCreateCustomer({ userId, email, environment: data.environment });
    const { createStripeClient, getCheckoutOrigin } = await import("./stripe.server");
    const stripe = createStripeClient(data.environment);
    const origin = getCheckoutOrigin();

    const portal = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${origin}/dashboard`,
    });
    return { url: portal.url };
  });

export const getMySubscription = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { userId } = context;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // Latest row wins. With per-environment uniqueness a user may have
    // both a sandbox and a live row; in real-world production only the
    // live row exists, and ordering by updated_at keeps that behavior.
    const { data } = await supabaseAdmin
      .from("subscriptions")
      .select(
        "tier, billing_period, status, current_period_end, cancel_at_period_end, is_founding, stripe_price_id, stripe_subscription_id, environment",
      )
      .eq("user_id", userId)
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!data) {
      return {
        tier: "free" as const,
        billing_period: null,
        status: "none" as const,
        current_period_end: null,
        cancel_at_period_end: false,
        is_founding: false,
        display: null as string | null,
      };
    }

    const lookup = data.stripe_price_id ? checkoutOfferForPriceId(data.stripe_price_id) : null;
    return {
      tier: data.tier,
      billing_period: data.billing_period,
      status: data.status,
      current_period_end: data.current_period_end,
      cancel_at_period_end: data.cancel_at_period_end,
      is_founding: data.is_founding,
      display: lookup ? CHECKOUT_OFFERS[lookup.tier][lookup.period]?.display ?? null : null,
    };
  });

/**
 * Recovery path when a webhook is missed: pulls the latest subscription
 * from Stripe for the current user and upserts it into our
 * `subscriptions` table for the given environment.
 */
export const syncMySubscription = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z.object({ environment: z.enum(["sandbox", "live"]) }).parse(data ?? {}),
  )
  .handler(async ({ data, context }) => {
    const { userId, claims } = context;
    const email = (claims.email as string | undefined) ?? null;
    const [{ supabaseAdmin }, { createStripeClient }] = await Promise.all([
      import("@/integrations/supabase/client.server"),
      import("./stripe.server"),
    ]);
    const stripe = createStripeClient(data.environment);

    const customerId = await getOrCreateCustomer({ userId, email, environment: data.environment });
    const subs = await stripe.subscriptions.list({
      customer: customerId,
      status: "all",
      limit: 1,
    });
    if (subs.data.length === 0) {
      return { synced: false, tier: "free" as const };
    }
    const sub = subs.data[0];
    const item = sub.items.data[0];
    const priceLookup = item?.price.lookup_key ?? item?.price.id ?? null;
    const lookup = priceLookup ? checkoutOfferForPriceId(priceLookup) : null;
    const isLive = ["active", "trialing", "past_due", "unpaid"].includes(sub.status);
    const cpe =
      (sub as unknown as { current_period_end?: number }).current_period_end ??
      sub.items.data[0]?.current_period_end ??
      null;

    const row = {
      user_id: userId,
      stripe_customer_id: customerId,
      stripe_subscription_id: sub.id,
      stripe_price_id: priceLookup,
      tier: isLive && lookup ? lookup.tier : "free",
      billing_period: isLive && lookup ? lookup.period : null,
      status: sub.status,
      current_period_end: cpe ? new Date(cpe * 1000).toISOString() : null,
      cancel_at_period_end: sub.cancel_at_period_end ?? false,
      is_founding: lookup?.founding ?? false,
      environment: data.environment,
      metadata: sub.metadata as unknown as object,
      updated_at: new Date().toISOString(),
    };

    await supabaseAdmin
      .from("subscriptions")
      .upsert(row as never, { onConflict: "user_id,environment" });

    return { synced: true, tier: row.tier, status: row.status };
  });
