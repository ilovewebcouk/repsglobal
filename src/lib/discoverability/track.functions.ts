import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import type { Database } from "@/integrations/supabase/types";

/**
 * Public, fire-and-forget tracking endpoints for the discoverability strip.
 *
 * Inserts go through the server publishable (anon) client; the two event
 * tables have `INSERT TO anon` policies but SELECT is restricted to the
 * owning professional + admins.
 */

function anonClient() {
  return createClient<Database>(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_PUBLISHABLE_KEY!,
    { auth: { storage: undefined, persistSession: false, autoRefreshToken: false } },
  );
}

const ViewSchema = z.object({
  professional_id: z.string().uuid(),
  source: z.string().max(40).optional(),
  referrer_host: z.string().max(200).optional().nullable(),
});

export const recordProfileView = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => ViewSchema.parse(d))
  .handler(async ({ data }) => {
    const sb = anonClient();
    await sb.from("profile_view_events").insert({
      professional_id: data.professional_id,
      source: data.source ?? "public_profile",
      referrer_host: data.referrer_host ?? null,
    });
    return { ok: true };
  });

const SearchSchema = z.object({
  rows: z
    .array(
      z.object({
        professional_id: z.string().uuid(),
        position: z.number().int().min(1).max(500),
      }),
    )
    .min(1)
    .max(50),
  query: z.string().max(200).optional().nullable(),
  profession_slug: z.string().max(60).optional().nullable(),
  location_slug: z.string().max(120).optional().nullable(),
  page: z.number().int().min(1).max(50).optional(),
});

export const recordSearchAppearances = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => SearchSchema.parse(d))
  .handler(async ({ data }) => {
    const sb = anonClient();
    const rows = data.rows.map((r) => ({
      professional_id: r.professional_id,
      position: r.position,
      page: data.page ?? 1,
      query: data.query ?? null,
      profession_slug: data.profession_slug ?? null,
      location_slug: data.location_slug ?? null,
    }));
    await sb.from("search_appearance_events").insert(rows);
    return { ok: true };
  });
