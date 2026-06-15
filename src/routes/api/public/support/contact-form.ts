// Public contact form intake. POSTed by /contact on repsuk.org.
//
// Creates a support ticket (source='contact_form'), stores the submission as
// the first inbound message, then sends an autoresponse via Mailgun and logs
// that as an outbound message flagged is_auto=true — so the admin sees the
// full trail (inbound enquiry → auto-reply → admin reply).
import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

const Audience = z.enum(["pro", "partner"]);

// Reasons that should land in the press inbox even when sent from the
// partner tab. Everything else from `partner` goes to partners@; everything
// from `pro` goes to pros@.
const PRESS_REASONS = new Set(["press"]);

const Schema = z.object({
  audience: Audience,
  // honeypot — must be empty
  company: z.string().max(200).optional(),
  fullName: z.string().trim().min(1).max(120),
  email: z.string().trim().email().max(255),
  message: z.string().trim().min(1).max(5000),
  reason: z.string().trim().max(60).optional(),
  // pro-only
  profession: z.string().trim().max(40).optional(),
  mobile: z.string().trim().max(40).optional(),
  tier: z.string().trim().max(80).optional(),
  profileUrl: z.string().trim().max(200).optional(),
  // partner-only
  org: z.string().trim().max(160).optional(),
  orgType: z.string().trim().max(40).optional(),
  website: z.string().trim().max(200).optional(),
  phone: z.string().trim().max(40).optional(),
});

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function inboxFor(audience: "pro" | "partner", reason?: string): "pros" | "partners" | "press" {
  if (audience === "pro") return "pros";
  if (reason && PRESS_REASONS.has(reason)) return "press";
  return "partners";
}

function priorityFor(reason?: string): "urgent" | "high" | "normal" | "low" {
  if (!reason) return "normal";
  if (reason === "safeguarding") return "urgent";
  if (reason === "billing" || reason === "verification") return "high";
  return "normal";
}

function buildSubject(audience: "pro" | "partner", reason?: string, org?: string): string {
  const reasonLabel = REASON_LABELS[reason ?? ""] ?? "Contact form enquiry";
  if (audience === "partner" && org) return `${reasonLabel} — ${org}`;
  return reasonLabel;
}

const REASON_LABELS: Record<string, string> = {
  verification: "Verification help",
  upgrade: "Upgrade to Pro or Studio",
  profile: "Profile / shop-front issue",
  billing: "Billing query",
  safeguarding: "Safeguarding / conduct",
  other: "General enquiry",
  recognition: "Course recognition on REPS",
  partnership: "Partnership / integration",
  "bulk-verify": "Bulk verification for graduates",
  press: "Press / media enquiry",
};

function summariseSubmission(input: z.infer<typeof Schema>): string {
  const lines: string[] = [];
  lines.push(`From: ${input.fullName} <${input.email}>`);
  lines.push(`Audience: ${input.audience === "pro" ? "Professional" : "Partner / Provider"}`);
  if (input.reason) lines.push(`Reason: ${REASON_LABELS[input.reason] ?? input.reason}`);
  if (input.audience === "pro") {
    if (input.profession) lines.push(`Profession: ${input.profession}`);
    if (input.tier) lines.push(`Status: ${input.tier}`);
    if (input.profileUrl) lines.push(`Profile URL: ${input.profileUrl}`);
    if (input.mobile) lines.push(`Mobile: ${input.mobile}`);
  } else {
    if (input.org) lines.push(`Organisation: ${input.org}`);
    if (input.orgType) lines.push(`Type: ${input.orgType}`);
    if (input.website) lines.push(`Website: ${input.website}`);
    if (input.phone) lines.push(`Phone: ${input.phone}`);
  }
  lines.push("");
  lines.push("Message:");
  lines.push(input.message);
  return lines.join("\n");
}

export const Route = createFileRoute("/api/public/support/contact-form")({
  server: {
    handlers: {
      OPTIONS: async () => new Response(null, { status: 204, headers: CORS }),

      POST: async ({ request }) => {
        let body: unknown;
        try {
          body = await request.json();
        } catch {
          return Response.json({ error: "Invalid JSON" }, { status: 400, headers: CORS });
        }

        const parsed = Schema.safeParse(body);
        if (!parsed.success) {
          return Response.json(
            { error: "Invalid form data", details: parsed.error.flatten() },
            { status: 400, headers: CORS },
          );
        }
        const data = parsed.data;

        // Honeypot — silently succeed for bots, do nothing.
        if (data.company && data.company.trim().length > 0) {
          return Response.json({ ok: true }, { headers: CORS });
        }

        const senderEmail = data.email.toLowerCase();
        const inbox = inboxFor(data.audience, data.reason);
        const priority = priorityFor(data.reason);
        const subject = buildSubject(data.audience, data.reason, data.org);
        const summary = summariseSubmission(data);

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

        // 1) Create the ticket
        const { data: created, error: cErr } = await supabaseAdmin
          .from("support_tickets")
          .insert({
            subject,
            requester_email: senderEmail,
            requester_name: data.fullName,
            priority,
            source: "contact_form",
            status: "open",
            inbox,
            sla_due_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          })
          .select("id, ticket_number")
          .single();
        if (cErr || !created) {
          console.error("[contact-form] ticket create failed", cErr);
          return Response.json({ error: "Could not create ticket" }, { status: 500, headers: CORS });
        }

        // 2) Inbound message (the submission itself)
        const { error: inErr } = await supabaseAdmin.from("support_messages").insert({
          ticket_id: created.id,
          direction: "inbound",
          from_email: senderEmail,
          from_name: data.fullName,
          body_text: summary,
        });
        if (inErr) {
          console.error("[contact-form] inbound insert failed", inErr);
        }

        // 3) Send autoresponse via Mailgun + log as outbound auto-reply
        try {
          const [
            { default: React },
            { render },
            { TEMPLATES },
            { sendViaMailgun, buildMessageId, SUPPORT_FROM_EMAIL, SUPPORT_FROM_NAME },
          ] = await Promise.all([
            import("react"),
            import("@react-email/components"),
            import("@/lib/email-templates/registry"),
            import("@/lib/support/mailgun-send.server"),
          ]);

          const tpl = TEMPLATES["contact-autoresponse"];
          const firstName = data.fullName.split(" ")[0] || "there";
          const templateData = {
            firstName,
            ticketNumber: created.ticket_number,
            summary: data.message,
          };
          const element = React.createElement(tpl.component, templateData as any);
          const html = await render(element);
          const text = await render(element, { plainText: true });
          const subj =
            typeof tpl.subject === "function" ? tpl.subject(templateData) : tpl.subject;

          const messageId = buildMessageId(created.id, "auto");
          await sendViaMailgun({
            from: `${SUPPORT_FROM_NAME} <${SUPPORT_FROM_EMAIL}>`,
            to: `${data.fullName} <${senderEmail}>`,
            subject: subj,
            text,
            html,
            messageId,
            replyTo: SUPPORT_FROM_EMAIL,
          });

          await supabaseAdmin.from("support_messages").insert({
            ticket_id: created.id,
            direction: "outbound",
            from_email: SUPPORT_FROM_EMAIL,
            from_name: SUPPORT_FROM_NAME,
            body_text: text,
            body_html: html,
            mailgun_message_id: messageId,
            is_auto: true,
          });

          // Seed thread_key so customer replies thread back into this ticket
          await supabaseAdmin
            .from("support_tickets")
            .update({ thread_key: messageId })
            .eq("id", created.id);
        } catch (err) {
          console.error("[contact-form] autoresponse failed", err);
          // Ticket is still created — don't fail the user submission
        }

        return Response.json(
          { ok: true, ticketNumber: created.ticket_number },
          { headers: CORS },
        );
      },
    },
  },
});
