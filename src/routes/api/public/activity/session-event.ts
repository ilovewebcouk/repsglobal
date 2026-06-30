// POST /api/public/activity/session-event
//
// Per-page beacon for logged-in members. Drops everything for:
//   - unauthenticated callers
//   - admins actively impersonating a member
//   - paths starting with /admin (defence-in-depth; client already skips)
// DNT / Sec-GPC: records session start only, no per-page detail.

import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { buildCaptureContext } from "@/lib/activity/capture.server";

const Body = z.object({
  session_id: z.string().uuid(),
  path: z.string().min(1).max(500),
  referrer: z.string().max(1000).nullish(),
  duration_ms: z.number().int().min(0).max(1000 * 60 * 60).nullish(),
});

export const Route = createFileRoute("/api/public/activity/session-event")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        let payload: unknown;
        try { payload = await request.json(); } catch { return new Response(null, { status: 204 }); }
        const parsed = Body.safeParse(payload);
        if (!parsed.success) return new Response(null, { status: 204 });

        const ctx = await buildCaptureContext(request);
        if (!ctx.userId) return new Response(null, { status: 204 });
        if (ctx.isImpersonating) return new Response(null, { status: 204 });

        // Strip query strings; clamp paths to ≤500 chars. Defence-in-depth.
        const path = parsed.data.path.split("?")[0].slice(0, 500);
        if (path.startsWith("/admin")) return new Response(null, { status: 204 });

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

        // Always upsert the user_session heartbeat so "online now" works
        // even when DNT/GPC suppresses per-page detail.
        await supabaseAdmin
          .from("user_sessions")
          .upsert(
            {
              id: parsed.data.session_id,
              user_id: ctx.userId,
              anon_id: parsed.data.session_id,
              last_seen_at: new Date().toISOString(),
              current_path: path,
              referrer: parsed.data.referrer ?? null,
              ip_hash: ctx.ipHash,
              user_agent: ctx.userAgent?.slice(0, 500) ?? null,
              country_code: ctx.countryCode,
              device: ctx.device,
              browser: ctx.browser,
              os: ctx.os,
              is_admin_view: false,
            },
            { onConflict: "id" },
          );

        if (ctx.dnt || ctx.gpc) {
          return new Response(null, { status: 204 });
        }

        const { error } = await supabaseAdmin.from("member_session_events").insert({
          user_id: ctx.userId,
          session_id: parsed.data.session_id,
          path,
          referrer: parsed.data.referrer ?? null,
          ip_hash: ctx.ipHash,
          user_agent: ctx.userAgent?.slice(0, 500) ?? null,
          country_code: ctx.countryCode,
          device: ctx.device,
          browser: ctx.browser,
          os: ctx.os,
          duration_ms: parsed.data.duration_ms ?? null,
        });
        if (error) {
          console.error("[activity/session-event] insert failed", error.message);
          return new Response(null, { status: 500 });
        }
        return new Response(null, { status: 204 });
      },
    },
  },
});
