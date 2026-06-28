import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const sendRelaunchTestEmail = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z.object({ recipientEmail: z.string().email() }).parse(d),
  )
  .handler(async ({ data, context }) => {
    // Admin-only
    const { data: isAdmin } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    if (!isAdmin) throw new Error("Forbidden");

    // Send via Mailgun (same rail as every other REPs transactional email)
    // so it bypasses Lovable Emails' 100/hr workspace cap and shows in Mailgun.
    const React = await import("react");
    const { render } = await import("@react-email/components");
    const { TEMPLATES } = await import("@/lib/email-templates/registry");
    const tmpl = TEMPLATES["relaunch-announcement"];
    if (!tmpl) throw new Error("relaunch-announcement template missing");

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
      templateName: "relaunch-announcement",
      idempotencyKey: `relaunch-test-${data.recipientEmail}-${Date.now()}`,
    });
    return { ok: result.ok, result };
  });
