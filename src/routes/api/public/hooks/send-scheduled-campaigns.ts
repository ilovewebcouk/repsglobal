// Cron endpoint: scans for scheduled campaigns whose scheduled_at <= now() and
// fires them. Called every minute by pg_cron. Idempotent — relies on the
// status='scheduled' → 'sending' atomic flip inside sendCampaignNow.
//
// Auth: this lives under /api/public/* which bypasses session auth on
// published deploys. We require the Supabase publishable apikey header so
// random callers can't trigger sends. pg_cron passes it from the SQL
// definition stored in the database.

import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/public/hooks/send-scheduled-campaigns")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const apikey = request.headers.get("apikey");
        const expected = process.env.SUPABASE_PUBLISHABLE_KEY;
        if (!expected || apikey !== expected) {
          return new Response("Unauthorized", { status: 401 });
        }

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

        const { data: due, error } = await supabaseAdmin
          .from("outbound_campaigns")
          .select("id")
          .eq("status", "scheduled")
          .lte("scheduled_at", new Date().toISOString())
          .order("scheduled_at", { ascending: true })
          .limit(5);

        if (error) {
          return new Response(
            JSON.stringify({ error: error.message }),
            { status: 500, headers: { "Content-Type": "application/json" } },
          );
        }

        if (!due || due.length === 0) {
          return Response.json({ processed: 0 });
        }

        // Atomically claim each campaign by flipping status → sending; if
        // another worker already claimed it (or it was cancelled), skip.
        const results: Array<{ id: string; sent?: number; failed?: number; error?: string }> = [];
        for (const row of due) {
          const { data: claimed, error: claimErr } = await supabaseAdmin
            .from("outbound_campaigns")
            .update({ status: "sending" })
            .eq("id", row.id)
            .eq("status", "scheduled")
            .select("id")
            .maybeSingle();
          if (claimErr || !claimed) continue;

          try {
            const { runScheduledCampaign } = await import(
              "@/lib/campaigns/scheduled-runner.server"
            );
            const r = await runScheduledCampaign(claimed.id);
            results.push({ id: claimed.id, sent: r.sent, failed: r.failed });
          } catch (err) {
            const msg = err instanceof Error ? err.message : String(err);
            await supabaseAdmin
              .from("outbound_campaigns")
              .update({ status: "failed", last_error: msg })
              .eq("id", claimed.id);
            results.push({ id: claimed.id, error: msg });
          }
        }

        return Response.json({ processed: results.length, results });
      },
    },
  },
});
