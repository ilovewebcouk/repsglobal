// POST /api/public/activity/auth-event
//
// Records an auth lifecycle event.
// - For authenticated events (sign_in, sign_out, password_reset, email_confirmed):
//   user_id is resolved server-side from the Supabase bearer token.
// - For `sign_in_failed`: no bearer required. Caller may pass an `email` string
//   which we hash with ACTIVITY_IP_SALT before storing. Raw password never touched.
//   Response is always 204 so this endpoint never leaks whether an email exists.

import { createFileRoute } from "@tanstack/react-router";
import { createHmac } from "node:crypto";
import { z } from "zod";
import { buildCaptureContext } from "@/lib/activity/capture.server";

const Body = z.object({
  event: z.enum(["sign_in", "sign_out", "sign_in_failed", "password_reset", "email_confirmed"]),
  email: z.string().max(320).optional(),
});

function hashEmail(email: string): string | null {
  const salt = process.env.ACTIVITY_IP_SALT;
  if (!salt) return null;
  return createHmac("sha256", salt).update(email.trim().toLowerCase()).digest("hex");
}

export const Route = createFileRoute("/api/public/activity/auth-event")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        let payload: unknown;
        try { payload = await request.json(); } catch { return new Response(null, { status: 204 }); }
        const parsed = Body.safeParse(payload);
        if (!parsed.success) return new Response(null, { status: 204 });

        const ctx = await buildCaptureContext(request);

        // sign_in_failed: unauthenticated event; store hashed email if provided.
        if (parsed.data.event === "sign_in_failed") {
          const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
          const emailHash = parsed.data.email ? hashEmail(parsed.data.email) : null;
          const { error } = await supabaseAdmin.from("auth_events").insert({
            user_id: null,
            event: "sign_in_failed",
            email: emailHash, // hashed, never raw
            ip: ctx.ip,
            ip_hash: ctx.ipHash,
            user_agent: ctx.userAgent?.slice(0, 500) ?? null,
            country_code: ctx.countryCode,
            region: ctx.region,
            city: ctx.city,
            latitude: ctx.latitude,
            longitude: ctx.longitude,
            timezone: ctx.timezone,
            geo_source: ctx.geoSource,
            device: ctx.device,
            browser: ctx.browser,
            os: ctx.os,
          });
          if (error) console.error("[activity/auth-event] sign_in_failed insert failed", error.message);
          return new Response(null, { status: 204 });
        }

        // All other events require an authenticated caller.
        if (!ctx.userId) return new Response(null, { status: 204 });

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { error } = await supabaseAdmin.from("auth_events").insert({
          user_id: ctx.userId,
          event: parsed.data.event,
          ip: ctx.ip,
          ip_hash: ctx.ipHash,
          user_agent: ctx.userAgent?.slice(0, 500) ?? null,
          country_code: ctx.countryCode,
          region: ctx.region,
          city: ctx.city,
          latitude: ctx.latitude,
          longitude: ctx.longitude,
          timezone: ctx.timezone,
          geo_source: ctx.geoSource,
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
