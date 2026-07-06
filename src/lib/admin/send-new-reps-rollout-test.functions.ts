import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/**
 * Send the "new REPS rollout" re-engagement email to a single address so
 * admins can QA it in their own inbox before the bulk run. Same rail as the
 * relaunch test (Mailgun) — bypasses Lovable Emails' 100/hr workspace cap.
 */
export const sendNewRepsRolloutTestEmail = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z.object({ recipientEmail: z.string().email() }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const { data: isAdmin } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    if (!isAdmin) throw new Error("Forbidden");

    const React = await import("react");
    const { render } = await import("@react-email/components");
    const { TEMPLATES } = await import("@/lib/email-templates/registry");
    const tmpl = TEMPLATES["new-reps-rollout"];
    if (!tmpl) throw new Error("new-reps-rollout template missing");

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const element = React.createElement(tmpl.component as any, {});
    const html = await render(element);
    const text = await render(element, { plainText: true });
    const subject =
      typeof tmpl.subject === "function" ? tmpl.subject({}) : tmpl.subject;

    const { sendViaMailgun } = await import("@/lib/email/mailgun.server");
    const result = await sendViaMailgun({
      to: data.recipientEmail,
      subject,
      html,
      text,
      templateName: "new-reps-rollout",
      idempotencyKey: `new-reps-rollout-test-${data.recipientEmail}-${Date.now()}`,
    });
    return { ok: result.ok, result };
  });
