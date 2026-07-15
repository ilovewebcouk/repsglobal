/**
 * One-off admin server function: send the "provider portal is live" announcement
 * + password-reset link to every training-provider member that hasn't received
 * it yet. Idempotency key `provider-portal-live-<userId>` prevents double-sends.
 */
import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

async function assertAdmin(context: { supabase: any; userId: string }) {
  const { data, error } = await context.supabase.rpc("has_role", {
    _user_id: context.userId,
    _role: "admin",
  });
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Forbidden");
}

export const sendProviderPortalAnnouncement = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { sendTransactionalEmailServer } = await import("@/lib/email/send.server");
    const sa = supabaseAdmin as any;

    const { data: pros, error } = await sa
      .from("professionals")
      .select("id, slug")
      .eq("account_type", "training_provider")
      .eq("is_demo", false);
    if (error) throw new Error(error.message);

    const results: Array<{
      user_id: string;
      email: string | null;
      status: "sent" | "skipped" | "failed";
      detail?: string;
    }> = [];

    for (const p of (pros ?? []) as Array<{ id: string; slug: string | null }>) {
      const userId = p.id;
      try {
        const { data: userRes, error: uErr } = await sa.auth.admin.getUserById(userId);
        if (uErr) throw new Error(uErr.message);
        const email = userRes?.user?.email ?? null;
        if (!email) {
          results.push({ user_id: userId, email: null, status: "skipped", detail: "no email" });
          continue;
        }

        const { data: prof } = await sa
          .from("profiles")
          .select("full_name")
          .eq("id", userId)
          .maybeSingle();
        const providerName = (prof?.full_name as string | null) || "your training provider";

        // Generate a password-recovery link so the provider can set a password
        // and reach the dashboard.
        const { data: linkData, error: linkErr } = await sa.auth.admin.generateLink({
          type: "recovery",
          email,
          options: { redirectTo: "https://repsuk.org/dashboard" },
        });
        if (linkErr) throw new Error(`generateLink: ${linkErr.message}`);
        const passwordSetUrl = linkData?.properties?.action_link ?? undefined;

        await sendTransactionalEmailServer({
          templateName: "provider-portal-is-live",
          recipientEmail: email,
          idempotencyKey: `provider-portal-live-${userId}`,
          templateData: {
            providerName,
            passwordSetUrl,
            alreadyRegistered: true,
            emailAddress: email,
          },
        });

        results.push({ user_id: userId, email, status: "sent" });
      } catch (e) {
        results.push({
          user_id: userId,
          email: null,
          status: "failed",
          detail: e instanceof Error ? e.message : String(e),
        });
      }
    }

    return {
      total: results.length,
      sent: results.filter((r) => r.status === "sent").length,
      failed: results.filter((r) => r.status === "failed").length,
      skipped: results.filter((r) => r.status === "skipped").length,
      results,
    };
  });
