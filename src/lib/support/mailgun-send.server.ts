// Server-only: sends a single email via Mailgun through the Lovable connector
// gateway. Used by the support module so we can control Message-ID, In-Reply-To,
// and References headers for proper email threading.
//
// For regular transactional/auth emails, use the Lovable email queue instead
// (src/lib/email/send.server.ts) — it handles suppression, retries, and unsubscribe.

const GATEWAY_URL = "https://connector-gateway.lovable.dev/mailgun";
const MAILGUN_DOMAIN = "notify.repsuk.org";

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

  const res = await fetch(`${GATEWAY_URL}/${MAILGUN_DOMAIN}/messages`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Bearer ${lovableKey}`,
      "X-Connection-Api-Key": mailgunKey,
    },
    body: form,
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
