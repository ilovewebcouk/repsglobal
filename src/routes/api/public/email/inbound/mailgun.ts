// Mailgun inbound webhook.
//
// Configure a Mailgun Route (action `forward("https://repsuk.org/api/public/email/inbound/mailgun")`)
// that catches inbound mail to support@repsuk.org. Mailgun POSTs a multipart
// form with timestamp/token/signature for HMAC verification.
//
// Signature: HMAC-SHA256(signing_key, timestamp + token). Mailgun's "HTTP
// webhook signing key" (different from the API key) is required and stored
// in the MAILGUN_WEBHOOK_SIGNING_KEY secret. Falls back to MAILGUN_API_KEY
// for legacy accounts.
import { createFileRoute } from "@tanstack/react-router";
import { createHmac, timingSafeEqual } from "node:crypto";

export const Route = createFileRoute("/api/public/email/inbound/mailgun")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        let form: FormData;
        try {
          form = await request.formData();
        } catch {
          return new Response("Invalid form", { status: 400 });
        }

        const timestamp = String(form.get("timestamp") || "");
        const token = String(form.get("token") || "");
        const signature = String(form.get("signature") || "");
        if (!timestamp || !token || !signature) {
          return new Response("Missing signature", { status: 401 });
        }

        // Reject anything older than 15 minutes (replay protection).
        const ts = Number(timestamp);
        if (!Number.isFinite(ts) || Math.abs(Date.now() / 1000 - ts) > 60 * 15) {
          return new Response("Stale signature", { status: 401 });
        }

        const signingKey =
          process.env.MAILGUN_WEBHOOK_SIGNING_KEY || process.env.MAILGUN_API_KEY;
        if (!signingKey) {
          console.error("[support.inbound] no Mailgun signing key available");
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

        // Parsed Mailgun fields
        const sender = String(form.get("sender") || form.get("from") || "").trim();
        const fromHeader = String(form.get("From") || form.get("from") || "").trim();
        const recipient = String(form.get("recipient") || "").trim().toLowerCase();
        const subject = String(form.get("subject") || "(no subject)").slice(0, 200);
        const bodyPlain =
          String(form.get("stripped-text") || "") ||
          String(form.get("body-plain") || "");
        const bodyHtml =
          String(form.get("stripped-html") || "") ||
          String(form.get("body-html") || "");
        const messageId = String(form.get("Message-Id") || form.get("message-id") || "");
        const inReplyTo = String(form.get("In-Reply-To") || "");
        const references = String(form.get("References") || "");

        if (!sender) return new Response("Missing sender", { status: 400 });

        // Try to extract sender display name from "Name <email>"
        const nameMatch = fromHeader.match(/^\s*"?([^"<]+?)"?\s*</);
        const senderName = nameMatch ? nameMatch[1].trim() : null;
        const senderEmail = sender.toLowerCase();

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { extractTicketIdFromMessageId } = await import(
          "@/lib/support/mailgun-send.server"
        );

        // 1) Try matching to an existing ticket via the threaded Message-ID we
        //    embedded when we sent the previous reply.
        let ticketId = extractTicketIdFromMessageId(inReplyTo);
        if (!ticketId) ticketId = extractTicketIdFromMessageId(references);

        // 1b) Campaign reply? If In-Reply-To/References matches an
        // outbound_campaign_recipients row, create (or reuse) a single ticket
        // tagged `campaign:<id>` and mark the recipient as replied.
        let campaignTags: string[] | null = null;
        let campaignRecipientId: string | null = null;
        if (!ticketId) {
          const refsToTry = [inReplyTo, references].filter(Boolean);
          if (refsToTry.length > 0) {
            const { data: recip } = await supabaseAdmin
              .from("outbound_campaign_recipients")
              .select("id, campaign_id, reply_ticket_id")
              .in("mailgun_message_id", refsToTry)
              .limit(1)
              .maybeSingle();
            if (recip) {
              campaignRecipientId = recip.id;
              campaignTags = ["campaign-reply", `campaign:${recip.campaign_id}`];
              if (recip.reply_ticket_id) ticketId = recip.reply_ticket_id;
            }
          }
        }

        // 2) Fallback: same sender with an open/pending ticket in last 7 days
        if (!ticketId) {
          const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
          const { data: existing } = await supabaseAdmin
            .from("support_tickets")
            .select("id")
            .eq("requester_email", senderEmail)
            .in("status", ["open", "pending"])
            .gte("last_message_at", since)
            .order("last_message_at", { ascending: false })
            .limit(1)
            .maybeSingle();
          if (existing) ticketId = existing.id;
        }

        // Derive inbox from the recipient mailbox (support@ / pros@ / partners@ / press@)
        const localPart = recipient.split("@")[0] ?? "support";
        const inbox =
          localPart === "pros" || localPart === "partners" || localPart === "press"
            ? localPart
            : "support";

        // 3) Otherwise create a new ticket
        if (!ticketId) {
          const { data: created, error: cErr } = await supabaseAdmin
            .from("support_tickets")
            .insert({
              subject,
              requester_email: senderEmail,
              requester_name: senderName,
              priority: "normal",
              source: "email",
              status: "open",
              inbox,
              tags: campaignTags ?? [],
              sla_due_at: new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString(),
              thread_key: messageId || null,
            })
            .select("id")
            .single();
          if (cErr) {
            console.error("[support.inbound] ticket create failed", cErr);
            return new Response("DB error", { status: 500 });
          }
          ticketId = created.id;
        }

        // Mark the campaign recipient as replied + link the ticket back
        if (campaignRecipientId && ticketId) {
          await supabaseAdmin
            .from("outbound_campaign_recipients")
            .update({
              status: "replied",
              replied_at: new Date().toISOString(),
              reply_ticket_id: ticketId,
            })
            .eq("id", campaignRecipientId);
        }


        // Insert inbound message
        const { data: inserted, error: mErr } = await supabaseAdmin
          .from("support_messages")
          .insert({
            ticket_id: ticketId,
            direction: "inbound",
            from_email: senderEmail,
            from_name: senderName,
            body_text: bodyPlain || null,
            body_html: bodyHtml || null,
            mailgun_message_id: messageId || null,
            in_reply_to: inReplyTo || null,
            email_references: references || null,
          })
          .select("id")
          .single();
        if (mErr || !inserted) {
          console.error("[support.inbound] message insert failed", mErr);
          return new Response("DB error", { status: 500 });
        }

        // Persist any attachments. Mailgun multipart-forwarded inbound mail
        // includes an `attachment-count` field plus numbered `attachment-N`
        // file parts (1-indexed). Upload each to storage and record a row.
        const attachmentCount = Number(form.get("attachment-count") || 0);
        if (Number.isFinite(attachmentCount) && attachmentCount > 0) {
          for (let i = 1; i <= attachmentCount; i++) {
            const part = form.get(`attachment-${i}`);
            if (!(part instanceof File)) continue;
            const safeName = (part.name || `attachment-${i}`).replace(
              /[^a-zA-Z0-9._-]+/g,
              "_",
            );
            const storagePath = `${ticketId}/${inserted.id}/${i}-${safeName}`;
            const buf = new Uint8Array(await part.arrayBuffer());
            const { error: upErr } = await supabaseAdmin.storage
              .from("support-attachments")
              .upload(storagePath, buf, {
                contentType: part.type || "application/octet-stream",
                upsert: true,
              });
            if (upErr) {
              console.error("[support.inbound] attachment upload failed", upErr);
              continue;
            }
            const { error: aErr } = await supabaseAdmin
              .from("support_attachments")
              .insert({
                message_id: inserted.id,
                storage_path: storagePath,
                filename: part.name || safeName,
                mime_type: part.type || null,
                size_bytes: part.size ?? null,
              });
            if (aErr) {
              console.error("[support.inbound] attachment row insert failed", aErr);
            }
          }
        }

        return Response.json({ ok: true, ticket_id: ticketId });
      },
    },
  },
});
