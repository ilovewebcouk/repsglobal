import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/**
 * Resolve the relaunch audience: every confirmed member + BD-seed members
 * who never signed up, minus admins, demo accounts, and suppressed addresses.
 * Returns { total, sample, bySource } — no sending.
 */
export const previewRelaunchAudience = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: isAdmin } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    if (!isAdmin) throw new Error("Forbidden");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin.rpc("get_relaunch_audience");
    if (error) throw new Error(error.message);

    const rows = (data ?? []) as Array<{ email: string; source: string }>;
    const total = rows.length;
    const bySource = rows.reduce<Record<string, number>>((acc, r) => {
      acc[r.source] = (acc[r.source] ?? 0) + 1;
      return acc;
    }, {});
    const sample = rows.slice(0, 5).map((r) => r.email);
    return { total, bySource, sample };
  });

/**
 * Broadcast the relaunch announcement to the resolved audience.
 * Per-recipient idempotency key prevents duplicate sends if re-run.
 * Confirmation token must literally equal `SEND-${total}` from the most
 * recent preview call to defend against fat-finger runs.
 */
export const sendRelaunchBroadcast = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z.object({ confirmToken: z.string().min(1) }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const { data: isAdmin } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    if (!isAdmin) throw new Error("Forbidden");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: rows, error } = await supabaseAdmin.rpc("get_relaunch_audience");
    if (error) throw new Error(error.message);

    const audience = (rows ?? []) as Array<{ email: string; source: string }>;
    const expected = `SEND-${audience.length}`;
    if (data.confirmToken !== expected) {
      throw new Error(
        `Confirmation mismatch. Audience is ${audience.length}; expected token "${expected}".`,
      );
    }

    const { sendTransactionalEmailServer } = await import("@/lib/email/send.server");

    // Stable broadcast tag — bumping this lets us legitimately re-send to all
    // (e.g. if the relaunch is delayed). Keep it stable for THIS run.
    const broadcastTag = "v1-2026-06-28";

    let queued = 0;
    let skipped = 0;
    const errors: Array<{ email: string; error: string }> = [];

    // Sequential to stay polite to the queue (cron drains ~120/min).
    for (const row of audience) {
      try {
        await sendTransactionalEmailServer({
          templateName: "relaunch-announcement",
          recipientEmail: row.email,
          idempotencyKey: `relaunch-${broadcastTag}-${row.email}`,
          templateData: {},
        });
        queued += 1;
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        // Suppression / dedupe surfaces here as a non-fatal skip.
        if (/suppress|duplicate|already/i.test(msg)) skipped += 1;
        else errors.push({ email: row.email, error: msg });
      }
    }

    return {
      total: audience.length,
      queued,
      skipped,
      failed: errors.length,
      firstErrors: errors.slice(0, 10),
    };
  });
