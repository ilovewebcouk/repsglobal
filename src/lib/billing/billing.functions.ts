import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { getStripe } from "./stripe.server";
import { PRICES, type BillingPeriod, type BillingTier, lookupTierByPriceId } from "./prices";

const checkoutInput = z.object({
  tier: z.enum(["verified", "pro", "studio"]),
  period: z.enum(["monthly", "annual"]),
});

function getOrigin(): string {
  const req = getRequest();
  return req?.headers.get("origin") || "https://repsglobal.lovable.app";
}

async function getOrCreateCustomer(opts: {
  userId: string;
  email: string | null | undefined;
}): Promise<string> {
  const { userId, email } = opts;
  const stripe = getStripe();

  // 1) Existing row in subscriptions?
  const { data: existing } = await supabaseAdmin
    .from("subscriptions")
    .select("stripe_customer_id")
    .eq("user_id", userId)
    .not("stripe_customer_id", "is", null)
    .limit(1)
    .maybeSingle();

  if (existing?.stripe_customer_id) return existing.stripe_customer_id;

  // 2) Customer with this email already in Stripe? (covers BD-migrated members)
  if (email) {
    const found = await stripe.customers.list({ email, limit: 1 });
    if (found.data.length > 0) return found.data[0].id;
  }

  // 3) Create new
  const created = await stripe.customers.create({
    email: email ?? undefined,
    metadata: { reps_user_id: userId },
  });
  return created.id;
}

export const createCheckoutSession = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => checkoutInput.parse(data))
  .handler(async ({ data, context }) => {
    const { userId, claims } = context;
    const email = (claims.email as string | undefined) ?? null;

    const tier = data.tier as BillingTier;
    const period = data.period as BillingPeriod;
    const price = PRICES[tier][period];

    const customerId = await getOrCreateCustomer({ userId, email });
    const origin = getOrigin();
    const stripe = getStripe();

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: customerId,
      line_items: [{ price: price.priceId, quantity: 1 }],
      success_url: `${origin}/dashboard?billing=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/pricing?billing=cancelled`,
      allow_promotion_codes: true,
      subscription_data: {
        metadata: {
          reps_user_id: userId,
          tier,
          billing_period: period,
          is_founding: String(price.founding),
        },
      },
      metadata: {
        reps_user_id: userId,
        tier,
        billing_period: period,
      },
    });

    return { url: session.url };
  });

export const createPortalSession = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { userId, claims } = context;
    const email = (claims.email as string | undefined) ?? null;
    const customerId = await getOrCreateCustomer({ userId, email });
    const stripe = getStripe();
    const origin = getOrigin();

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

    const { data } = await supabaseAdmin
      .from("subscriptions")
      .select(
        "tier, billing_period, status, current_period_end, cancel_at_period_end, is_founding, stripe_price_id, stripe_subscription_id"
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

    const lookup = data.stripe_price_id ? lookupTierByPriceId(data.stripe_price_id) : null;
    return {
      tier: data.tier,
      billing_period: data.billing_period,
      status: data.status,
      current_period_end: data.current_period_end,
      cancel_at_period_end: data.cancel_at_period_end,
      is_founding: data.is_founding,
      display: lookup ? PRICES[lookup.tier][lookup.period].display : null,
    };
  });
