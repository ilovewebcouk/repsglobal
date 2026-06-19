// Member-facing payment history (read-only). Pulls the imported Stripe
// charge history for the signed-in user — matches on user_id OR email,
// so users whose CSV row wasn't auto-linked still see their payments.
import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type LegacyPaymentRow = {
  charge_id: string;
  paid_at: string;
  amount_pence: number;
  currency: string;
  status: string;
  description: string | null;
  card_last4: string | null;
  card_brand: string | null;
  refunded_amount_pence: number;
};

export type LegacyHistoryResult = {
  rows: LegacyPaymentRow[];
  next_due_at: string | null;
  next_due_amount_pence: number | null;
  is_lifetime: boolean;
};

export const getMyLegacyPaymentHistory = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<LegacyHistoryResult> => {
    const { supabase, userId, claims } = context;
    const email = (claims?.email as string | undefined)?.toLowerCase() ?? null;

    // RLS already scopes rows to (user_id = auth.uid() OR lower(email) = auth.jwt email)
    const { data: rows, error } = await supabase
      .from("legacy_stripe_payments")
      .select(
        "charge_id, paid_at, amount_pence, currency, status, description, card_last4, card_brand, refunded_amount_pence",
      )
      .order("paid_at", { ascending: false })
      .limit(100);

    if (error) throw new Error(error.message);

    // Pull next-due / lifetime from legacy_stripe_link (admin-only RLS, so use
    // a service-role lookup keyed by this user's email).
    let next_due_at: string | null = null;
    let next_due_amount_pence: number | null = null;
    let is_lifetime = false;

    if (email) {
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      const { data: link } = await supabaseAdmin
        .from("legacy_stripe_link")
        .select("next_due_at, last_paid_amount_pence, is_lifetime")
        .ilike("email", email)
        .maybeSingle();
      if (link) {
        next_due_at = link.next_due_at;
        next_due_amount_pence = link.last_paid_amount_pence;
        is_lifetime = !!link.is_lifetime;
      }
    }

    void userId;
    return { rows: rows ?? [], next_due_at, next_due_amount_pence, is_lifetime };
  });
