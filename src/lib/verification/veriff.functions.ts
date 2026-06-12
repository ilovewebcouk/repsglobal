import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const VERIFF_BASE = "https://stationapi.veriff.com";

/**
 * Create a Veriff session for the current professional and persist the
 * hosted URL on a fresh identity_documents row.
 */
export const createVeriffSession = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        callback_url: z.string().url().optional().nullable(),
        first_name: z.string().max(80).optional().nullable(),
        last_name: z.string().max(80).optional().nullable(),
      })
      .parse(d ?? {}),
  )
  .handler(async ({ data, context }) => {
    const apiKey = process.env.VERIFF_API_KEY;
    if (!apiKey) throw new Error("Veriff is not configured");
    const { supabase, userId } = context;

    const vendorData = userId; // we use this to match webhooks back
    const payload = {
      verification: {
        callback: data.callback_url ?? undefined,
        person: {
          firstName: data.first_name ?? undefined,
          lastName: data.last_name ?? undefined,
        },
        vendorData,
        timestamp: new Date().toISOString(),
      },
    };

    const res = await fetch(`${VERIFF_BASE}/v1/sessions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-AUTH-CLIENT": apiKey,
      },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const txt = await res.text();
      throw new Error(`Veriff session error: ${res.status} ${txt}`);
    }
    const json = (await res.json()) as {
      verification?: { id?: string; url?: string; sessionToken?: string };
    };
    const sessionId = json.verification?.id;
    const url = json.verification?.url;
    if (!sessionId || !url) throw new Error("Veriff returned no session");

    await supabase.from("professionals").upsert({ id: userId } as never, { onConflict: "id" });

    const { data: row, error } = await supabase
      .from("identity_documents")
      .insert({
        professional_id: userId,
        vendor: "veriff",
        veriff_session_id: sessionId,
        veriff_session_url: url,
        veriff_status: "created",
        status: "pending",
      } as never)
      .select("id, veriff_session_url")
      .single();
    if (error) throw new Error(error.message);

    return { id: row.id, url };
  });
