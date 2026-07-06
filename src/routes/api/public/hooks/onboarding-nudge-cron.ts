// Daily onboarding drip cron. Called by pg_cron at 08:00 UTC.
// Auth: Bearer token from public.cron_secrets (same pattern as
// send-scheduled-campaigns).

import { createFileRoute } from "@tanstack/react-router";
import { verifyCronRequest } from "@/lib/ops/cron-auth.server";

export const Route = createFileRoute("/api/public/hooks/onboarding-nudge-cron")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        if (!(await verifyCronRequest(request))) {
          return new Response("Unauthorized", { status: 401 });
        }
        try {
          const { runOnboardingNudges } = await import(
            "@/lib/onboarding/nudge-dispatcher.functions"
          );
          const result = await runOnboardingNudges({ limit: 75 });
          return Response.json(result);
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err);
          return new Response(JSON.stringify({ error: msg }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
          });
        }
      },
    },
  },
});
