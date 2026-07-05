// pg_cron entrypoint: nightly PostHog → Supabase rollup.
// Auth: dedicated server-only CRON_SECRET via `Authorization: Bearer <secret>`.

import { createFileRoute } from "@tanstack/react-router";
import { runPostHogDailyRollup } from "@/lib/ops/pull-posthog-daily.functions";

export const Route = createFileRoute("/api/public/cron/pull-posthog-daily")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const expected = process.env.CRON_SECRET ?? "";
        const header = request.headers.get("authorization") ?? "";
        const provided = header.startsWith("Bearer ") ? header.slice(7) : "";
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
        const result = await runPostHogDailyRollup(date);
        return Response.json(result);
      },
    },
  },
});
