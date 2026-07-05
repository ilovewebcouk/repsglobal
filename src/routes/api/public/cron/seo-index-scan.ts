/**
 * pg_cron entrypoint for the SEO index monitor.
 * Auth: dedicated server-only cron token via `Authorization: Bearer <token>`.
 * Scheduled once daily; performs a batched URL Inspection scan against GSC.
 */
import { createFileRoute } from "@tanstack/react-router";
import { verifyCronRequest } from "@/lib/ops/cron-auth.server";

export const Route = createFileRoute("/api/public/cron/seo-index-scan")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        if (!(await verifyCronRequest(request))) {
          return new Response("Unauthorized", { status: 401 });
        }
        const { runSeoIndexScan } = await import("@/lib/seo/index-monitor.server");
        const result = await runSeoIndexScan({ batchKind: "daily" });
        return Response.json(result);
      },
    },
  },
});
