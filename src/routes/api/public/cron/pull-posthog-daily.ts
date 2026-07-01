// pg_cron entrypoint: nightly PostHog → Supabase rollup.
// Auth: Supabase publishable key in `apikey` header (canonical cron pattern).

import { createFileRoute } from "@tanstack/react-router";
import { pullPostHogDaily } from "@/lib/ops/pull-posthog-daily.functions";

export const Route = createFileRoute("/api/public/cron/pull-posthog-daily")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const expected = process.env.SUPABASE_PUBLISHABLE_KEY ?? "";
        const provided = request.headers.get("apikey") ?? "";
        if (!expected || provided !== expected) {
          return new Response("Unauthorized", { status: 401 });
        }
        let date: string | undefined;
        try {
          const body = (await request.json()) as { date?: string } | null;
          date = body?.date;
        } catch {
          /* empty body ok */
        }
        const result = await pullPostHogDaily({ data: { date } });
        return Response.json(result);
      },
    },
  },
});
