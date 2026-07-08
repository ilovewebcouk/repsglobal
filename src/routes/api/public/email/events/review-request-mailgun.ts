// Mailgun events webhook for review-request emails. Configure in Mailgun's
// dashboard under Sending -> Webhooks -> repsuk.org for delivered / opened /
// failed / permanent_fail, pointing at:
//
//   https://repsuk.org/api/public/email/events/review-request-mailgun
//
// Payload shape (JSON, POST):
//   {
//     "signature": { "timestamp": "...", "token": "...", "signature": "..." },
//     "event-data": {
//       "event": "delivered" | "opened" | "failed" | "permanent_fail",
//       "recipient": "user@example.com",
//       "message": { "headers": { "message-id": "<...>" } },
//       "user-variables": { "review_request_id": "..." },
//       "severity": "permanent"          // failed only
//     }
//   }
//
// HMAC-SHA256(signing_key, timestamp + token) — same signing key as the
// campaign webhook (MAILGUN_WEBHOOK_SIGNING_KEY, falls back to
// MAILGUN_API_KEY).
import { createFileRoute } from "@tanstack/react-router";
import { createHmac, timingSafeEqual } from "node:crypto";

export const Route = createFileRoute("/api/public/email/events/review-request-mailgun")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        let payload: any;
        try {
          payload = await request.json();
        } catch {
          return new Response("Invalid JSON", { status: 400 });
        }

        const sig = payload?.signature ?? {};
        const timestamp = String(sig.timestamp || "");
        const token = String(sig.token || "");
        const signature = String(sig.signature || "");
        if (!timestamp || !token || !signature) {
          return new Response("Missing signature", { status: 401 });
        }

        const ts = Number(timestamp);
        if (!Number.isFinite(ts) || Math.abs(Date.now() / 1000 - ts) > 60 * 15) {
          return new Response("Stale signature", { status: 401 });
        }

        const signingKey =
          process.env.MAILGUN_WEBHOOK_SIGNING_KEY || process.env.MAILGUN_API_KEY;
        if (!signingKey) {
          console.error("[review-request.events] no Mailgun signing key");
          return new Response("Server misconfigured", { status: 500 });
        }

        const expected = createHmac("sha256", signingKey)
          .update(timestamp + token)
          .digest("hex");
        const sigBuf = Buffer.from(signature, "hex");
        const expBuf = Buffer.from(expected, "hex");
        if (sigBuf.length !== expBuf.length || !timingSafeEqual(sigBuf, expBuf)) {
          return new Response("Invalid signature", { status: 401 });
        }

        const ev = payload["event-data"] ?? {};
        const eventName = String(ev.event || "").toLowerCase();
        const vars = (ev["user-variables"] ?? {}) as Record<string, unknown>;
        const reviewRequestId =
          typeof vars.review_request_id === "string" ? vars.review_request_id : "";
        const rawMessageId = String(ev?.message?.headers?.["message-id"] || "").trim();
        const severity = String(ev.severity || "").toLowerCase();
        const eventTs = Number.isFinite(Number(ev.timestamp))
          ? new Date(Number(ev.timestamp) * 1000).toISOString()
          : new Date().toISOString();
        const reason =
          typeof ev.reason === "string"
            ? ev.reason
            : typeof ev["delivery-status"]?.message === "string"
              ? ev["delivery-status"].message
              : null;

        if (!reviewRequestId && !rawMessageId) {
          return new Response("ok", { status: 200 });
        }

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

        // Resolve row: explicit review_request_id first, then mailgun_message_id
        // (some events for a message may fire before the caller stored the id).
        let query = supabaseAdmin
          .from("review_requests")
          .select(
            "id, status, delivered_at, first_opened_at, open_count, failed_at",
          );
        if (reviewRequestId) {
          query = query.eq("id", reviewRequestId);
        } else {
          // Mailgun message-id in webhook is unwrapped; stored value has < >.
          const bare = rawMessageId.replace(/^<|>$/g, "");
          query = query
            .or(`mailgun_message_id.eq.${bare},mailgun_message_id.eq.<${bare}>`)
            .limit(1);
        }
        const { data: row } = await query.maybeSingle();
        if (!row) return new Response("ok", { status: 200 });

        const patch: Record<string, unknown> = {};
        switch (eventName) {
          case "delivered": {
            if (!row.delivered_at) patch.delivered_at = eventTs;
            break;
          }
          case "opened": {
            if (!row.first_opened_at) patch.first_opened_at = eventTs;
            patch.last_opened_at = eventTs;
            patch.open_count = (row.open_count ?? 0) + 1;
            // Bump status from "sent" -> "opened"; never regress from
            // "submitted"/"expired".
            if (row.status === "sent") patch.status = "opened";
            break;
          }
          case "failed":
          case "permanent_fail":
          case "rejected": {
            if (severity === "permanent" || eventName !== "failed") {
              if (!row.failed_at) patch.failed_at = eventTs;
              if (reason) patch.failure_reason = reason.slice(0, 500);
            }
            break;
          }
          default:
            return new Response("ok", { status: 200 });
        }

        if (Object.keys(patch).length > 0) {
          await supabaseAdmin
            .from("review_requests")
            .update(patch as never)
            .eq("id", row.id);
        }

        return new Response("ok", { status: 200 });
      },
    },
  },
});
