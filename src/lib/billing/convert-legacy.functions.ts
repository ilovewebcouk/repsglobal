// Server-fn wrapper for the BD → Stripe Subscription rail-swap.
// Admin-only. Implementation lives in convert-legacy.server.ts.
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const inputSchema = z.object({
  dryRun: z.boolean().default(true),
  limit: z.number().int().min(1).max(100).default(25),
  environment: z.enum(["sandbox", "live"]).default("sandbox"),
});

async function assertAdmin(ctx: { supabase: any; userId: string }) {
  const { data, error } = await ctx.supabase.rpc("has_role", {
    _user_id: ctx.userId,
    _role: "admin",
  });
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Forbidden");
}

/** Bucket counts for the admin UI summary. */
export const getBdConvertCandidates = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { getConvertCandidates } = await import("./convert-legacy.server");
    return getConvertCandidates();
  });

/** Run a conversion batch (dry-run by default). */
export const runBdConvertBatch = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => inputSchema.parse(data))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { runConvertBatch } = await import("./convert-legacy.server");
    return runConvertBatch({
      dryRun: data.dryRun,
      limit: data.limit,
      environment: data.environment,
    });
  });

// ---------- Setup-link / reactivation batches (Workstreams 2 & 3) ----------

const batchSchema = z.object({
  dryRun: z.boolean().default(true),
  limit: z.number().int().min(1).max(100).default(50),
  environment: z.enum(["sandbox", "live"]).default("live"),
  kind: z.enum(["setup", "reactivate"]),
});

export const getBdSetupCohorts = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { getSetupLinkCohorts } = await import("./setup-link.server");
    const c = await getSetupLinkCohorts();
    return {
      setup_count: c.setup.length,
      reactivate_count: c.reactivate.length,
      unactionable_count: c.unactionable.length,
      unactionable: c.unactionable,
    };
  });

export const runBdSetupLinkBatch = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => batchSchema.parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { runSetupLinkBatch } = await import("./setup-link.server");
    return runSetupLinkBatch(data);
  });

// ---------- Public token route (no auth — token-gated) ----------

const tokenSchema = z.object({ token: z.string().min(8).max(80) });

export const peekBdSetupLinkToken = createServerFn({ method: "GET" })
  .inputValidator((d: unknown) => tokenSchema.parse(d))
  .handler(async ({ data }) => {
    const { peekBdSetupToken } = await import("./setup-link.server");
    return peekBdSetupToken(data.token);
  });

export const startBdSetupLinkCheckout = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) =>
    z.object({
      token: z.string().min(8).max(80),
      environment: z.enum(["sandbox", "live"]).default("live"),
    }).parse(d),
  )
  .handler(async ({ data }) => {
    const { startBdSetupCheckout } = await import("./setup-link.server");
    const { getCheckoutOrigin } = await import("./stripe.server");
    try {
      return await startBdSetupCheckout({
        token: data.token,
        environment: data.environment,
        origin: getCheckoutOrigin(),
      });
    } catch (e) {
      return { error: e instanceof Error ? e.message : "checkout_failed" };
    }
  });
