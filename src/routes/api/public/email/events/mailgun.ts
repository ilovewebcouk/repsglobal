// Mailgun events webhook (opens, clicks, unsubscribes, permanent failures,
// complaints, delivered). Configured in Mailgun's dashboard under
//   Sending → Webhooks → repsuk.org → each event type
// pointing at https://repsuk.org/api/public/email/events/mailgun.
//
// Payload shape (JSON, POST):
//   {
//     "signature": { "timestamp": "...", "token": "...", "signature": "..." },
//     "event-data": {
//       "event": "opened" | "clicked" | "unsubscribed" | "failed" | "complained" | "delivered",
//       "recipient": "user@example.com",
//       "message": { "headers": { "message-id": "<...>" } },
//       "user-variables": { "campaign_id": "...", "recipient_id": "..." },
//       "url": "https://..."      // clicks only
//       "severity": "permanent"    // failed only
//     }
//   }
//
// Signature: HMAC-SHA256(signing_key, timestamp + token). Same signing key
// used by the inbound webhook — stored in MAILGUN_WEBHOOK_SIGNING_KEY.
import { createFileRoute } from "@tanstack/react-router";
import { createHmac, timingSafeEqual } from "node:crypto";

export const Route = createFileRoute("/api/public/email/events/mailgun")({
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

        // Replay protection: reject anything older than 15 minutes.
        const ts = Number(timestamp);
        if (!Number.isFinite(ts) || Math.abs(Date.now() / 1000 - ts) > 60 * 15) {
          return new Response("Stale signature", { status: 401 });
        }

        const signingKey =
          process.env.MAILGUN_WEBHOOK_SIGNING_KEY || process.env.MAILGUN_API_KEY;
        if (!signingKey) {
          console.error("[campaign.events] no Mailgun signing key");
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
        const recipient = String(ev.recipient || "").toLowerCase().trim();
        const vars = (ev["user-variables"] ?? {}) as Record<string, unknown>;
        const campaignId = typeof vars.campaign_id === "string" ? vars.campaign_id : "";
        const recipientId = typeof vars.recipient_id === "string" ? vars.recipient_id : "";
        const messageId = String(ev?.message?.headers?.["message-id"] || "").trim();
        const clickedUrl = typeof ev.url === "string" ? ev.url : null;
        const severity = String(ev.severity || "").toLowerCase();
        // Event timestamp Mailgun assigns to the event itself (unix seconds).
        const eventTs = Number.isFinite(Number(ev.timestamp))
          ? new Date(Number(ev.timestamp) * 1000).toISOString()
          : new Date().toISOString();

        // Not tagged as a campaign send? Ignore silently but 200 so Mailgun
        // doesn't retry — the same webhook may fire for transactional sends.
        if (!campaignId && !messageId) {
          return new Response("ok", { status: 200 });
        }

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

        // Resolve recipient row: prefer explicit id, then (campaign_id, email),
        // finally mailgun_message_id as a last resort for pre-tag legacy sends.
        let query = supabaseAdmin.from("outbound_campaign_recipients").select("id, campaign_id");
        if (recipientId) query = query.eq("id", recipientId);
        else if (campaignId && recipient)
          query = query.eq("campaign_id", campaignId).eq("email", recipient);
        else if (messageId)
          query = query.eq("mailgun_message_id", `<${messageId}>`).limit(1);

        const { data: row } = await query.maybeSingle();
        if (!row) {
          return new Response("ok", { status: 200 });
        }

        const patch: Record<string, unknown> = {};
        const increments: Array<{ col: string; by: number }> = [];
        const campaignPatchIncrement: string[] = [];

        switch (eventName) {
          case "delivered": {
            patch.delivered_at = eventTs;
            // Only bump 'delivered' status if we haven't already recorded a
            // stronger terminal state (bounced/unsubscribed/complained).
            patch.status = "delivered";
            campaignPatchIncrement.push("delivered_count");
            break;
          }
          case "opened": {
            patch.opened_at = eventTs;
            increments.push({ col: "open_count", by: 1 });
            // First open only: bump campaign roll-up.
            campaignPatchIncrement.push("opened_count_if_first");
            break;
          }
          case "clicked": {
            patch.last_clicked_at = eventTs;
            if (clickedUrl) patch.last_clicked_url = clickedUrl.slice(0, 2000);
            increments.push({ col: "click_count", by: 1 });
            campaignPatchIncrement.push("clicked_count_if_first");
            break;
          }
          case "unsubscribed": {
            patch.unsubscribed_at = eventTs;
            patch.status = "unsubscribed";
            campaignPatchIncrement.push("unsubscribed_count");
            break;
          }
          case "complained": {
            patch.complained_at = eventTs;
            patch.status = "complained";
            campaignPatchIncrement.push("complained_count");
            break;
          }
          case "failed":
          case "permanent_fail":
          case "rejected": {
            if (severity === "permanent" || eventName !== "failed") {
              patch.bounced_at = eventTs;
              patch.status = "bounced";
              campaignPatchIncrement.push("bounced_count");
            }
            break;
          }
          default:
            return new Response("ok", { status: 200 });
        }

        // Apply base patch. For counters and first-open/first-click we need
        // a read-modify-write since Supabase-js can't do atomic column math
        // in one call without an RPC.
        if (Object.keys(patch).length > 0) {
          // Preserve first_clicked_at / open_count baseline
          const { data: current } = await supabaseAdmin
            .from("outbound_campaign_recipients")
            .select(
              "open_count, click_count, first_clicked_at, opened_at, delivered_at, unsubscribed_at, bounced_at, complained_at, status",
            )
            .eq("id", row.id)
            .maybeSingle();

          const merged: Record<string, unknown> = { ...patch };

          // Preserve first_clicked_at
          if (eventName === "clicked") {
            if (!current?.first_clicked_at) merged.first_clicked_at = eventTs;
          }

          // Increment counters
          if (eventName === "opened") {
            merged.open_count = (current?.open_count ?? 0) + 1;
          }
          if (eventName === "clicked") {
            merged.click_count = (current?.click_count ?? 0) + 1;
          }

          // Don't downgrade status from terminal states.
          const terminal = new Set([
            "unsubscribed",
            "complained",
            "bounced",
            "replied",
          ]);
          if (
            merged.status &&
            typeof current?.status === "string" &&
            terminal.has(current.status) &&
            merged.status !== current.status
          ) {
            delete merged.status;
          }

          // Track whether this is the first event of its type — used for
          // campaign-level unique counters (opened_count / clicked_count are
          // "unique recipients who did X", not total events).
          const isFirstOpen = eventName === "opened" && !current?.opened_at;
          const isFirstClick = eventName === "clicked" && !current?.first_clicked_at;
          const isFirstDelivered =
            eventName === "delivered" && !current?.delivered_at;
          const isFirstUnsub =
            eventName === "unsubscribed" && !current?.unsubscribed_at;
          const isFirstBounce =
            (eventName === "failed" ||
              eventName === "permanent_fail" ||
              eventName === "rejected") &&
            (severity === "permanent" || eventName !== "failed") &&
            !current?.bounced_at;
          const isFirstComplaint =
            eventName === "complained" && !current?.complained_at;

          await supabaseAdmin
            .from("outbound_campaign_recipients")
            .update(merged as never)
            .eq("id", row.id);

          // Roll-up campaign counters (unique recipients per event type).
          const bumpCampaign = async (col: string) => {
            const { data: c } = await supabaseAdmin
              .from("outbound_campaigns")
              .select(col)
              .eq("id", row.campaign_id)
              .maybeSingle();
            const cur = (c as any)?.[col] ?? 0;
            await supabaseAdmin
              .from("outbound_campaigns")
              .update({ [col]: cur + 1 } as never)
              .eq("id", row.campaign_id);
          };

          if (isFirstDelivered) await bumpCampaign("delivered_count");
          if (isFirstOpen) await bumpCampaign("opened_count");
          if (isFirstClick) await bumpCampaign("clicked_count");
          if (isFirstUnsub) await bumpCampaign("unsubscribed_count");
          if (isFirstBounce) await bumpCampaign("bounced_count");
          if (isFirstComplaint) await bumpCampaign("complained_count");
        }

        // Unsubscribe: also add to suppression list so future campaign sends
        // skip this address (defence-in-depth; Mailgun already suppresses).
        const suppress = async (reason: string) => {
          if (!recipient) return;
          await supabaseAdmin
            .from("suppressed_emails")
            .upsert(
              {
                email: recipient,
                reason,
                metadata: { source: "mailgun_webhook", event: eventName },
              } as never,
              { onConflict: "email" },
            );
          // Mirror status onto prospects table if this address is a prospect.
          if (reason === "unsubscribed" || reason === "bounced") {
            await supabaseAdmin
              .from("prospect_contacts")
              .update({
                status: reason === "bounced" ? "bounced" : "unsubscribed",
                unsubscribed_at:
                  reason === "unsubscribed" ? new Date().toISOString() : null,
              })
              .eq("email", recipient);
          }
        };
        if (eventName === "unsubscribed") await suppress("unsubscribed");
        if (
          (eventName === "failed" ||
            eventName === "permanent_fail" ||
            eventName === "rejected") &&
          severity === "permanent"
        ) {
          await suppress("bounced");
        }
        if (eventName === "complained") await suppress("complained");

        return new Response("ok", { status: 200 });
      },
    },
  },
});
