// Universal member finder. Accepts email, user id (uuid), Stripe customer id
// (`cus_…`), Stripe subscription id (`sub_…`), BD member id, or partial name.
// Admin-only.

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

async function assertAdmin(ctx: { supabase: unknown; userId: string }) {
  const supa = ctx.supabase as { rpc: (n: string, p: object) => Promise<{ data: unknown }> };
  const { data } = await supa.rpc("has_role", { _user_id: ctx.userId, _role: "admin" });
  if (!data) throw new Error("Forbidden");
}

export interface MemberMatch {
  user_id: string;
  email: string | null;
  full_name: string | null;
  match_kind:
    | "uuid"
    | "email"
    | "email_partial"
    | "stripe_customer"
    | "stripe_customer_legacy"
    | "stripe_subscription"
    | "bd_member"
    | "name";
}

export const findMember = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ q: z.string().min(1).max(200) }).parse(d))
  .handler(async ({ data, context }): Promise<MemberMatch[]> => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: rows, error } = await supabaseAdmin.rpc("ops_find_member" as never, {
      _q: data.q,
    } as never);
    if (error) throw new Error(error.message);
    return (rows ?? []) as MemberMatch[];
  });
