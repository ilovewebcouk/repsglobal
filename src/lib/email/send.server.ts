import * as React from "react";
import { render } from "@react-email/components";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { TEMPLATES } from "@/lib/email-templates/registry";

// Must match the constants in src/routes/lovable/email/transactional/send.ts.
const SITE_NAME = "repsglobal";
const SENDER_DOMAIN = "notify.dogboss.io";
const FROM_DOMAIN = "notify.dogboss.io";

function generateToken(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

interface ServerSendParams {
  templateName: string;
  recipientEmail: string;
  idempotencyKey?: string;
  templateData?: Record<string, unknown>;
}

/**
 * Server-side transactional email enqueue — for use inside server functions
 * where we don't have a user-bearer token to call the public /lovable/email
 * route. Mirrors the route's pipeline (suppression check, unsubscribe token,
 * render, enqueue, send_log).
 */
export async function sendTransactionalEmailServer(params: ServerSendParams) {
  const { templateName, recipientEmail, idempotencyKey, templateData = {} } = params;
  const template = TEMPLATES[templateName];
  if (!template) throw new Error(`Template '${templateName}' not found`);

  const effectiveRecipient = (template.to as string | undefined) ?? recipientEmail;
  if (!effectiveRecipient) throw new Error("recipientEmail required");

  const normalizedEmail = effectiveRecipient.toLowerCase();
  const messageId = crypto.randomUUID();
  const key = idempotencyKey ?? messageId;

  // 1. Suppression check
  const { data: suppressed } = await supabaseAdmin
    .from("suppressed_emails")
    .select("id")
    .eq("email", normalizedEmail)
    .maybeSingle();
  if (suppressed) {
    await supabaseAdmin.from("email_send_log").insert({
      message_id: messageId,
      template_name: templateName,
      recipient_email: effectiveRecipient,
      status: "suppressed",
    });
    return { success: false, reason: "email_suppressed" as const };
  }

  // 2. Unsubscribe token (one per email)
  let unsubscribeToken: string;
  const { data: existing } = await supabaseAdmin
    .from("email_unsubscribe_tokens")
    .select("token, used_at")
    .eq("email", normalizedEmail)
    .maybeSingle();
  if (existing && !existing.used_at) {
    unsubscribeToken = existing.token;
  } else {
    unsubscribeToken = generateToken();
    await supabaseAdmin
      .from("email_unsubscribe_tokens")
      .upsert(
        { token: unsubscribeToken, email: normalizedEmail },
        { onConflict: "email", ignoreDuplicates: true },
      );
    const { data: stored } = await supabaseAdmin
      .from("email_unsubscribe_tokens")
      .select("token")
      .eq("email", normalizedEmail)
      .maybeSingle();
    if (stored?.token) unsubscribeToken = stored.token;
  }

  // 3. Render
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const element = React.createElement(template.component, templateData as any);
  const html = await render(element);
  const plainText = await render(element, { plainText: true });
  const subject =
    typeof template.subject === "function"
      ? template.subject(templateData)
      : template.subject;

  // 4. Log pending + enqueue
  await supabaseAdmin.from("email_send_log").insert({
    message_id: messageId,
    template_name: templateName,
    recipient_email: effectiveRecipient,
    status: "pending",
  });

  const { error: enqueueError } = await supabaseAdmin.rpc("enqueue_email", {
    queue_name: "transactional_emails",
    payload: {
      message_id: messageId,
      to: effectiveRecipient,
      from: `${SITE_NAME} <noreply@${FROM_DOMAIN}>`,
      sender_domain: SENDER_DOMAIN,
      subject,
      html,
      text: plainText,
      purpose: "transactional",
      label: templateName,
      idempotency_key: key,
      unsubscribe_token: unsubscribeToken,
      queued_at: new Date().toISOString(),
    },
  });
  if (enqueueError) {
    await supabaseAdmin.from("email_send_log").insert({
      message_id: messageId,
      template_name: templateName,
      recipient_email: effectiveRecipient,
      status: "failed",
      error_message: `enqueue failed: ${enqueueError.message}`,
    });
    throw new Error(`Failed to enqueue email: ${enqueueError.message}`);
  }

  return { success: true, queued: true, messageId };
}
