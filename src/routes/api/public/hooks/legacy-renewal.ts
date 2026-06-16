/**
 * Daily cron: pick up legacy_stripe_link rows whose access has expired and
 * create their Verified £99/yr subscription on the existing Stripe customer.
 *
 * Triggered by pg_cron via net.http_post with the Supabase anon key in the
 * `apikey` header (see `/api/public/*` convention). No body params required.
 *
 * Body (optional):
 *   { "environment": "live" | "sandbox", "limit": number }
 *   defaults: environment="live", limit=50
 */
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/public/hooks/legacy-renewal")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        // Authenticate the cron caller with a server-only secret. The Supabase
        // publishable/anon key is NOT acceptable here — it ships in the client
        // bundle and would let any visitor trigger Stripe charges.
        const cronSecret = process.env.CRON_SECRET;
        const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
        const presented =
          request.headers.get("x-cron-secret") ??
          request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ??
          request.headers.get("apikey");
        const accepted =
          (!!cronSecret && presented === cronSecret) ||
          (!!serviceRoleKey && presented === serviceRoleKey);
        if (!accepted) {
          return new Response(JSON.stringify({ error: "unauthorized" }), {
            status: 401,
            headers: { "Content-Type": "application/json" },
          });
        }

        let environment: "sandbox" | "live" = "live";
        let limit = 50;
        try {
          const text = await request.text();
          if (text) {
            const body = JSON.parse(text) as { environment?: string; limit?: number };
            if (body.environment === "sandbox" || body.environment === "live") {
              environment = body.environment;
            }
            if (typeof body.limit === "number" && body.limit > 0 && body.limit <= 200) {
              limit = body.limit;
            }
          }
        } catch {
          /* empty body is fine */
        }

        const { _runLegacyRenewalBatch } = await import("@/lib/admin/stripe-linking.functions");
        const result = await _runLegacyRenewalBatch(environment, limit);
        return new Response(JSON.stringify(result), {
          headers: { "Content-Type": "application/json" },
        });
      },
    },
  },
});
