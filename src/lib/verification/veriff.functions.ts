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

    // Purge any prior in-progress Veriff rows so Restart works cleanly and
    // the admin queue never sees abandoned sessions.
    await supabase
      .from("identity_documents")
      .delete()
      .eq("professional_id", userId)
      .eq("status", "pending")
      .in("veriff_status", ["created", "started", "abandoned"]);

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

/* -------------------------------------------------------------------------- */

function mapDecisionStatus(s: string | undefined, code: number): string {
  if (s === "approved" || code === 9001) return "approved";
  if (s === "declined" || code === 9102) return "rejected";
  if (s === "resubmission_requested" || code === 9103) return "needs_more_info";
  if (s === "expired" || code === 9104) return "expired";
  if (s === "abandoned" || code === 9105) return "rejected";
  return "pending";
}

function mapDocType(t: string): string | null {
  const lc = t.toLowerCase();
  if (lc.includes("passport")) return "passport";
  if (lc.includes("driv")) return "driving_licence";
  if (lc.includes("id")) return "national_id";
  return null;
}

/**
 * Server-side Veriff status poll — pulls the session decision directly from
 * Veriff's API so we never depend on the webhook arriving. Updates any
 * pending Veriff rows for the current professional.
 */
export const syncVeriffStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const apiKey = process.env.VERIFF_API_KEY;
    const secret = process.env.VERIFF_SECRET;
    if (!apiKey || !secret) return { changed: false };
    const { supabase, userId } = context;

    const { data: rows } = await supabase
      .from("identity_documents")
      .select("id, veriff_session_id, veriff_status, status")
      .eq("professional_id", userId)
      .eq("vendor", "veriff")
      .eq("status", "pending");

    const pending = (rows ?? []).filter((r) => r.veriff_session_id);
    if (pending.length === 0) return { changed: false };

    const { createHmac } = await import("crypto");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    let changed = false;

    for (const row of pending) {
      const sessionId = row.veriff_session_id as string;
      const sig = createHmac("sha256", secret).update(sessionId).digest("hex");
      const headers = {
        "X-AUTH-CLIENT": apiKey,
        "X-HMAC-SIGNATURE": sig,
        "Content-Type": "application/json",
      };

      // 1) Decision (final outcome)
      try {
        const res = await fetch(`${VERIFF_BASE}/v1/sessions/${sessionId}/decision`, { headers });
        if (res.ok) {
          const json = (await res.json()) as {
            verification?: {
              status?: string;
              code?: number;
              reason?: string | null;
              person?: { firstName?: string; lastName?: string; dateOfBirth?: string };
              document?: { type?: string; country?: string; validUntil?: string };
            } | null;
          };
          const v = json.verification;
          if (v && v.status) {
            const status = mapDecisionStatus(v.status, v.code ?? 0);
            const patch: Record<string, unknown> = {
              veriff_status: v.status,
              veriff_decision: json as unknown,
              veriff_reason: v.reason ?? null,
              status,
            };
            const name = [v.person?.firstName, v.person?.lastName].filter(Boolean).join(" ").trim();
            if (name) patch.name_on_doc = name;
            if (v.person?.dateOfBirth) patch.dob_on_doc = v.person.dateOfBirth;
            if (v.document?.type) patch.doc_type = mapDocType(v.document.type);
            if (v.document?.country) patch.doc_country = v.document.country;
            if (v.document?.validUntil) patch.doc_expiry = v.document.validUntil;
            if (status === "approved" || status === "rejected") {
              patch.reviewed_at = new Date().toISOString();
            }
            await supabaseAdmin.from("identity_documents").update(patch as never).eq("id", row.id);
            changed = true;
            continue;
          }
        }
      } catch {
        // network failure — fall through to attempts check
      }

      // 2) No decision yet — check attempts so a finished upload shows "In review"
      try {
        const res = await fetch(`${VERIFF_BASE}/v1/sessions/${sessionId}/attempts`, { headers });
        if (res.ok) {
          const json = (await res.json()) as {
            verifications?: Array<{ status?: string }>;
          };
          const statuses = (json.verifications ?? []).map((a) => a.status);
          const next = statuses.includes("submitted")
            ? "submitted"
            : statuses.includes("started")
              ? "started"
              : null;
          if (next && next !== row.veriff_status) {
            await supabaseAdmin
              .from("identity_documents")
              .update({ veriff_status: next } as never)
              .eq("id", row.id);
            changed = true;
          }
        }
      } catch {
        // ignore — row stays as-is and the UI keeps Resume/Restart available
      }
    }

    return { changed };
  });
