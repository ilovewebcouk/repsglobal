import { createFileRoute } from "@tanstack/react-router";

/**
 * Daily maintenance for the support ticket lifecycle:
 *
 *  1. Auto-promote `solved` → `closed` after 28 days of no activity.
 *     Zendesk's default. Closed is the system-only terminal state — a
 *     customer reply to a closed ticket spawns a new linked ticket
 *     (handled in the mailgun inbound route) and cannot reopen the original.
 *
 *  2. Hard-purge tickets sitting in Trash (`deleted_at IS NOT NULL`) for >30 days.
 *
 * Called by pg_cron daily (03:15 UTC). Protected by the Supabase
 * publishable key in the `apikey` header.
 */
export const Route = createFileRoute("/api/public/hooks/support-auto-close")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const apiKey = request.headers.get("apikey");
        if (!apiKey || apiKey !== process.env.SUPABASE_PUBLISHABLE_KEY) {
          return new Response(JSON.stringify({ error: "Unauthorized" }), {
            status: 401,
            headers: { "Content-Type": "application/json" },
          });
        }

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const now = Date.now();
        const closeCutoff = new Date(now - 28 * 24 * 60 * 60 * 1000).toISOString();
        const purgeCutoff = new Date(now - 30 * 24 * 60 * 60 * 1000).toISOString();
        const nowIso = new Date(now).toISOString();

        const { data: closed, error: cErr } = await supabaseAdmin
          .from("support_tickets")
          .update({ status: "closed", closed_at: nowIso } as never, { count: "exact" })
          .eq("status", "solved")
          .is("deleted_at", null)
          .lt("last_message_at", closeCutoff)
          .select("id");

        const { data: purged, error: pErr } = await supabaseAdmin
          .from("support_tickets")
          .delete({ count: "exact" })
          .not("deleted_at", "is", null)
          .lt("deleted_at", purgeCutoff)
          .select("id");

        if (cErr || pErr) {
          return new Response(
            JSON.stringify({
              ok: false,
              closeError: cErr?.message ?? null,
              purgeError: pErr?.message ?? null,
            }),
            { status: 500, headers: { "Content-Type": "application/json" } },
          );
        }

        return new Response(
          JSON.stringify({
            ok: true,
            closed: closed?.length ?? 0,
            purged: purged?.length ?? 0,
            ranAt: nowIso,
          }),
          { headers: { "Content-Type": "application/json" } },
        );
      },
    },
  },
});
