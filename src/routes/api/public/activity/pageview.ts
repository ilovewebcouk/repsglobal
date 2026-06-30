// Page-view capture endpoint. Called from the client beacon on every route
// resolution. Server enriches with IP hash, country, city, device, browser, OS.
// Inserts into `page_view_events` and upserts the `user_sessions` row.

import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { enrichRequest, resolveBearerUserId } from "@/lib/activity/enrich.server";

const Body = z.object({
  path: z.string().min(1).max(2048),
  referrer: z.string().max(2048).optional().nullable(),
  anon_id: z.string().uuid(),
  session_id: z.string().uuid(),
  is_admin_view: z.boolean().optional(),
});

export const Route = createFileRoute("/api/public/activity/pageview")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        let body: z.infer<typeof Body>;
        try {
          body = Body.parse(await request.json());
        } catch {
          return new Response("Bad request", { status: 400 });
        }

        // Drop noisy / admin-tooling paths so the feed stays clean.
        const path = body.path;
        if (
          path.startsWith("/api/") ||
          path.startsWith("/lovable/") ||
          path.startsWith("/_") ||
          path.startsWith("/@")
        ) {
          return new Response(null, { status: 204 });
        }

        const [enriched, userId] = await Promise.all([
          enrichRequest(request),
          resolveBearerUserId(request),
        ]);

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const now = new Date().toISOString();

        // Upsert session row (best-effort: insert if not exists, else update).
        const { data: existing } = await supabaseAdmin
          .from("user_sessions")
          .select("id, pages_viewed")
          .eq("id", body.session_id)
          .maybeSingle();

        if (!existing) {
          await supabaseAdmin.from("user_sessions").insert({
            id: body.session_id,
            user_id: userId,
            anon_id: body.anon_id,
            started_at: now,
            last_seen_at: now,
            current_path: path,
            referrer: body.referrer ?? null,
            ip_hash: enriched.ipHash,
            user_agent: enriched.userAgent,
            country_code: enriched.countryCode,
            city: enriched.city,
            device: enriched.device,
            browser: enriched.browser,
            os: enriched.os,
            pages_viewed: 1,
            is_admin_view: body.is_admin_view ?? false,
          });
        } else {
          await supabaseAdmin
            .from("user_sessions")
            .update({
              last_seen_at: now,
              current_path: path,
              user_id: userId ?? undefined,
              pages_viewed: (existing as { pages_viewed: number }).pages_viewed + 1,
            })
            .eq("id", body.session_id);
        }

        await supabaseAdmin.from("page_view_events").insert({
          user_id: userId,
          anon_id: body.anon_id,
          session_id: body.session_id,
          path,
          referrer: body.referrer ?? null,
          ip_hash: enriched.ipHash,
          user_agent: enriched.userAgent,
          country_code: enriched.countryCode,
          city: enriched.city,
          device: enriched.device,
          browser: enriched.browser,
          os: enriched.os,
          is_admin_view: body.is_admin_view ?? false,
        });

        return new Response(null, { status: 204 });
      },
    },
  },
});
