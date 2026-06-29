// Admin v2 — Member 360 read API.
//
// Stripe-mirror-first: returns identity + the live Stripe subscription snapshot
// for a single user. No reads from `legacy_stripe_link` or `bd_member_seed`.
// The detailed event timeline is served by `getMemberTimeline` and rendered
// alongside this snapshot in the Member 360 page.

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const Input = z.object({ user_id: z.string().uuid() });

export type Member360Snapshot = {
  user_id: string;
  email: string | null;
  full_name: string | null;
  stripe_customer_id: string | null;
  has_active_subscription: boolean;
  subscription: {
    id: string;
    status: string;
    tier: string | null;
    price_id: string | null;
    price_lookup_key: string | null;
    unit_amount_pence: number | null;
    currency: string | null;
    interval: string | null;
    interval_count: number | null;
    cancel_at_period_end: boolean;
    current_period_start: string | null;
    current_period_end: string | null;
    trial_end: string | null;
    livemode: boolean;
    metadata: Record<string, string>;
  } | null;
};

export const getMember360 = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => Input.parse(d))
  .handler(async ({ data, context }): Promise<Member360Snapshot> => {
    const { supabase, userId } = context;
    const { data: isAdmin } = await supabase.rpc("has_role", {
      _user_id: userId,
      _role: "admin",
    });
    if (!isAdmin) throw new Error("Forbidden");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { getMirrorForUser } = await import("@/lib/billing/stripe-mirror.server");

    const [authRes, profileRes] = await Promise.all([
      supabaseAdmin.auth.admin.getUserById(data.user_id),
      supabaseAdmin.from("profiles").select("full_name").eq("id", data.user_id).maybeSingle(),
    ]);

    const email = authRes.data?.user?.email ?? null;
    const full_name = (profileRes.data as { full_name?: string | null } | null)?.full_name ?? null;

    // Stripe mirror (live env). Sandbox is intentionally ignored — admin v2
    // surfaces the production billing state only.
    const mirror = await getMirrorForUser(data.user_id, "live").catch(() => null);

    // Tier from the local row (Stripe doesn't carry a "tier" concept directly).
    let tier: string | null = null;
    if (mirror) {
      const { data: sRow } = await supabaseAdmin
        .from("subscriptions")
        .select("tier")
        .eq("stripe_subscription_id", mirror.stripe_subscription_id)
        .maybeSingle();
      tier = (sRow as { tier?: string | null } | null)?.tier ?? null;
    }

    return {
      user_id: data.user_id,
      email,
      full_name,
      stripe_customer_id: mirror?.stripe_customer_id ?? null,
      has_active_subscription: !!mirror && ["active", "trialing", "past_due"].includes(mirror.status),
      subscription: mirror
        ? {
            id: mirror.stripe_subscription_id,
            status: mirror.status,
            tier,
            price_id: mirror.price_id,
            price_lookup_key: mirror.price_lookup_key,
            unit_amount_pence: mirror.unit_amount_pence,
            currency: mirror.currency,
            interval: mirror.interval ?? null,
            interval_count: mirror.interval_count,
            cancel_at_period_end: mirror.cancel_at_period_end,
            current_period_start: mirror.current_period_start,
            current_period_end: mirror.current_period_end,
            trial_end: mirror.trial_end,
            livemode: mirror.livemode,
            metadata: mirror.metadata,
          }
        : null,
    };
  });
