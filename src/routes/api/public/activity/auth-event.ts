// POST /api/public/activity/auth-event
//
// Records an auth lifecycle event for the AUTHENTICATED caller only.
// Client may post the event NAME, but the user_id is always resolved
// server-side from the Supabase bearer token.

import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { buildCaptureContext } from "@/lib/activity/capture.server";

const Body = z.object({
  event: z.enum(["sign_in", "sign_out", "sign_in_failed", "password_reset", "email_confirmed"]),
});

export const Route = createFileRoute("/api/public/activity/auth-event")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        let payload: unknown;
        try { payload = await request.json(); } catch { return new Response(null, { status: 204 }); }
        const parsed = Body.safeParse(payload);
        if (!parsed.success) return new Response(null, { status: 204 });

        const ctx = await buildCaptureContext(request);
        if (!ctx.userId) return new Response(null, { status: 204 });

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { error } = await supabaseAdmin.from("auth_events").insert({
          user_id: ctx.userId,
          event: parsed.data.event,
          ip_hash: ctx.ipHash,
          user_agent: ctx.userAgent?.slice(0, 500) ?? null,
          country_code: ctx.countryCode,
          device: ctx.device,
          browser: ctx.browser,
          os: ctx.os,
        });
        if (error) {
          console.error("[activity/auth-event] insert failed", error.message);
          return new Response(null, { status: 500 });
        }
        return new Response(null, { status: 204 });
      },
    },
  },
});
