/**
 * Admin — Audit Stripe customers for a default saved payment method.
 *
 * For each stripe_customer_id, retrieve the customer, resolve their
 * "invoice default" or generic default payment method, and report:
 *   - has_pm: true/false
 *   - pm_brand / pm_last4 / pm_exp — for card PMs
 *   - last_paid_at — latest successful charge unix ts (used later as the
 *     billing_cycle_anchor when we create the £479/yr subscription).
 *
 * READ-ONLY. No writes, no charges. Safe to run against `live`.
 */
/* eslint-disable @typescript-eslint/no-explicit-any */

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

async function assertAdmin(ctx: { supabase: any; userId: string }) {
  const { data: isAdmin } = await ctx.supabase.rpc("has_role", {
    _user_id: ctx.userId,
    _role: "admin" as never,
  });
  if (!isAdmin) throw new Error("Forbidden: admin role required");
}

const Input = z.object({
  customer_ids: z
    .array(z.string().trim().regex(/^cus_[A-Za-z0-9]+$/))
    .min(1)
    .max(500),
  environment: z.enum(["sandbox", "live"]).default("live"),
});

export type PaymentMethodAuditRow = {
  stripe_customer_id: string;
  found: boolean;
  has_pm: boolean;
  pm_type?: string;
  pm_brand?: string;
  pm_last4?: string;
  pm_exp?: string; // "MM/YYYY"
  pm_id?: string;
  last_paid_at?: number | null; // unix seconds of latest successful charge
  last_paid_amount_pence?: number | null;
  last_paid_currency?: string;
  email?: string;
  error?: string;
};

export const auditProviderPaymentMethods = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw) => Input.parse(raw))
  .handler(async ({ data, context }): Promise<PaymentMethodAuditRow[]> => {
    await assertAdmin(context);

    const { createStripeClient } = await import("@/lib/billing/stripe.server");
    const stripe = createStripeClient(data.environment) as any;

    const out: PaymentMethodAuditRow[] = [];
    for (const customerId of data.customer_ids) {
      try {
        const customer = await stripe.customers.retrieve(customerId, {
          expand: [
            "invoice_settings.default_payment_method",
            "default_source",
          ],
        });

        if (!customer || customer.deleted) {
          out.push({
            stripe_customer_id: customerId,
            found: false,
            has_pm: false,
            error: "Customer not found or deleted.",
          });
          continue;
        }

        let pm: any =
          customer.invoice_settings?.default_payment_method ?? null;

        // Fall back to any card PM attached to the customer.
        if (!pm) {
          const pms = await stripe.paymentMethods.list({
            customer: customerId,
            type: "card",
            limit: 1,
          });
          pm = pms.data[0] ?? null;
        }

        // Fall back to legacy default_source (older Stripe cards on file).
        let legacyCard: any = null;
        if (!pm && customer.default_source && typeof customer.default_source === "object") {
          legacyCard = customer.default_source;
        }

        // Latest successful charge → treat as last-paid anchor.
        let last_paid_at: number | null = null;
        let last_paid_amount_pence: number | null = null;
        let last_paid_currency: string | undefined;
        try {
          const charges = await stripe.charges.list({
            customer: customerId,
            limit: 10,
          });
          const paid = (charges.data as any[])
            .filter((c) => c.status === "succeeded" && c.paid && !c.refunded)
            .sort((a, b) => (b.created ?? 0) - (a.created ?? 0))[0];
          if (paid) {
            last_paid_at = paid.created ?? null;
            last_paid_amount_pence = paid.amount ?? null;
            last_paid_currency = (paid.currency ?? "").toLowerCase();
          }
        } catch {
          // ignore charge-list errors; audit continues
        }

        const row: PaymentMethodAuditRow = {
          stripe_customer_id: customerId,
          found: true,
          has_pm: Boolean(pm || legacyCard),
          email: customer.email ?? undefined,
          last_paid_at,
          last_paid_amount_pence,
          last_paid_currency,
        };

        if (pm) {
          row.pm_id = pm.id;
          row.pm_type = pm.type;
          if (pm.type === "card" && pm.card) {
            row.pm_brand = pm.card.brand;
            row.pm_last4 = pm.card.last4;
            row.pm_exp = `${String(pm.card.exp_month).padStart(2, "0")}/${pm.card.exp_year}`;
          }
        } else if (legacyCard) {
          row.pm_id = legacyCard.id;
          row.pm_type = "card";
          row.pm_brand = legacyCard.brand;
          row.pm_last4 = legacyCard.last4;
          row.pm_exp = `${String(legacyCard.exp_month).padStart(2, "0")}/${legacyCard.exp_year}`;
        }

        out.push(row);
      } catch (e: any) {
        out.push({
          stripe_customer_id: customerId,
          found: false,
          has_pm: false,
          error: e?.message ?? "Stripe audit failed.",
        });
      }
    }
    return out;
  });
