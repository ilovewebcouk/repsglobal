// Server-only: sends a single email via Mailgun through the Lovable connector
// gateway. Used by the support module so we can control Message-ID, In-Reply-To,
// and References headers for proper email threading.
//
// For regular transactional/auth emails, use the Lovable email queue instead
// (src/lib/email/send.server.ts) — it handles suppression, retries, and unsubscribe.

const GATEWAY_URL = "https://connector-gateway.lovable.dev/mailgun";
const MAILGUN_DOMAIN = "repsuk.org";

export interface MailgunAttachment {
  filename: string;
  contentType: string;
  data: Uint8Array;
}

export interface MailgunSendInput {
  from: string;
  to: string;
  subject: string;
  text: string;
  html: string;
  messageId: string;
  inReplyTo?: string | null;
  references?: string | null;
  replyTo?: string;
  attachments?: MailgunAttachment[];
}

export interface MailgunSendResult {
  id: string;
  message: string;
}

export async function sendViaMailgun(input: MailgunSendInput): Promise<MailgunSendResult> {
  const lovableKey = process.env.LOVABLE_API_KEY;
  const mailgunKey = process.env.MAILGUN_API_KEY;
  if (!lovableKey) throw new Error("LOVABLE_API_KEY missing");
  if (!mailgunKey) throw new Error("MAILGUN_API_KEY missing — connect Mailgun");

  const hasAttachments = (input.attachments?.length ?? 0) > 0;

  const headers: Record<string, string> = {
    Authorization: `Bearer ${lovableKey}`,
    "X-Connection-Api-Key": mailgunKey,
  };

  let body: BodyInit;
  if (hasAttachments) {
    const fd = new FormData();
    fd.append("from", input.from);
    fd.append("to", input.to);
    fd.append("subject", input.subject);
    fd.append("text", input.text);
    fd.append("html", input.html);
    fd.append("h:Message-Id", input.messageId);
    if (input.inReplyTo) fd.append("h:In-Reply-To", input.inReplyTo);
    if (input.references) fd.append("h:References", input.references);
    if (input.replyTo) fd.append("h:Reply-To", input.replyTo);
    for (const att of input.attachments!) {
      fd.append(
        "attachment",
        new Blob([att.data], { type: att.contentType }),
        att.filename,
      );
    }
    body = fd;
    // fetch sets multipart boundary automatically
  } else {
    const form = new URLSearchParams();
    form.set("from", input.from);
    form.set("to", input.to);
    form.set("subject", input.subject);
    form.set("text", input.text);
    form.set("html", input.html);
    form.set("h:Message-Id", input.messageId);
    if (input.inReplyTo) form.set("h:In-Reply-To", input.inReplyTo);
    if (input.references) form.set("h:References", input.references);
    if (input.replyTo) form.set("h:Reply-To", input.replyTo);
    body = form;
    headers["Content-Type"] = "application/x-www-form-urlencoded";
  }

  const res = await fetch(`${GATEWAY_URL}/${MAILGUN_DOMAIN}/messages`, {
    method: "POST",
    headers,
    body,
  });

  if (!res.ok) {
    const errBody = await res.text().catch(() => "");
    throw new Error(`Mailgun send failed: ${res.status} ${errBody.slice(0, 400)}`);
  }

  return (await res.json()) as MailgunSendResult;
}

export function buildMessageId(ticketId: string, suffix?: string): string {
  // RFC 5322 Message-ID. The ticket id is embedded so inbound replies can be
  // matched back to the ticket via the In-Reply-To / References header.
  const tag = suffix || Math.random().toString(36).slice(2, 10);
  return `<ticket-${ticketId}.${tag}@${MAILGUN_DOMAIN}>`;
}

export function extractTicketIdFromMessageId(value: string | null | undefined): string | null {
  if (!value) return null;
  // Header can contain multiple <...> ids separated by whitespace
  const matches = value.matchAll(/<ticket-([0-9a-f-]{36})\.[^@>]+@[^>]+>/gi);
  for (const m of matches) return m[1];
  return null;
}

export const SUPPORT_FROM_EMAIL = "support@repsuk.org";
export const SUPPORT_FROM_NAME = "REPS Support";
export const SUPPORT_DOMAIN = MAILGUN_DOMAIN;
