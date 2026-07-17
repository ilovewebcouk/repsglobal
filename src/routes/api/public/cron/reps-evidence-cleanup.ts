/**
 * pg_cron entrypoint: sweeps orphaned course-accreditation evidence.
 * Auth: dedicated server-only cron token via `Authorization: Bearer <token>`.
 * Scheduled once daily.
 */
import { createFileRoute } from "@tanstack/react-router";
import { verifyCronRequest } from "@/lib/ops/cron-auth.server";

export const Route = createFileRoute("/api/public/cron/reps-evidence-cleanup")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        if (!(await verifyCronRequest(request))) {
          return new Response("Unauthorized", { status: 401 });
        }
        const { cleanupOrphanRepsCourseEvidence } = await import(
          "@/lib/qualifications/orphan-evidence-cleanup.server"
        );
        const result = await cleanupOrphanRepsCourseEvidence();
        return Response.json(result);
      },
    },
  },
});
