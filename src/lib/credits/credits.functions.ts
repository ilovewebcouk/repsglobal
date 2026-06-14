import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { CREDIT_PACKS, getCreditPack, type CreditPackKey } from "@/lib/billing";

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

function getOrigin(): string {
  const req = getRequest();
  return req?.headers.get("origin") || "https://repsglobal.lovable.app";
}

export const createCreditTopupCheckout = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => topupInput.parse(data))
  .handler(async ({ data, context }) => {
    const { userId, claims } = context;
    const email = (claims.email as string | undefined) ?? null;
    const pack = getCreditPack(data.pack as CreditPackKey);
    if (!pack) throw new Error("Unknown credit pack");

    const [{ supabaseAdmin }, { createStripeClient, resolvePriceByLookupKey }] =
      await Promise.all([
        import("@/integrations/supabase/client.server"),
        import("@/lib/billing/stripe.server"),
      ]);
    const stripe = createStripeClient(data.environment);

    // Resolve or create Stripe customer (re-use subscriptions row if present)
    const { data: existing } = await supabaseAdmin
      .from("subscriptions")
      .select("stripe_customer_id")
      .eq("user_id", userId)
      .not("stripe_customer_id", "is", null)
      .limit(1)
      .maybeSingle();
    let customerId = existing?.stripe_customer_id as string | undefined;
    if (!customerId && email) {
      const found = await stripe.customers.list({ email, limit: 1 });
      if (found.data.length) customerId = found.data[0].id;
    }
    if (!customerId) {
      const created = await stripe.customers.create({
        email: email ?? undefined,
        metadata: { reps_user_id: userId, userId },
      });
      customerId = created.id;
    }

    const stripePrice = await resolvePriceByLookupKey(stripe, pack.priceId);
    const origin = getOrigin();

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      ui_mode: "embedded_page",
      customer: customerId,
      line_items: [{ price: stripePrice.id, quantity: 1 }],
      return_url: `${origin}/dashboard/settings?topup=success&session_id={CHECKOUT_SESSION_ID}`,
      payment_intent_data: {
        description: `REPs AI Credits — ${pack.label} (${pack.credits} credits)`,
      },
      metadata: {
        reps_user_id: userId,
        userId,
        kind: "credit_topup",
        pack: pack.key,
        credits: String(pack.credits),
      },
    });

    return { clientSecret: session.client_secret ?? "" };
  });

export const CREDIT_PACK_LIST = Object.values(CREDIT_PACKS);
