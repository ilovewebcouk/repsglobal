// Admin — live Stripe re-sync.
//
// Pulls every subscription from Stripe (live mode) and upserts the local
// `public.subscriptions` mirror so /admin/billing tables reflect reality
// even when a webhook is delayed/missing. Triggered by the "Refresh"
// button on the Billing Console KPI strip.
//
// Conflict key is (user_id, environment) — same as the webhook handler —
// so a customer with multiple Stripe subs collapses to the highest-priority
// live one per user.
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const PRIORITY: Record<string, number> = {
  active: 5,
  trialing: 4,
  past_due: 3,
  unpaid: 3,
  incomplete: 2,
  canceled: 1,
};

async function assertAdmin(userId: string) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data: isAdmin, error } = await supabaseAdmin.rpc("has_role", {
    _user_id: userId,
    _role: "admin",
  });
  if (error) throw new Error(error.message);
  if (!isAdmin) throw new Error("Forbidden");
  return supabaseAdmin;
}

async function upsertSubToMirror(
  supabaseAdmin: Awaited<ReturnType<typeof assertAdmin>>,
  sub: import("stripe").default.Subscription,
  userId: string,
  customerId: string,
) {
  const { lookupTierByPriceId } = await import("@/lib/billing/prices");
  const item = sub.items.data[0];
  const priceLookup = item?.price.lookup_key ?? item?.price.id ?? null;
  const lookup = priceLookup ? lookupTierByPriceId(priceLookup) : null;
  const isLive = ["active", "trialing", "past_due", "unpaid"].includes(sub.status);
  const cpe =
    (sub as unknown as { current_period_end?: number }).current_period_end ??
    (item as unknown as { current_period_end?: number })?.current_period_end ??
    null;

  return supabaseAdmin
    .from("subscriptions")
    .upsert(
      {
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
        migrated_from_bd:
          sub.metadata?.migrated_from === "bd_legacy" ||
          sub.metadata?.migrated_from === "bd",
        metadata: sub.metadata as unknown as object,
        environment: "live",
        updated_at: new Date().toISOString(),
      } as never,
      { onConflict: "user_id,environment" },
    );
}

export const resyncStripeMirror = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const supabaseAdmin = await assertAdmin(context.userId);

    const { createStripeClient } = await import("@/lib/billing/stripe.server");
    const stripe = createStripeClient("live");

    const { data: existing } = await supabaseAdmin
      .from("subscriptions")
      .select("user_id, stripe_customer_id")
      .eq("environment", "live")
      .not("stripe_customer_id", "is", null);
    const customerToUser = new Map<string, string>();
    for (const r of (existing ?? []) as Array<{ user_id: string; stripe_customer_id: string | null }>) {
      if (r.stripe_customer_id && !customerToUser.has(r.stripe_customer_id)) {
        customerToUser.set(r.stripe_customer_id, r.user_id);
      }
    }

    type Best = { sub: import("stripe").default.Subscription; userId: string; customerId: string };
    const bestByUser = new Map<string, Best>();
    let scanned = 0;
    for await (const sub of stripe.subscriptions.list({ status: "all", limit: 100 })) {
      scanned += 1;
      const customerId = typeof sub.customer === "string" ? sub.customer : sub.customer.id;
      const userId = customerToUser.get(customerId);
      if (!userId) continue;
      const existingBest = bestByUser.get(userId);
      const score = PRIORITY[sub.status] ?? 0;
      const existingScore = existingBest ? PRIORITY[existingBest.sub.status] ?? 0 : -1;
      if (!existingBest || score > existingScore) {
        bestByUser.set(userId, { sub, userId, customerId });
      }
    }

    let upserted = 0;
    for (const { sub, userId, customerId } of bestByUser.values()) {
      const { error } = await upsertSubToMirror(supabaseAdmin, sub, userId, customerId);
      if (!error) upserted += 1;
    }
    return { scanned, upserted, users: bestByUser.size };
  });

// Per-user live resync — pulls every Stripe sub for this user's customer(s)
// and upserts the best one into the mirror. Cheap: one Stripe call per
// customer. Called from Member 360 on every page load so the workbench
// always shows live data.
export const resyncStripeMirrorForUser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ user_id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const supabaseAdmin = await assertAdmin(context.userId);

    // Find every Stripe customer id we know for this user (mirror first,
    // then BD seed fallback for legacy members not yet in the mirror).
    const customerIds = new Set<string>();
    const { data: subRows } = await supabaseAdmin
      .from("subscriptions")
      .select("stripe_customer_id")
      .eq("user_id", data.user_id)
      .eq("environment", "live")
      .not("stripe_customer_id", "is", null);
    for (const r of (subRows ?? []) as Array<{ stripe_customer_id: string | null }>) {
      if (r.stripe_customer_id) customerIds.add(r.stripe_customer_id);
    }
    const { data: bdRow } = await supabaseAdmin
      .from("bd_member_seed")
      .select("migration_stripe_customer_id, migration_canonical_stripe_customer_id")
      .eq("claimed_user_id", data.user_id)
      .maybeSingle();
    const bd = (bdRow as { migration_stripe_customer_id?: string | null; migration_canonical_stripe_customer_id?: string | null } | null) ?? null;
    if (bd?.migration_stripe_customer_id) customerIds.add(bd.migration_stripe_customer_id);
    if (bd?.migration_canonical_stripe_customer_id) customerIds.add(bd.migration_canonical_stripe_customer_id);

    if (customerIds.size === 0) return { scanned: 0, upserted: 0 };

    const { createStripeClient } = await import("@/lib/billing/stripe.server");
    const stripe = createStripeClient("live");

    let scanned = 0;
    let best: { sub: import("stripe").default.Subscription; customerId: string } | null = null;
    for (const customerId of customerIds) {
      const subs = await stripe.subscriptions.list({ customer: customerId, status: "all", limit: 20 });
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
    const { error } = await upsertSubToMirror(supabaseAdmin, best.sub, data.user_id, best.customerId);
    return { scanned, upserted: error ? 0 : 1 };
  });

