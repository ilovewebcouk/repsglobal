import { createFileRoute } from "@tanstack/react-router";
import { createHmac, timingSafeEqual } from "crypto";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, X-HMAC-SIGNATURE, x-hmac-signature",
};

/**
 * Veriff decision webhook.
 * Verifies HMAC-SHA256 of the raw request body against VERIFF_SECRET,
 * then maps Veriff verification status -> identity_documents row.
 */
export const Route = createFileRoute("/api/public/webhooks/veriff")({
  server: {
    handlers: {
      OPTIONS: async () => new Response(null, { status: 204, headers: CORS }),
      POST: async ({ request }) => {
        const secret = process.env.VERIFF_SECRET;
        if (!secret) return json({ error: "not configured" }, 500);
        const sigHeader =
          request.headers.get("x-hmac-signature") ?? request.headers.get("X-HMAC-SIGNATURE") ?? "";
        const raw = await request.text();

        const expected = createHmac("sha256", secret).update(raw).digest("hex");
        const a = Buffer.from(sigHeader.toLowerCase(), "utf8");
        const b = Buffer.from(expected, "utf8");
        if (a.length !== b.length || !timingSafeEqual(a, b)) {
          return json({ error: "invalid signature" }, 401);
        }

        let body: VeriffPayload;
        try {
          body = JSON.parse(raw) as VeriffPayload;
        } catch {
          return json({ error: "invalid json" }, 400);
        }

        const v = body.verification;
        const sessionId = v?.id ?? body.sessionId ?? body.id;
        if (!sessionId) return json({ error: "missing session id" }, 400);

        const code = v?.code ?? 0;
        const status = mapStatus(v?.status, code);
        const reason = v?.reason ?? null;
        const person = v?.person ?? null;
        const document = v?.document ?? null;

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

        const { data: row, error: findErr } = await supabaseAdmin
          .from("identity_documents")
          .select("id, professional_id")
          .eq("veriff_session_id", sessionId)
          .maybeSingle();
        if (findErr) return json({ error: findErr.message }, 500);
        if (!row) return json({ error: "session not found" }, 404);

        const patch: Record<string, unknown> = {
          veriff_status: v?.status ?? "unknown",
          veriff_decision: body as unknown,
          veriff_reason: reason,
          status,
        };
        if (person) {
          const name = [person.firstName, person.lastName].filter(Boolean).join(" ").trim();
          if (name) patch.name_on_doc = name;
          if (person.dateOfBirth) patch.dob_on_doc = person.dateOfBirth;
        }
        if (document) {
          if (document.type) patch.doc_type = mapDocType(document.type);
          if (document.country) patch.doc_country = document.country;
          if (document.validUntil) patch.doc_expiry = document.validUntil;
        }
        if (status === "approved" || status === "rejected") {
          patch.reviewed_at = new Date().toISOString();
        }

        const { error: upErr } = await supabaseAdmin
          .from("identity_documents")
          .update(patch as never)
          .eq("id", row.id);
        if (upErr) return json({ error: upErr.message }, 500);

        return json({ ok: true }, 200);
      },
    },
  },
});

type VeriffPayload = {
  id?: string;
  sessionId?: string;
  verification?: {
    id?: string;
    status?: string;
    code?: number;
    reason?: string | null;
    person?: { firstName?: string; lastName?: string; dateOfBirth?: string };
    document?: { type?: string; country?: string; validUntil?: string };
  };
};

function mapStatus(s: string | undefined, code: number): string {
  // https://developers.veriff.com/#decision-codes
  if (s === "approved" || code === 9001) return "approved";
  if (s === "declined" || code === 9102 || code === 9103) return "rejected";
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

function json(body: unknown, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...CORS },
  });
}
