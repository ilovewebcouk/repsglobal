/**
 * pg_cron entrypoint for the SEO index monitor.
 * Auth: Supabase publishable key in `apikey` header (canonical cron pattern).
 * Scheduled once daily; performs a batched URL Inspection scan against GSC.
 */
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/public/cron/seo-index-scan")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const expected = process.env.SUPABASE_PUBLISHABLE_KEY ?? "";
        const provided = request.headers.get("apikey") ?? "";
        if (!expected || provided !== expected) {
          return new Response("Unauthorized", { status: 401 });
        }
        const { runSeoIndexScan } = await import("@/lib/seo/index-monitor.server");
        const result = await runSeoIndexScan({ batchKind: "daily" });
        return Response.json(result);
      },
    },
  },
});
