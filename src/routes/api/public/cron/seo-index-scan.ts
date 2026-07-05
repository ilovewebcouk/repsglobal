/**
 * pg_cron entrypoint for the SEO index monitor.
 * Auth: dedicated server-only CRON_SECRET via `Authorization: Bearer <secret>`.
 * Scheduled once daily; performs a batched URL Inspection scan against GSC.
 */
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/public/cron/seo-index-scan")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const expected = process.env.CRON_SECRET ?? "";
        const header = request.headers.get("authorization") ?? "";
        const provided = header.startsWith("Bearer ") ? header.slice(7) : "";
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
