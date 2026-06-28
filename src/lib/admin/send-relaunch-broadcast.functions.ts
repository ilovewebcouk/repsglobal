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
 * Sends directly via the Mailgun connector (NOT Lovable Emails) so we're
 * not capped by the 100/hr workspace limit — Mailgun is the project's
 * production email rail and every send shows in the Mailgun dashboard.
 *
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

    // Render the React Email template once — body is identical for every recipient.
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

    // Stable broadcast tag — bumping this lets us legitimately re-send to all
    // (e.g. if the relaunch is delayed). Keep it stable for THIS run.
    const broadcastTag = "v1-2026-06-28";

    let queued = 0;
    let skipped = 0;
    const errors: Array<{ email: string; error: string }> = [];

    // Sequential with a tiny pacing delay to be polite to Mailgun.
    for (const row of audience) {
      try {
        const res = await sendViaMailgun({
          to: row.email,
          subject,
          html,
          text,
          templateName: "relaunch-announcement",
          idempotencyKey: `relaunch-${broadcastTag}-${row.email}`,
        });
        if (res.ok) queued += 1;
        else if (res.error === "suppressed") skipped += 1;
        else errors.push({ email: row.email, error: res.error ?? "unknown" });
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        errors.push({ email: row.email, error: msg });
      }
      // ~10/sec pacing
      await new Promise((r) => setTimeout(r, 100));
    }

    return {
      total: audience.length,
      queued,
      skipped,
      failed: errors.length,
      firstErrors: errors.slice(0, 10),
    };
  });
