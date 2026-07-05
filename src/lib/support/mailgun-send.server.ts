// Server-only: sends a single email via Mailgun through the Lovable connector
// gateway. Used by the support module so we can control Message-ID, In-Reply-To,
// and References headers for proper email threading.
//
// For regular transactional/auth emails, use the Lovable email queue instead
// (src/lib/email/send.server.ts) — it handles suppression, retries, and unsubscribe.

const GATEWAY_URL = "https://connector-gateway.lovable.dev/mailgun";
const MAILGUN_DOMAIN = "repsuk.org";
const TRACKING_HOST = "email.repsuk.org";

// Cached result of the domain scheme check. Mailgun rewrites click links on
// its edge using the domain's `web_scheme`, so if that flips back to "http"
// every send would emit http://email.repsuk.org/... links again and Safari
// would re-flag them as phishing. We assert once per worker process.
let httpsSchemeCheck: Promise<void> | null = null;

async function assertHttpsTracking(headers: Record<string, string>): Promise<void> {
  if (!httpsSchemeCheck) {
    httpsSchemeCheck = (async () => {
      const res = await fetch(`${GATEWAY_URL}/domains/${MAILGUN_DOMAIN}`, {
        method: "GET",
        headers: { Authorization: headers.Authorization, "X-Connection-Api-Key": headers["X-Connection-Api-Key"] },
      });
      if (!res.ok) {
        // Fail-open on transient lookup errors so a Mailgun API blip doesn't
        // block outbound mail; retry on the next send.
        httpsSchemeCheck = null;
        return;
      }
      const data = (await res.json().catch(() => null)) as { domain?: { web_scheme?: string } } | null;
      const scheme = data?.domain?.web_scheme;
      if (scheme !== "https") {
        httpsSchemeCheck = null;
        throw new Error(
          `Refusing to send: Mailgun tracking domain ${TRACKING_HOST} is set to '${scheme ?? "unknown"}', expected 'https'. ` +
            `Flip web_scheme to https for ${MAILGUN_DOMAIN} in Mailgun before retrying.`,
        );
      }
    })();
  }
  return httpsSchemeCheck;
}

function assertNoHttpTrackingUrls(html: string, text: string): void {
  const bad = /http:\/\/email\.repsuk\.org\//i;
  if (bad.test(html) || bad.test(text)) {
    throw new Error(
      `Refusing to send: message body contains a plain http://${TRACKING_HOST}/ link. All tracking links must be https.`,
    );
  }
}

// Applies Mailgun `o:tracking-*`, `v:*` and `o:tag` fields onto whichever
// body carrier we're using (FormData for attachments, URLSearchParams
// otherwise). Kept in one place so the two send bodies stay in sync.
function appendMailgunOptions(
  target: FormData | URLSearchParams,
  input: MailgunSendInput,
): void {
  const set = (k: string, v: string) => {
    if (target instanceof FormData) target.append(k, v);
    else target.set(k, v);
  };
  if (input.tracking) {
    set("o:tracking", "yes");
    if (input.tracking.opens !== undefined) {
      set("o:tracking-opens", input.tracking.opens ? "yes" : "no");
    }
    if (input.tracking.clicks !== undefined) {
      set(
        "o:tracking-clicks",
        input.tracking.clicks === "htmlonly"
          ? "htmlonly"
          : input.tracking.clicks
            ? "yes"
            : "no",
      );
    }
  }
  if (input.tag) set("o:tag", input.tag);
  if (input.variables) {
    for (const [k, v] of Object.entries(input.variables)) {
      if (v !== undefined && v !== null) set(`v:${k}`, String(v));
    }
  }
}

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
  // Mailgun `o:` options (opens, clicks). Only relevant for broadcast/campaign
  // sends — 1:1 support replies leave these off so recipients don't see
  // wrapped tracking links in a personal conversation.
  tracking?: {
    opens?: boolean;
    clicks?: boolean | "htmlonly";
  };
  // Mailgun `v:` custom variables. These are echoed back in event webhooks
  // under `event-data.user-variables`, so we tag every campaign send with
  // `campaign_id` + `recipient_id` for correlation.
  variables?: Record<string, string>;
  tag?: string;
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
      const ab = new ArrayBuffer(att.data.byteLength);
      new Uint8Array(ab).set(att.data);
      fd.append(
        "attachment",
        new Blob([ab], { type: att.contentType }),
        att.filename,
      );
    }
    appendMailgunOptions(fd, input);
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
    appendMailgunOptions(form, input);
    body = form;
    headers["Content-Type"] = "application/x-www-form-urlencoded";
  }

  assertNoHttpTrackingUrls(input.html, input.text);
  await assertHttpsTracking(headers);

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
