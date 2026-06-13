import { createFileRoute } from "@tanstack/react-router";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Stripe-Signature, stripe-signature",
};

/**
 * Stripe Identity webhook.
 * Verifies the Stripe signature, then maps verification_session events ->
 * identity_documents row. Auto-approves on `verified`.
 */
export const Route = createFileRoute("/api/public/webhooks/stripe-identity")({
  server: {
    handlers: {
      OPTIONS: async () => new Response(null, { status: 204, headers: CORS }),
      POST: async ({ request }) => {
        const key = process.env.STRIPE_SECRET_KEY;
        const secret =
          process.env.STRIPE_IDENTITY_WEBHOOK_SECRET ?? process.env.STRIPE_WEBHOOK_SECRET;
        if (!key || !secret) return json({ error: "not configured" }, 500);

        const sigHeader = request.headers.get("stripe-signature") ?? "";
        const raw = await request.text();

        const { default: Stripe } = await import("stripe");
        const stripe = new Stripe(key);

        let event: import("stripe").Stripe.Event;
        try {
          event = stripe.webhooks.constructEvent(raw, sigHeader, secret);
        } catch (e) {
          return json({ error: `invalid signature: ${(e as Error).message}` }, 401);
        }

        if (!event.type.startsWith("identity.verification_session.")) {
          // Not for us — ack so Stripe stops retrying.
          return json({ ok: true, ignored: event.type }, 200);
        }

        const vs = event.data.object as import("stripe").Stripe.Identity.VerificationSession;
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

        const { data: row, error: findErr } = await supabaseAdmin
          .from("identity_documents")
          .select("id, professional_id")
          .eq("stripe_vs_id", vs.id)
          .maybeSingle();
        if (findErr) return json({ error: findErr.message }, 500);
        if (!row) return json({ error: "session not found" }, 404);

        const mappedStatus = mapStatus(vs.status, event.type);
        const reason =
          vs.last_error?.reason ??
          (vs.last_error?.code ? `${vs.last_error.code}` : null);

        const patch: Record<string, unknown> = {
          stripe_status: vs.status,
          stripe_reason: reason,
          status: mappedStatus,
        };

        // Stripe only returns verified_outputs after a `verified` event when the
        // VerificationSession was retrieved with the right expand options. For
        // basic checks, name + dob arrive on the session itself.
        if (vs.status === "verified") {
          // Fetch with expanded verified_outputs (includes redacted PII Stripe lets us read once).
          try {
            const full = await stripe.identity.verificationSessions.retrieve(vs.id, {
              expand: ["verified_outputs"],
            });
            const out = full.verified_outputs;
            if (out) {
              const name = [out.first_name, out.last_name].filter(Boolean).join(" ").trim();
              if (name) patch.name_on_doc = name;
              if (out.dob) {
                const { year, month, day } = out.dob;
                if (year && month && day) {
                  patch.dob_on_doc = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
                }
              }
            }
          } catch {
            // best-effort enrichment
          }
        }

        if (mappedStatus === "approved" || mappedStatus === "rejected") {
          patch.reviewed_at = new Date().toISOString();
        }
        if (mappedStatus === "approved") {
          patch.admin_note = "Auto-approved by Stripe Identity";
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

function mapStatus(s: string | null | undefined, eventType: string): string {
  if (s === "verified" || eventType === "identity.verification_session.verified") {
    return "approved";
  }
  if (eventType === "identity.verification_session.canceled" || s === "canceled") {
    return "rejected";
  }
  if (s === "requires_input") {
    return "needs_more_info";
  }
  // processing, created → keep as pending
  return "pending";
}

function json(body: unknown, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...CORS },
  });
}
