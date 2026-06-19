/**
 * Send a transactional email via the Mailgun connector gateway on the
 * `repsuk.org` domain. Bypasses Lovable Emails so every send is visible in
 * the project-owned Mailgun account (accepted / delivered / failed / complained
 * events surface in Mailgun's dashboard and the connector event log).
 *
 * Logs to `email_send_log` so the admin Email dashboard still works.
 * Skips sends to addresses present in `suppressed_emails`.
 */
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const GATEWAY_URL = "https://connector-gateway.lovable.dev/mailgun";
const MAILGUN_DOMAIN = "repsuk.org";
const FROM_ADDRESS = "REPS <noreply@repsuk.org>";

export interface SendViaMailgunArgs {
  to: string;
  subject: string;
  html: string;
  text?: string;
  templateName: string;
  idempotencyKey: string;
}

export async function sendViaMailgun(args: SendViaMailgunArgs): Promise<{ ok: boolean; mailgunId?: string; error?: string }> {
  const lovableKey = process.env.LOVABLE_API_KEY;
  const connectionKey = process.env.MAILGUN_API_KEY;
  if (!lovableKey || !connectionKey) {
    const err = "Mailgun connector not configured (missing LOVABLE_API_KEY or MAILGUN_API_KEY)";
    await logRow(args, "failed", null, err);
    return { ok: false, error: err };
  }

  // Suppression check
  const { data: suppressed } = await supabaseAdmin
    .from("suppressed_emails")
    .select("email")
    .eq("email", args.to.toLowerCase())
    .maybeSingle();
  if (suppressed) {
    await logRow(args, "suppressed", null, "recipient on suppression list");
    return { ok: false, error: "suppressed" };
  }

  await logRow(args, "pending", null, null);

  const body = new URLSearchParams({
    from: FROM_ADDRESS,
    to: args.to,
    subject: args.subject,
    html: args.html,
    "o:tag": args.templateName,
    "v:idempotency_key": args.idempotencyKey,
  });
  if (args.text) body.set("text", args.text);

  try {
    const res = await fetch(`${GATEWAY_URL}/${MAILGUN_DOMAIN}/messages`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Bearer ${lovableKey}`,
        "X-Connection-Api-Key": connectionKey,
      },
      body,
    });
    const json: any = await res.json().catch(() => ({}));
    if (!res.ok) {
      const err = `Mailgun ${res.status}: ${json?.message || JSON.stringify(json)}`;
      await logRow(args, "failed", null, err);
      return { ok: false, error: err };
    }
    const mailgunId: string | undefined = json?.id;
    await logRow(args, "sent", mailgunId ?? null, null);
    return { ok: true, mailgunId };
  } catch (e) {
    const err = e instanceof Error ? e.message : String(e);
    await logRow(args, "failed", null, err);
    return { ok: false, error: err };
  }
}

async function logRow(
  args: SendViaMailgunArgs,
  status: "pending" | "sent" | "failed" | "suppressed",
  mailgunId: string | null,
  error: string | null,
) {
  try {
    await supabaseAdmin.from("email_send_log").insert({
      message_id: args.idempotencyKey,
      template_name: args.templateName,
      recipient_email: args.to.toLowerCase(),
      status,
      error_message: error,
      metadata: { provider: "mailgun-connector", domain: MAILGUN_DOMAIN, mailgun_id: mailgunId },
    });
  } catch {
    // logging failures must not break sends
  }
}
