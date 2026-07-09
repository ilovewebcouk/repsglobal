import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/**
 * Sends the welcome (sign-up) email once per user. Idempotent: uses an
 * idempotency key tied to the user id, so repeated calls (e.g. on auth state
 * changes, page reloads) never re-send.
 */
export const sendWelcomeEmailServerFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const userId = context.userId;
    try {
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      const { data: authUser } = await supabaseAdmin.auth.admin.getUserById(userId);
      const email = authUser?.user?.email ?? null;
      if (!email) return { sent: false, reason: "no_email" as const };
      // Confirmed email only
      if (!authUser?.user?.email_confirmed_at) return { sent: false, reason: "unconfirmed" as const };

      // Idempotency: skip if we've ever enqueued/sent this template to this recipient.
      const { data: prior } = await supabaseAdmin
        .from("email_send_log")
        .select("id")
        .eq("template_name", "welcome-signup")
        .ilike("recipient_email", email)
        .in("status", ["sent", "pending"])
        .limit(1)
        .maybeSingle();
      if (prior) return { sent: false, reason: "already_sent" as const };

      const { data: profile } = await supabaseAdmin
        .from("profiles")
        .select("full_name")
        .eq("id", userId)
        .maybeSingle();

      const first =
        ((profile?.full_name) ?? "")
          .toString()
          .split(" ")[0] || null;

      const { sendTransactionalEmailServer } = await import("@/lib/email/send.server");
      await sendTransactionalEmailServer({
        templateName: "welcome-signup",
        recipientEmail: email,
        idempotencyKey: `welcome-signup:${userId}`,
        templateData: { proName: first },
      });
      return { sent: true };
    } catch (err) {
      console.warn("[welcome-email] failed:", err);
      return { sent: false, reason: "error" as const };
    }
  });
