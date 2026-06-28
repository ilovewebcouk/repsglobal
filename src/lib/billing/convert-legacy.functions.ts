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
