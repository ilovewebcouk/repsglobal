// pg_cron entrypoint: nightly PostHog → Supabase rollup.
// Auth: dedicated server-only cron token via `Authorization: Bearer <token>`.

import { createFileRoute } from "@tanstack/react-router";
import { runPostHogDailyRollup } from "@/lib/ops/pull-posthog-daily.functions";
import { verifyCronRequest } from "@/lib/ops/cron-auth.server";

export const Route = createFileRoute("/api/public/cron/pull-posthog-daily")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        if (!(await verifyCronRequest(request))) {
          return new Response("Unauthorized", { status: 401 });
        }
        let date: string | undefined;
        try {
          const body = (await request.json()) as { date?: string } | null;
          date = body?.date;
        } catch {
          /* empty body ok */
        }
        const result = await runPostHogDailyRollup(date);
        return Response.json(result);
      },
    },
  },
});
