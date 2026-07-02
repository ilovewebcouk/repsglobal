// Member-facing payment history (read-only). Pulls the imported Stripe
// charge history for the signed-in user — matches on user_id OR email,
// so users whose CSV row wasn't auto-linked still see their payments.
//
// Honours admin impersonation: when an admin is "viewing as" a
// professional, we resolve the IMPERSONATED user's id + email and scope
// the query to them. Without this, the service-role client used during
// impersonation would bypass RLS and return every payment in the table.
import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuthWithImpersonation } from "@/integrations/supabase/auth-middleware-impersonation";

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
  .middleware([requireSupabaseAuthWithImpersonation])
  .handler(async ({ context }): Promise<LegacyHistoryResult> => {
    const { userId, claims, isImpersonating } = context;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // Resolve the effective email for the user we're scoping to. When
    // impersonating, the JWT email belongs to the admin — we need the
    // target professional's email instead.
    let email: string | null = isImpersonating
      ? null
      : ((claims?.email as string | undefined)?.toLowerCase() ?? null);

    if (isImpersonating) {
      const { data: u } = await supabaseAdmin.auth.admin.getUserById(userId);
      email = u?.user?.email?.toLowerCase() ?? null;
    }

    // Always scope explicitly by user_id OR email — never rely on RLS,
    // because the impersonation middleware swaps in a service-role client.
    let query = supabaseAdmin
      .from("legacy_stripe_payments")
      .select(
        "charge_id, paid_at, amount_pence, currency, status, description, card_last4, card_brand, refunded_amount_pence",
      )
      .order("paid_at", { ascending: false })
      .limit(100);

    if (email) {
      query = query.or(`user_id.eq.${userId},email.ilike.${email}`);
    } else {
      query = query.eq("user_id", userId);
    }

    const { data: rows, error } = await query;
    if (error) throw new Error(error.message);

    let next_due_at: string | null = null;
    let next_due_amount_pence: number | null = null;
    let is_lifetime = false;

    if (email) {
      const { data: link } = await supabaseAdmin
        .from("legacy_stripe_link")
        .select("next_due_at, is_lifetime")
        .ilike("email", email)
        .maybeSingle();
      if (link) {
        next_due_at = link.next_due_at;
        is_lifetime = !!link.is_lifetime;
        // Per the Phase 2.0 launch rules: every legacy member rolls to
        // Core £34/yr on their next renewal. Lifetime members never
        // renew. The historical £34 / £29 / £97 amount is only used for
        // the launch-day honour window, not for the next-renewal display.
        next_due_amount_pence = is_lifetime ? null : 3400;
      }
    }

    return { rows: rows ?? [], next_due_at, next_due_amount_pence, is_lifetime };
  });
