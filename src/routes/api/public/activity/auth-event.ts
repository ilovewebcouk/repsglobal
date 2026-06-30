// Auth-event capture endpoint. Called from the client onAuthStateChange listener
// for SIGNED_IN / SIGNED_OUT / USER_UPDATED, and from the /auth page for
// sign-in failures + password resets.

import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { enrichRequest, resolveBearerUserId } from "@/lib/activity/enrich.server";

const Body = z.object({
  event: z.enum([
    "sign_in",
    "sign_out",
    "sign_in_failed",
    "password_reset",
    "email_confirmed",
    "user_updated",
  ]),
  email: z.string().email().max(255).optional().nullable(),
});

export const Route = createFileRoute("/api/public/activity/auth-event")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        let body: z.infer<typeof Body>;
        try {
          body = Body.parse(await request.json());
        } catch {
          return new Response("Bad request", { status: 400 });
        }

        const [enriched, userId] = await Promise.all([
          enrichRequest(request),
          resolveBearerUserId(request),
        ]);

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

        await supabaseAdmin.from("auth_events").insert({
          user_id: userId,
          event: body.event,
          email: body.email ?? null,
          ip_hash: enriched.ipHash,
          user_agent: enriched.userAgent,
          country_code: enriched.countryCode,
          city: enriched.city,
          device: enriched.device,
          browser: enriched.browser,
          os: enriched.os,
        });

        return new Response(null, { status: 204 });
      },
    },
  },
});
