import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { getStripe } from "./stripe.server";
import { CHECKOUT_OFFERS, getCheckoutOffer, type BillingPeriod, type PurchasableTier, checkoutOfferForPriceId } from "../billing";

const checkoutInput = z.object({
  tier: z.enum(["verified", "pro"]),
  period: z.enum(["monthly", "annual"]),
}).superRefine((value, ctx) => {
  if (!getCheckoutOffer(value.tier, value.period)) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: "This billing option is not available" });
  }
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

    const tier = data.tier as PurchasableTier;
    const period = data.period as BillingPeriod;
    const offer = getCheckoutOffer(tier, period);
    if (!offer) throw new Error("This billing option is not available");

    const customerId = await getOrCreateCustomer({ userId, email });
    const origin = getOrigin();
    const stripe = getStripe();

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: customerId,
      line_items: [{ price: offer.priceId, quantity: 1 }],
      success_url: `${origin}/dashboard?billing=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/pricing?billing=cancelled`,
      allow_promotion_codes: true,
      payment_method_collection: "always",
      subscription_data: {
        ...(offer.trialDays > 0 ? { trial_period_days: offer.trialDays } : {}),
        metadata: {
          reps_user_id: userId,
          tier,
          billing_period: period,
          is_founding: String(offer.founding),
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

    const lookup = data.stripe_price_id ? checkoutOfferForPriceId(data.stripe_price_id) : null;
    return {
      tier: data.tier,
      billing_period: data.billing_period,
      status: data.status,
      current_period_end: data.current_period_end,
      cancel_at_period_end: data.cancel_at_period_end,
      is_founding: data.is_founding,
      display: lookup ? CHECKOUT_OFFERS[lookup.tier].display : null,
    };
  });

/**
 * Recovery path when a webhook is missed: pulls the latest subscription from
 * Stripe for the current user and upserts it into our `subscriptions` table.
 */
export const syncMySubscription = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { userId, claims } = context;
    const email = (claims.email as string | undefined) ?? null;
    const stripe = getStripe();

    const customerId = await getOrCreateCustomer({ userId, email });
    const subs = await stripe.subscriptions.list({
      customer: customerId,
      status: "all",
      limit: 1,
    });
    if (subs.data.length === 0) {
      return { synced: false, tier: "free" as const };
    }
    const sub = subs.data[0];
    const priceId = sub.items.data[0]?.price.id ?? null;
    const lookup = priceId ? checkoutOfferForPriceId(priceId) : null;
    const isLive = ["active", "trialing", "past_due", "unpaid"].includes(sub.status);
    const cpe =
      (sub as unknown as { current_period_end?: number }).current_period_end ??
      sub.items.data[0]?.current_period_end ??
      null;

    const row = {
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
      metadata: sub.metadata as unknown as object,
      updated_at: new Date().toISOString(),
    };

    const { data: existing } = await supabaseAdmin
      .from("subscriptions")
      .select("id")
      .eq("stripe_subscription_id", sub.id)
      .maybeSingle();

    if (existing) {
      await supabaseAdmin.from("subscriptions").update(row as never).eq("id", existing.id);
    } else {
      await supabaseAdmin.from("subscriptions").insert(row as never);
    }

    return { synced: true, tier: row.tier, status: row.status };
  });
