// Owner-only probe: returns every geo-relevant header the Worker sees.
// Auth: shared secret via ?token= to avoid needing a session.
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/public/geo-probe")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const token = url.searchParams.get("token");
        if (!token || token !== process.env.ACTIVITY_IP_SALT) {
          return new Response("forbidden", { status: 403 });
        }
        const h: Record<string, string> = {};
        for (const [k, v] of request.headers.entries()) {
          if (/^cf-|^x-|^true-client|^fastly|forwarded/i.test(k)) h[k] = v;
        }
        return Response.json({ headers: h, ts: new Date().toISOString() });
      },
    },
  },
});
