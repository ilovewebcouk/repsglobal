// Admin one-off: cancel a Stripe subscription by ID.
//
// Operator-confirmed surgical action — used to clean up duplicate / migration
// subscriptions that aren't in our local mirror but exist in Stripe. Stripe is
// the source of truth, so we cancel directly there.

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const schema = z.object({
  stripeSubscriptionId: z.string().min(8).regex(/^sub_/),
  env: z.enum(["sandbox", "live"]).default("live"),
  reason: z.string().trim().max(500).optional(),
});

export type CancelStripeSubResult = {
  ok: boolean;
  status: string;
  cancelledAt: number | null;
  customerId: string | null;
  message?: string;
};

export const adminCancelStripeSubscription = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => schema.parse(d))
  .handler(async ({ data, context }): Promise<CancelStripeSubResult> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // Admin gate
    const { data: isAdmin, error: roleErr } = await supabaseAdmin.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    if (roleErr) throw new Error(roleErr.message);
    if (!isAdmin) throw new Error("Forbidden");

    const { createStripeClient, getStripeErrorMessage } = await import(
      "@/lib/billing/stripe.server"
    );
    const stripe = createStripeClient(data.env);

    try {
      const sub = await stripe.subscriptions.cancel(data.stripeSubscriptionId, {
        invoice_now: false,
        prorate: false,
      });

      // Audit log (best-effort)
      try {
        await supabaseAdmin.from("admin_audit_log").insert({
          actor_id: context.userId,
          action: "stripe.subscription.cancel",
          target_table: "stripe_subscriptions",
          target_id: data.stripeSubscriptionId,
          reason: data.reason ?? null,
          after_state: {
            env: data.env,
            customer_id: typeof sub.customer === "string" ? sub.customer : null,
            status: sub.status,
          } as any,
        });
      } catch {
        /* audit best-effort */
      }

      // Re-sync local mirror if we have it
      try {
        await supabaseAdmin
          .from("subscriptions")
          .update({
            status: sub.status,
            cancel_at_period_end: sub.cancel_at_period_end ?? false,
            updated_at: new Date().toISOString(),
          })
          .eq("stripe_subscription_id", data.stripeSubscriptionId);
      } catch {
        /* mirror best-effort */
      }

      return {
        ok: true,
        status: sub.status,
        cancelledAt: sub.canceled_at ?? null,
        customerId: typeof sub.customer === "string" ? sub.customer : null,
      };
    } catch (err) {
      return {
        ok: false,
        status: "error",
        cancelledAt: null,
        customerId: null,
        message: getStripeErrorMessage(err),
      };
    }
  });

const listSchema = z.object({
  customerId: z.string().min(8).regex(/^cus_/),
  env: z.enum(["sandbox", "live"]).default("live"),
});

export type CustomerSubSummary = {
  id: string;
  status: string;
  cancelAtPeriodEnd: boolean;
  currentPeriodEnd: number | null;
  priceId: string | null;
  amountPence: number | null;
  interval: string | null;
};

export const adminListCustomerSubscriptions = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => listSchema.parse(d))
  .handler(async ({ data, context }): Promise<CustomerSubSummary[]> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: isAdmin } = await supabaseAdmin.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    if (!isAdmin) throw new Error("Forbidden");

    const { createStripeClient } = await import("@/lib/billing/stripe.server");
    const stripe = createStripeClient(data.env);

    const subs = await stripe.subscriptions.list({
      customer: data.customerId,
      status: "all",
      limit: 50,
    });

    return subs.data.map((s) => {
      const item = s.items?.data?.[0];
      return {
        id: s.id,
        status: s.status,
        cancelAtPeriodEnd: s.cancel_at_period_end ?? false,
        currentPeriodEnd: (s as any).current_period_end ?? null,
        priceId: item?.price?.id ?? null,
        amountPence: item?.price?.unit_amount ?? null,
        interval: item?.price?.recurring?.interval ?? null,
      };
    });
  });
