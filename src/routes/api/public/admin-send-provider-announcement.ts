/**
 * One-off admin endpoint: sends the "provider portal is live" announcement +
 * password-recovery link to every training-provider member. Idempotent via
 * `provider-portal-live-<userId>` key.
 *
 * Auth: caller must be signed in as an admin (bearer token in Authorization
 * header, verified against public.has_role('admin')).
 */
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/public/admin-send-provider-announcement")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const auth = request.headers.get("authorization") ?? "";
        const token = auth.replace(/^Bearer\s+/i, "").trim();
        if (!token) return new Response("Unauthorized", { status: 401 });

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const sa = supabaseAdmin as any;

        const { data: userRes, error: uErr } = await sa.auth.getUser(token);
        if (uErr || !userRes?.user?.id) {
          return new Response("Unauthorized", { status: 401 });
        }
        const callerId = userRes.user.id as string;

        const { data: isAdmin, error: rErr } = await sa.rpc("has_role", {
          _user_id: callerId,
          _role: "admin",
        });
        if (rErr || !isAdmin) return new Response("Forbidden", { status: 403 });

        const { sendTransactionalEmailServer } = await import("@/lib/email/send.server");

        const { data: pros, error } = await sa
          .from("professionals")
          .select("id")
          .eq("account_type", "training_provider")
          .eq("is_demo", false);
        if (error) return new Response(error.message, { status: 500 });

        const results: Array<{
          user_id: string;
          email: string | null;
          status: "sent" | "skipped" | "failed";
          detail?: string;
        }> = [];

        for (const p of (pros ?? []) as Array<{ id: string }>) {
          const userId = p.id;
          try {
            const { data: uRes, error: gErr } = await sa.auth.admin.getUserById(userId);
            if (gErr) throw new Error(gErr.message);
            const email = uRes?.user?.email ?? null;
            if (!email) {
              results.push({ user_id: userId, email: null, status: "skipped", detail: "no email" });
              continue;
            }

            const { data: prof } = await sa
              .from("profiles")
              .select("full_name")
              .eq("id", userId)
              .maybeSingle();
            const providerName =
              (prof?.full_name as string | null) || "your training provider";

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

        return Response.json({
          total: results.length,
          sent: results.filter((r) => r.status === "sent").length,
          failed: results.filter((r) => r.status === "failed").length,
          skipped: results.filter((r) => r.status === "skipped").length,
          results,
        });
      },
    },
  },
});
