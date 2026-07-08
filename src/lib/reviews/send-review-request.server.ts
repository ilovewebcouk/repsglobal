/**
 * Sends a review-request email via Mailgun (not the Lovable queue) so we
 * capture delivered / opened / failed events on `review_requests` through
 * the /api/public/email/events/review-request-mailgun webhook.
 *
 * Renders the same react-email template as the queue path (`review-request`)
 * so the email looks identical.
 */
import * as React from "react";
import { render } from "@react-email/components";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { TEMPLATES } from "@/lib/email-templates/registry";
import { sendViaMailgun } from "@/lib/email/mailgun.server";

function generateToken(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes).map((b) => b.toString(16).padStart(2, "0")).join("");
}

async function getOrCreateUnsubscribeToken(email: string): Promise<string> {
  const { data: existing } = await supabaseAdmin
    .from("email_unsubscribe_tokens")
    .select("token, used_at")
    .eq("email", email)
    .maybeSingle();
  if (existing && !existing.used_at) return existing.token;

  const token = generateToken();
  await supabaseAdmin
    .from("email_unsubscribe_tokens")
    .upsert({ token, email }, { onConflict: "email", ignoreDuplicates: true });
  const { data: stored } = await supabaseAdmin
    .from("email_unsubscribe_tokens")
    .select("token")
    .eq("email", email)
    .maybeSingle();
  return stored?.token ?? token;
}

function unsubscribeFooterHtml(unsubUrl: string): string {
  // Matches the visual tone of review-request.tsx footer (12px, muted grey).
  return `
  <div style="max-width:560px;margin:0 auto;padding:0 24px 32px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
    <hr style="border:none;border-top:1px solid #eaecef;margin:16px 0 12px;" />
    <p style="font-size:12px;color:#8a8f99;margin:0;line-height:1.5;">
      Don't want these emails?
      <a href="${unsubUrl}" style="color:#8a8f99;text-decoration:underline;">Unsubscribe</a>.
    </p>
  </div>`;
}

function unsubscribeFooterText(unsubUrl: string): string {
  return `\n\n---\nDon't want these emails? Unsubscribe: ${unsubUrl}\n`;
}

interface SendArgs {
  reviewRequestId: string;
  recipientEmail: string;
  templateData: {
    proName: string;
    reviewUrl: string;
    serviceLabel?: string | null;
    clientName?: string | null;
  };
}

export async function sendReviewRequestViaMailgun(args: SendArgs) {
  const template = TEMPLATES["review-request"];
  if (!template) throw new Error("review-request template not registered");

  const normalized = args.recipientEmail.toLowerCase();
  const unsubToken = await getOrCreateUnsubscribeToken(normalized);
  const unsubUrl = `https://repsuk.org/unsubscribe?token=${unsubToken}`;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const element = React.createElement(template.component as any, args.templateData as any);
  const bodyHtml = await render(element);
  const bodyText = await render(element, { plainText: true });

  // Inject unsubscribe footer just before </body> so header/branding stays
  // pixel-identical to the queue-path template.
  const html = bodyHtml.includes("</body>")
    ? bodyHtml.replace("</body>", `${unsubscribeFooterHtml(unsubUrl)}</body>`)
    : bodyHtml + unsubscribeFooterHtml(unsubUrl);
  const text = bodyText + unsubscribeFooterText(unsubUrl);

  const subject =
    typeof template.subject === "function"
      ? template.subject(args.templateData as Record<string, unknown>)
      : template.subject;

  const result = await sendViaMailgun({
    to: args.recipientEmail,
    subject,
    html,
    text,
    templateName: "review-request",
    idempotencyKey: `review-request:${args.reviewRequestId}`,
    trackOpens: true,
    trackClicks: "htmlonly",
    variables: { review_request_id: args.reviewRequestId },
  });

  if (result.ok && result.mailgunId && !result.skippedDuplicate) {
    await supabaseAdmin
      .from("review_requests")
      .update({ mailgun_message_id: result.mailgunId })
      .eq("id", args.reviewRequestId);
  }

  return result;
}
