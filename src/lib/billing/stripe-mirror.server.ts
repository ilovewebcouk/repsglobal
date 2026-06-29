// Stripe Mirror — canonical billing read API.
//
// SINGLE SOURCE OF TRUTH for "what does Stripe say about this customer / sub".
// Admin v2 pages funnel billing reads through this module instead of
// re-deriving from `subscriptions` rows. Supabase rows are still authoritative
// for identity (user_id ↔ stripe_customer_id mapping) but Stripe is the
// authority for money: status, price, period, item, cancel_at_period_end.
//
// This is a thin shim today. As Admin v2 is rebuilt, every billing surface
// (Members, Revenue, Member 360, Reconciliation) should import from here and
// retire ad-hoc Stripe calls scattered across the codebase.
//
// Server-only. Never import from client code.
import type Stripe from "stripe";
import { createStripeClient, type StripeEnv } from "./stripe.server";

export type MirrorSubscription = {
  stripe_subscription_id: string;
  stripe_customer_id: string;
  status: Stripe.Subscription.Status;
  cancel_at_period_end: boolean;
  current_period_start: string | null; // ISO
  current_period_end: string | null;   // ISO
  trial_end: string | null;            // ISO
  price_id: string | null;             // real Stripe price ID (e.g. price_…)
  price_lookup_key: string | null;
  product_id: string | null;
  unit_amount_pence: number | null;
  currency: string | null;
  interval: Stripe.Price.Recurring.Interval | null;
  interval_count: number | null;
  metadata: Record<string, string>;
  livemode: boolean;
};

function toIso(epoch: number | null | undefined): string | null {
  if (!epoch) return null;
  return new Date(epoch * 1000).toISOString();
}

function normalize(sub: Stripe.Subscription): MirrorSubscription {
  const item = sub.items.data[0];
  const price = item?.price ?? null;
  const product = price?.product;
  const productId = typeof product === "string" ? product : (product?.id ?? null);
  return {
    stripe_subscription_id: sub.id,
    stripe_customer_id: typeof sub.customer === "string" ? sub.customer : sub.customer.id,
    status: sub.status,
    cancel_at_period_end: sub.cancel_at_period_end,
    current_period_start: toIso((sub as any).current_period_start),
    current_period_end: toIso((sub as any).current_period_end),
    trial_end: toIso(sub.trial_end),
    price_id: price?.id ?? null,
    price_lookup_key: price?.lookup_key ?? null,
    product_id: productId,
    unit_amount_pence: price?.unit_amount ?? null,
    currency: price?.currency ?? null,
    interval: price?.recurring?.interval ?? null,
    interval_count: price?.recurring?.interval_count ?? null,
    metadata: { ...(sub.metadata ?? {}) },
    livemode: sub.livemode,
  };
}

/** Fetch a single subscription from Stripe and normalize. */
export async function getMirrorSubscription(
  subscriptionId: string,
  env: StripeEnv,
): Promise<MirrorSubscription | null> {
  const stripe = createStripeClient(env);
  try {
    const sub = await stripe.subscriptions.retrieve(subscriptionId, {
      expand: ["items.data.price.product"],
    });
    return normalize(sub);
  } catch (e: any) {
    if (e?.code === "resource_missing") return null;
    throw e;
  }
}

/** All subscriptions for a Stripe customer (any status). */
export async function listMirrorSubscriptionsForCustomer(
  customerId: string,
  env: StripeEnv,
): Promise<MirrorSubscription[]> {
  const stripe = createStripeClient(env);
  const out: MirrorSubscription[] = [];
  for await (const sub of stripe.subscriptions.list({
    customer: customerId,
    status: "all",
    expand: ["data.items.data.price.product"],
    limit: 100,
  })) {
    out.push(normalize(sub));
  }
  return out;
}

/**
 * Mirror a user's "primary" billing position from Stripe.
 * Lookup is by `subscriptions.stripe_customer_id` for the requested env.
 * Returns the most recently-created non-canceled sub, or the most recent of
 * any status if none are live.
 */
export async function getMirrorForUser(
  userId: string,
  env: StripeEnv,
): Promise<MirrorSubscription | null> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data } = await supabaseAdmin
    .from("subscriptions")
    .select("stripe_customer_id")
    .eq("user_id", userId)
    .eq("environment", env)
    .not("stripe_customer_id", "is", null)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const customerId = (data?.stripe_customer_id as string | null) ?? null;
  if (!customerId) return null;

  const subs = await listMirrorSubscriptionsForCustomer(customerId, env);
  if (!subs.length) return null;
  const live = subs.find((s) => s.status === "active" || s.status === "trialing" || s.status === "past_due");
  return live ?? subs[0];
}
