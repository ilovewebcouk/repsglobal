// Public conversion endpoint — links an anonymous session to a business
// outcome (enquiry / signup / checkout / paid).
//
// Fires even without analytics consent, on first-party actions only.
// Never accepts or writes raw IP; only a salted HMAC hash.

import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { createHmac } from "crypto";

const BodySchema = z.object({
  session_id: z.string().min(8).max(64),
  event_kind: z.enum([
    "enquiry_started",
    "enquiry_created",
    "signup_started",
    "checkout_started",
    "signup_complete",
  ]),
  anonymous_id: z.string().max(128).optional(),
  posthog_distinct_id: z.string().max(128).optional(),
  enquiry_id: z.string().uuid().optional(),
  pending_signup_id: z.string().uuid().optional(),
  user_id: z.string().uuid().optional(),
  professional_id: z.string().uuid().optional(),
  path: z.string().max(500).optional(),
  referrer: z.string().max(500).optional(),
  device: z.string().max(32).optional(),
  browser: z.string().max(64).optional(),
  properties: z.record(z.unknown()).optional(),
});

function hashIp(ip: string): string {
  const salt = process.env.REPS_HASH_SALT ?? "reps-conv-v1-salt";
  return createHmac("sha256", salt).update(ip).digest("hex").slice(0, 24);
}

function clientIp(req: Request): string {
  return (
    req.headers.get("cf-connecting-ip") ??
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    "0.0.0.0"
  );
}

export const Route = createFileRoute("/api/public/activity/public-conversion")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const raw = await request.json();
          const body = BodySchema.parse(raw);
          const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

          const country = request.headers.get("cf-ipcountry") ?? null;
          const ip = clientIp(request);

          await supabaseAdmin.from("public_visitor_conversions").insert({
            session_id: body.session_id,
            anonymous_id: body.anonymous_id ?? body.posthog_distinct_id ?? null,
            posthog_distinct_id: body.posthog_distinct_id ?? null,
            event_kind: body.event_kind,
            enquiry_id: body.enquiry_id ?? null,
            pending_signup_id: body.pending_signup_id ?? null,
            user_id: body.user_id ?? null,
            professional_id: body.professional_id ?? null,
            path: body.path ?? null,
            referrer: body.referrer ?? null,
            country_code: country,
            device: body.device ?? null,
            browser: body.browser ?? null,
            ip_hash: hashIp(ip),
            properties: body.properties ?? {},
          });

          return new Response(null, { status: 204 });
        } catch {
          return new Response(null, { status: 204 });
        }
      },
    },
  },
});
