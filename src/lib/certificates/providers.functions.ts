/**
 * Admin server functions for managing training provider centre numbers.
 *
 * The centre number is printed on issued certificates as "Centre No. <n>"
 * under the provider name. Set here by admins.
 */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuthWithImpersonation as requireSupabaseAuth } from "@/integrations/supabase/auth-middleware-impersonation";

export type ProviderCenterNumberDTO = {
  provider_id: string;
  provider_name: string | null;
  center_number: string | null;
};

async function assertAdmin(supabase: any, userId: string) {
  const { data: isAdmin } = await supabase.rpc("has_role", { _user_id: userId, _role: "admin" });
  if (!isAdmin) throw new Error("Forbidden");
}

export const listProviderCenterNumbers = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<ProviderCenterNumberDTO[]> => {
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // Providers = profiles with the 'provider' role
    const { data: roles } = await supabaseAdmin
      .from("user_roles")
      .select("user_id")
      .eq("role", "provider");
    const ids = ((roles ?? []) as any[]).map((r) => r.user_id as string);
    if (ids.length === 0) return [];

    const { data, error } = await supabaseAdmin
      .from("profiles")
      .select("id, full_name, center_number")
      .in("id", ids)
      .order("full_name", { ascending: true });
    if (error) throw error;
    return ((data ?? []) as any[]).map((r) => ({
      provider_id: r.id as string,
      provider_name: (r.full_name as string | null) ?? null,
      center_number: (r.center_number as string | null) ?? null,
    }));
  });

export const setProviderCenterNumber = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) =>
    z
      .object({
        provider_id: z.string().uuid(),
        center_number: z.string().trim().max(64).nullable(),
      })
      .parse(data),
  )
  .handler(async ({ context, data }) => {
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const value = data.center_number && data.center_number.length > 0 ? data.center_number : null;
    const { error } = await supabaseAdmin
      .from("profiles")
      .update({ center_number: value } as never)
      .eq("id", data.provider_id);
    if (error) throw error;
    return { ok: true } as const;
  });
