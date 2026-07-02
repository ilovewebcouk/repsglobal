// Server fn: link an anonymous PostHog distinct_id to a signed-in user's uuid.
// Idempotent; safe to call multiple times per session. RPC enforces authz.

import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

export const linkVisitorToUser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) =>
    z
      .object({
        distinct_id: z.string().min(1).max(200),
      })
      .parse(data),
  )
  .handler(async ({ data, context }) => {
    const { data: result, error } = await context.supabase.rpc("link_visitor_to_user", {
      _distinct_id: data.distinct_id,
      _user_id: context.userId,
    });
    if (error) throw new Error(`link_failed: ${error.message}`);
    return (result ?? { observations_linked: 0, journeys_linked: 0 }) as {
      observations_linked: number;
      journeys_linked: number;
    };
  });
