/**
 * Provider name lock-in — one-time free-text submission during verification.
 *
 * Unlike `submitProviderNameChange` (which routes edits through the
 * `provider_name_requests` admin queue), lock-in is only allowed while the
 * provider has no `profiles.full_name` yet. Once locked, self-service is
 * refused; the provider must contact support.
 */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuthWithImpersonation } from "@/integrations/supabase/auth-middleware-impersonation";
import { regenerateProviderSlug } from "@/lib/verification/provider-name.functions";

const Input = z.object({
  provider_name: z.string().trim().min(2, "Enter your training provider name").max(120),
});

export const lockInProviderName = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuthWithImpersonation])
  .inputValidator((d: unknown) => Input.parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    /* eslint-disable @typescript-eslint/no-explicit-any */
    const sb = supabase as any;

    const { data: profile } = await sb
      .from("profiles")
      .select("full_name")
      .eq("id", userId)
      .maybeSingle();

    const current = (profile?.full_name as string | null) ?? null;
    if (current && current.trim().length > 0) {
      throw new Error(
        "Your provider name is already locked. Contact support to change it.",
      );
    }

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const sa = supabaseAdmin as any;

    const requested = data.provider_name.trim();

    const { error: pErr } = await sa
      .from("profiles")
      .update({ full_name: requested })
      .eq("id", userId);
    if (pErr) throw pErr;

    await regenerateProviderSlug(sa, userId, requested);

    return { ok: true, locked_name: requested };
  });
