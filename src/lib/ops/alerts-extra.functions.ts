// Alert operations beyond ack: mute and notes. Admin-only.

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

async function assertAdmin(ctx: { supabase: unknown; userId: string }) {
  const supa = ctx.supabase as { rpc: (n: string, p: object) => Promise<{ data: unknown }> };
  const { data } = await supa.rpc("has_role", { _user_id: ctx.userId, _role: "admin" });
  if (!data) throw new Error("Forbidden");
}

export const muteAlert = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({
      alert_id: z.string().uuid(),
      duration_minutes: z.number().int().min(0).max(60 * 24 * 30),
    }).parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const until = data.duration_minutes === 0
      ? null
      : new Date(Date.now() + data.duration_minutes * 60_000).toISOString();
    const { error } = await supabaseAdmin
      .from("ops_alerts")
      .update({ muted_until: until })
      .eq("id", data.alert_id);
    if (error) throw new Error(error.message);
    return { ok: true as const, muted_until: until };
  });

export const setAlertNotes = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({
      alert_id: z.string().uuid(),
      notes: z.string().max(2000),
    }).parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("ops_alerts")
      .update({ notes: data.notes })
      .eq("id", data.alert_id);
    if (error) throw new Error(error.message);
    return { ok: true as const };
  });

export const sendTestAlertEmail = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { sendTransactionalEmailServer } = await import("@/lib/email/send.server");

    const { data: adminRows } = await supabaseAdmin.rpc("ops_admin_emails" as never);
    const recipients = ((adminRows ?? []) as Array<{ email: string }>)
      .map((r) => r.email)
      .filter((e): e is string => Boolean(e));
    if (recipients.length === 0) throw new Error("No admin recipients found");

    let ok = 0;
    for (const to of recipients) {
      try {
        await sendTransactionalEmailServer({
          templateName: "ops-alert",
          recipientEmail: to,
          idempotencyKey: `ops-alert-test-${Date.now()}-${to}`,
          templateData: {
            kind: "test.notification",
            severity: "info",
            summary: "This is a test alert from REPS Operations.",
            openedAt: new Date().toISOString(),
            href: "https://repsuk.org/admin/ops/alerts",
          },
        });
        ok++;
      } catch { /* continue */ }
    }
    return { sent: ok, total: recipients.length };
  });
