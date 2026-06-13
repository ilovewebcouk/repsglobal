import { createServerFn } from "@tanstack/react-start";
import { getRequestHost } from "@tanstack/react-start/server";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/**
 * Create a Stripe Identity VerificationSession for the current professional
 * and persist the hosted URL on a fresh identity_documents row.
 *
 * Uses the shared connector-gateway Stripe client so the mode (sandbox vs
 * live) auto-switches between preview and published environments — same
 * pattern as Payments. No raw STRIPE_SECRET_KEY usage.
 */
export const createStripeIdentitySession = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        return_path: z.string().startsWith("/").optional(),
      })
      .parse(d ?? {}),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    const host = getRequestHost();
    const origin = host?.startsWith("localhost") ? `http://${host}` : `https://${host}`;
    const returnUrl = `${origin}${data.return_path ?? "/dashboard/verification"}?stripe_identity=complete`;

    const { createStripeClient, resolveStripeEnv } = await import("@/lib/billing/stripe.server");
    const env = resolveStripeEnv();
    const stripe = createStripeClient(env);

    const session = await stripe.identity.verificationSessions.create({
      type: "document",
      metadata: { professional_id: userId },
      return_url: returnUrl,
      options: {
        document: {
          require_matching_selfie: true,
          require_live_capture: true,
        },
      },
    });

    if (!session.id || !session.url) {
      throw new Error("Stripe Identity returned no session");
    }

    await supabase.from("professionals").upsert({ id: userId } as never, { onConflict: "id" });

    // Purge prior in-progress Stripe rows so Restart works cleanly.
    await supabase
      .from("identity_documents")
      .delete()
      .eq("professional_id", userId)
      .eq("status", "pending")
      .eq("vendor", "stripe");

    const { data: row, error } = await supabase
      .from("identity_documents")
      .insert({
        professional_id: userId,
        vendor: "stripe",
        stripe_vs_id: session.id,
        stripe_vs_url: session.url,
        stripe_status: session.status,
        status: "pending",
        environment: env,
      } as never)
      .select("id")
      .single();
    if (error) throw new Error(error.message);

    return { id: row.id, url: session.url };
  });
