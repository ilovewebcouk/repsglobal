import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { CREDIT_PACKS, getCreditPack, type CreditPackKey } from "@/lib/billing";
import { getOrCreateCustomer } from "@/lib/billing/customer.server";

export type CreditWalletDTO = {
  balance: number;
  monthly_refill: number;
  refill_ceiling: number;
  last_refilled_at: string | null;
};

export type CreditTransactionDTO = {
  id: string;
  delta: number;
  action: string;
  balance_after: number;
  created_at: string;
};

export const getMyWallet = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<CreditWalletDTO> => {
    const { data, error } = await context.supabase
      .from("credit_wallets")
      .select("balance, monthly_refill, refill_ceiling, last_refilled_at")
      .eq("user_id", context.userId)
      .maybeSingle();
    if (error) throw error;
    return (
      data ?? {
        balance: 0,
        monthly_refill: 0,
        refill_ceiling: 0,
        last_refilled_at: null,
      }
    );
  });

export const listMyCreditTransactions = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<CreditTransactionDTO[]> => {
    const { data, error } = await context.supabase
      .from("credit_transactions")
      .select("id, delta, action, balance_after, created_at")
      .eq("user_id", context.userId)
      .order("created_at", { ascending: false })
      .limit(20);
    if (error) throw error;
    return (data ?? []) as CreditTransactionDTO[];
  });

const topupInput = z.object({
  pack: z.enum(["small", "medium", "large"]),
  environment: z.enum(["sandbox", "live"]),
});

export const createCreditTopupCheckout = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => topupInput.parse(data))
  .handler(async ({ data, context }): Promise<{ url: string } | { error: string }> => {
    try {
      const { userId, claims } = context;
      const email = (claims.email as string | undefined) ?? null;
      const pack = getCreditPack(data.pack as CreditPackKey);
      if (!pack) throw new Error("Unknown credit pack");

      const { createStripeClient, resolvePriceByLookupKey, getCheckoutOrigin, getStripeErrorMessage } =
        await import("@/lib/billing/stripe.server");
      const stripe = createStripeClient(data.environment);
      const customerId = await getOrCreateCustomer({ userId, email, environment: data.environment });
      const stripePrice = await resolvePriceByLookupKey(stripe, pack.priceId);
      const origin = getCheckoutOrigin();

      try {
        const session = await stripe.checkout.sessions.create({
          mode: "payment",
          customer: customerId,
          line_items: [{ price: stripePrice.id, quantity: 1 }],
          success_url: `${origin}/dashboard/settings?topup=success&session_id={CHECKOUT_SESSION_ID}`,
          cancel_url: `${origin}/dashboard/settings?topup=canceled`,
          payment_intent_data: {
            description: `REPs AI Credits — ${pack.label} (${pack.credits} credits)`,
          },
          custom_text: {
            submit: {
              message: `Top up ${pack.credits.toLocaleString()} REPs AI credits. Credits never expire and stack on top of your monthly allowance.`,
            },
          },
          metadata: {
            reps_user_id: userId,
            userId,
            kind: "credit_topup",
            pack: pack.key,
            credits: String(pack.credits),
            environment: data.environment,
          },
        });

        if (!session.url) throw new Error("Stripe did not return a checkout URL");
        return { url: session.url };
      } catch (err) {
        return { error: getStripeErrorMessage(err) };
      }
    } catch (err) {
      return { error: err instanceof Error ? err.message : "Could not start checkout" };
    }
  });

export const CREDIT_PACK_LIST = Object.values(CREDIT_PACKS);
