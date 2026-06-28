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

    const { sendTransactionalEmailServer } = await import("@/lib/email/send.server");
    const result = await sendTransactionalEmailServer({
      templateName: "relaunch-announcement",
      recipientEmail: data.recipientEmail,
      idempotencyKey: `relaunch-test-${data.recipientEmail}-${Date.now()}`,
      templateData: {},
    });
    return { ok: true, result };
  });
