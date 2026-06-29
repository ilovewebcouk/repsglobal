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
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const PRIORITY: Record<string, number> = {
  active: 5,
  trialing: 4,
  past_due: 3,
  unpaid: 3,
  incomplete: 2,
  canceled: 1,
};

export const resyncStripeMirror = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: isAdmin, error: roleErr } = await supabaseAdmin.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    if (roleErr) throw new Error(roleErr.message);
    if (!isAdmin) throw new Error("Forbidden");

    const { createStripeClient } = await import("@/lib/billing/stripe.server");
    const { lookupTierByPriceId } = await import("@/lib/billing/prices");
    const stripe = createStripeClient("live");

    // Map customer -> user_id from existing mirror so we can attach Stripe subs
    // back to REPs users without scanning auth.users.
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

    // Walk every Stripe subscription, pick the highest-priority one per user.
    type Best = {
      sub: import("stripe").default.Subscription;
      userId: string;
      customerId: string;
    };
    const bestByUser = new Map<string, Best>();
    let scanned = 0;
    for await (const sub of stripe.subscriptions.list({ status: "all", limit: 100 })) {
      scanned += 1;
      const customerId = typeof sub.customer === "string" ? sub.customer : sub.customer.id;
      const userId = customerToUser.get(customerId);
      if (!userId) continue;
      const existing = bestByUser.get(userId);
      const score = PRIORITY[sub.status] ?? 0;
      const existingScore = existing ? PRIORITY[existing.sub.status] ?? 0 : -1;
      if (!existing || score > existingScore) {
        bestByUser.set(userId, { sub, userId, customerId });
      }
    }

    let upserted = 0;
    const now = new Date().toISOString();
    for (const { sub, userId, customerId } of bestByUser.values()) {
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
            updated_at: now,
          } as never,
          { onConflict: "user_id,environment" },
        );
      if (!error) upserted += 1;
    }

    return { scanned, upserted, users: bestByUser.size };
  });
