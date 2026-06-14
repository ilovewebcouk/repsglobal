import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

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
  metadata: Record<string, unknown> | null;
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
      .select("id, delta, action, balance_after, created_at, metadata")
      .eq("user_id", context.userId)
      .order("created_at", { ascending: false })
      .limit(20);
    if (error) throw error;
    return (data ?? []) as CreditTransactionDTO[];
  });
