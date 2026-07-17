// Admin — per-user live Stripe → mirror sync.
//
// Server-only helper. Called from Member 360's loader on every request so
// the workbench shows live Stripe data, not stale mirror rows. Cheap: one
// Stripe API call per customer the user is linked to (usually one).

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

const PRIORITY: Record<string, number> = {
  active: 5,
  trialing: 4,
  past_due: 3,
  unpaid: 3,
  incomplete: 2,
  canceled: 1,
};

export async function resyncUserFromStripe(
  userId: string,
  supabaseAdmin: SupabaseClient<Database>,
): Promise<{ scanned: number; upserted: number }> {
  // Gather every Stripe customer id we know for this user.
  const customerIds = new Set<string>();

  const { data: subRows } = await supabaseAdmin
    .from("subscriptions")
    .select("stripe_customer_id")
    .eq("user_id", userId)
    .eq("environment", "live")
    .not("stripe_customer_id", "is", null);
  for (const r of (subRows ?? []) as Array<{ stripe_customer_id: string | null }>) {
    if (r.stripe_customer_id) customerIds.add(r.stripe_customer_id);
  }

  const { data: setupRows } = await supabaseAdmin
    .from("billing_setup_tokens")
    .select("stripe_customer_id")
    .eq("user_id", userId)
    .not("stripe_customer_id", "is", null);
  for (const r of (setupRows ?? []) as Array<{ stripe_customer_id: string | null }>) {
    if (r.stripe_customer_id) customerIds.add(r.stripe_customer_id);
  }

  const { data: bdRow } = await supabaseAdmin
    .from("bd_member_seed")
    .select("migration_stripe_customer_id, migration_canonical_stripe_customer_id")
    .eq("claimed_user_id", userId)
    .maybeSingle();
  const bd = (bdRow as {
    migration_stripe_customer_id?: string | null;
    migration_canonical_stripe_customer_id?: string | null;
  } | null) ?? null;
  if (bd?.migration_stripe_customer_id) customerIds.add(bd.migration_stripe_customer_id);
  if (bd?.migration_canonical_stripe_customer_id) customerIds.add(bd.migration_canonical_stripe_customer_id);

  if (customerIds.size === 0) return { scanned: 0, upserted: 0 };

  const { createStripeClient } = await import("@/lib/billing/stripe.server");
  const { lookupTierByPriceId } = await import("@/lib/billing/prices");
  const stripe = createStripeClient("live");

  let scanned = 0;
  let best: { sub: import("stripe").default.Subscription; customerId: string } | null = null;
  for (const customerId of customerIds) {
    const subs = await stripe.subscriptions.list({
      customer: customerId,
      status: "all",
      limit: 20,
    });
    for (const sub of subs.data) {
      scanned += 1;
      const score = PRIORITY[sub.status] ?? 0;
      const bestScore = best ? PRIORITY[best.sub.status] ?? 0 : -1;
      if (!best || score > bestScore) {
        best = { sub, customerId };
      }
    }
  }

  if (!best) return { scanned, upserted: 0 };

  const sub = best.sub;
  const item = sub.items.data[0];
  const priceLookup = item?.price.lookup_key ?? item?.price.id ?? null;
  const lookup = priceLookup ? lookupTierByPriceId(priceLookup) : null;
  const isLive = ["active", "trialing", "past_due", "unpaid"].includes(sub.status);
  const cpe =
    (sub as unknown as { current_period_end?: number }).current_period_end ??
    (item as unknown as { current_period_end?: number })?.current_period_end ??
    null;

  const { error } = await supabaseAdmin
    .from("subscriptions")
    .upsert(
      {
        user_id: userId,
        stripe_customer_id: best.customerId,
        stripe_subscription_id: sub.id,
        stripe_price_id: priceLookup,
        tier: isLive && lookup ? lookup.tier : "free",
        billing_period: isLive && lookup ? lookup.period : null,
        status: sub.status,
        current_period_end: cpe ? new Date(cpe * 1000).toISOString() : null,
        cancel_at_period_end: sub.cancel_at_period_end ?? false,
        is_founding: lookup?.founding ?? false,
        migrated_from_bd:
          sub.metadata?.migrated_from === "bd_legacy" ||
          sub.metadata?.migrated_from === "bd",
        metadata: sub.metadata as unknown as object,
        environment: "live",
        updated_at: new Date().toISOString(),
      } as never,
      { onConflict: "user_id,environment" },
    );

  return { scanned, upserted: error ? 0 : 1 };
}
