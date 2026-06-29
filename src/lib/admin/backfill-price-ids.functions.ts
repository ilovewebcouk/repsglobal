// Backfill `subscriptions.stripe_price_id` with real Stripe price IDs.
//
// Why: during BD migration we stamped the internal lookup key
// ("verified_annual", "verified_legacy_annual") rather than the actual Stripe
// price ID (price_…). That breaks Stripe-mirror-style reconciliation. This
// function pages through subs whose stripe_price_id doesn't look like a real
// price ID, fetches the subscription from Stripe, reads
// items.data[0].price.id, and writes it back.
//
// Admin-gated. Dry-run by default.
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const InputSchema = z.object({
  dryRun: z.boolean().default(true),
  limit: z.number().int().min(1).max(500).default(50),
  environment: z.enum(["sandbox", "live"]).default("live"),
});

export type BackfillResult = {
  dryRun: boolean;
  environment: "sandbox" | "live";
  scanned: number;
  updated: number;
  unchanged: number;
  errors: number;
  rows: Array<{
    subscription_id: string;
    stripe_subscription_id: string;
    before: string | null;
    after: string | null;
    status: "updated" | "unchanged" | "would-update" | "error";
    error?: string;
  }>;
};

export const backfillSubscriptionPriceIds = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => InputSchema.parse(data ?? {}))
  .handler(async ({ data, context }): Promise<BackfillResult> => {
    const { supabase, userId } = context;
    const { data: isAdmin } = await supabase.rpc("has_role", {
      _user_id: userId,
      _role: "admin",
    });
    if (!isAdmin) throw new Response("Forbidden", { status: 403 });

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { createStripeClient } = await import("@/lib/billing/stripe.server");
    const stripe = createStripeClient(data.environment);

    // Target rows: have a stripe_subscription_id, but stripe_price_id is null
    // or doesn't start with "price_" (i.e. holds an internal lookup key).
    const { data: rows, error } = await supabaseAdmin
      .from("subscriptions")
      .select("id, stripe_subscription_id, stripe_price_id")
      .eq("environment", data.environment)
      .not("stripe_subscription_id", "is", null)
      .or("stripe_price_id.is.null,stripe_price_id.not.like.price\\_%")
      .limit(data.limit);

    if (error) throw new Response(`Query failed: ${error.message}`, { status: 500 });

    const result: BackfillResult = {
      dryRun: data.dryRun,
      environment: data.environment,
      scanned: rows?.length ?? 0,
      updated: 0,
      unchanged: 0,
      errors: 0,
      rows: [],
    };

    for (const row of rows ?? []) {
      const subId = row.stripe_subscription_id as string;
      try {
        const sub = await stripe.subscriptions.retrieve(subId);
        const realPriceId = sub.items.data[0]?.price?.id ?? null;
        const before = (row.stripe_price_id as string | null) ?? null;

        if (!realPriceId || realPriceId === before) {
          result.unchanged += 1;
          result.rows.push({
            subscription_id: row.id as string,
            stripe_subscription_id: subId,
            before,
            after: realPriceId,
            status: "unchanged",
          });
          continue;
        }

        if (data.dryRun) {
          result.rows.push({
            subscription_id: row.id as string,
            stripe_subscription_id: subId,
            before,
            after: realPriceId,
            status: "would-update",
          });
          continue;
        }

        const { error: updErr } = await supabaseAdmin
          .from("subscriptions")
          .update({ stripe_price_id: realPriceId, updated_at: new Date().toISOString() })
          .eq("id", row.id as string);
        if (updErr) throw new Error(updErr.message);

        result.updated += 1;
        result.rows.push({
          subscription_id: row.id as string,
          stripe_subscription_id: subId,
          before,
          after: realPriceId,
          status: "updated",
        });
      } catch (e) {
        result.errors += 1;
        result.rows.push({
          subscription_id: row.id as string,
          stripe_subscription_id: subId,
          before: (row.stripe_price_id as string | null) ?? null,
          after: null,
          status: "error",
          error: e instanceof Error ? e.message : String(e),
        });
      }
    }

    return result;
  });
