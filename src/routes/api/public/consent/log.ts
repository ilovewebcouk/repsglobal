// Consent audit endpoint — writes to public_analytics_consent_events.
// Never returns PII. No admin/member role required.

import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { createHmac } from "crypto";

const BodySchema = z.object({
  session_id: z.string().min(8).max(64),
  choice: z.enum(["accepted", "rejected", "customised", "withdrawn"]),
  scopes: z.object({
    analytics: z.boolean(),
    essential: z.literal(true),
  }),
  dnt: z.boolean().optional(),
  gpc: z.boolean().optional(),
});

function hashUa(ua: string): string {
  const salt = process.env.REPS_HASH_SALT ?? "reps-consent-v1-salt";
  return createHmac("sha256", salt).update(ua).digest("hex").slice(0, 24);
}

export const Route = createFileRoute("/api/public/consent/log")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const raw = await request.json();
          const body = BodySchema.parse(raw);
          const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

          const ua = request.headers.get("user-agent") ?? "";
          const country = request.headers.get("cf-ipcountry") ?? null;

          await supabaseAdmin.from("public_analytics_consent_events").insert({
            session_id: body.session_id,
            choice: body.choice,
            scopes: body.scopes,
            ua_hash: ua ? hashUa(ua) : null,
            dnt: body.dnt === true,
            gpc: body.gpc === true,
            country_code: country,
          });

          return new Response(null, { status: 204 });
        } catch {
          return new Response(null, { status: 204 });
        }
      },
    },
  },
});
