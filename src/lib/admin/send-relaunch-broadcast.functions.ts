import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const RELAUNCH_BROADCAST_TAG = "v1-2026-06-28";
const MAX_NEW_SENDS_PER_RUN = 75;
const SEND_DELAY_MS = 650;

function isMailgunThrottle(error?: string | null) {
  if (!error) return false;
  return (
    /\b420\b/.test(error) ||
    /\b429\b/.test(error) ||
    /recipient limit exceeded/i.test(error) ||
    /request limit exceeded/i.test(error) ||
    /sending too fast/i.test(error)
  );
}

function parseRetryAt(error?: string | null, retryAfter?: string | null) {
  const direct = retryAfter ? Date.parse(retryAfter) : NaN;
  if (Number.isFinite(direct)) return new Date(direct).toISOString();

  const match = error?.match(/try again after ([^"}\n]+?)(?:["}]|$)/i);
  if (!match) return null;
  const parsed = Date.parse(match[1].trim());
  return Number.isFinite(parsed) ? new Date(parsed).toISOString() : null;
}

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
 * Status snapshot — no sending. Counts how many of the relaunch audience
 * have already been accepted by Mailgun (status = 'sent') for the current
 * broadcast tag, and how many are still outstanding.
 */
export const getRelaunchBroadcastStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: isAdmin } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    if (!isAdmin) throw new Error("Forbidden");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: aud, error: audErr } = await supabaseAdmin.rpc("get_relaunch_audience");
    if (audErr) throw new Error(audErr.message);
    const audience = (aud ?? []) as Array<{ email: string; source: string }>;
    const total = audience.length;

    // Pull sent log rows for this broadcast tag (template_name + tag in message_id)
    const { data: sentRows } = await supabaseAdmin
      .from("email_send_log")
      .select("recipient_email, status, created_at")
      .like("message_id", `relaunch-${RELAUNCH_BROADCAST_TAG}-%`)
      .eq("status", "sent")
      .order("created_at", { ascending: false })
      .limit(2000);

    const sentSet = new Set(
      ((sentRows ?? []) as Array<{ recipient_email: string }>).map((r) =>
        r.recipient_email.toLowerCase(),
      ),
    );
    let alreadySent = 0;
    for (const r of audience) if (sentSet.has(r.email.toLowerCase())) alreadySent += 1;

    const remaining = Math.max(0, total - alreadySent);
    const lastSentAt = (sentRows?.[0] as { created_at?: string } | undefined)?.created_at ?? null;

    return {
      total,
      alreadySent,
      remaining,
      lastSentAt,
      broadcastTag: RELAUNCH_BROADCAST_TAG,
    };
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
    const broadcastTag = RELAUNCH_BROADCAST_TAG;

    const { data: sentRows, error: sentRowsError } = await supabaseAdmin
      .from("email_send_log")
      .select("message_id")
      .eq("template_name", "relaunch-announcement")
      .eq("status", "sent")
      .like("message_id", `relaunch-${broadcastTag}-%`)
      .limit(1000);
    if (sentRowsError) throw new Error(sentRowsError.message);
    const alreadySentKeys = new Set((sentRows ?? []).map((row) => row.message_id));

    let sent = 0;
    let alreadySent = 0;
    let skipped = 0;
    let failed = 0;
    let processedThisRun = 0;
    let paused = false;
    let retryAt: string | null = null;
    let pauseReason: string | null = null;
    const errors: Array<{ email: string; error: string }> = [];

    // Sequential with safe pacing. Mailgun can return 420 recipient-limit
    // throttles; those must pause the run rather than marking the rest failed.
    for (const row of audience) {
      const idempotencyKey = `relaunch-${broadcastTag}-${row.email}`;
      if (alreadySentKeys.has(idempotencyKey)) {
        alreadySent += 1;
        continue;
      }

      if (processedThisRun >= MAX_NEW_SENDS_PER_RUN) {
        paused = true;
        pauseReason = `Paused after ${MAX_NEW_SENDS_PER_RUN} new sends to stay inside Mailgun limits. Run it again to continue.`;
        break;
      }

      try {
        const res = await sendViaMailgun({
          to: row.email,
          subject,
          html,
          text,
          templateName: "relaunch-announcement",
          idempotencyKey,
        });
        processedThisRun += 1;
        if (res.ok && res.skippedDuplicate) alreadySent += 1;
        else if (res.ok) sent += 1;
        else if (res.error === "suppressed") skipped += 1;
        else if (isMailgunThrottle(res.error)) {
          paused = true;
          retryAt = parseRetryAt(res.error, res.retryAfter);
          pauseReason = retryAt
            ? `Mailgun asked us to pause until ${retryAt}. Run it again after that time.`
            : "Mailgun asked us to pause for rate limiting. Run it again shortly.";
          errors.push({ email: row.email, error: pauseReason });
          break;
        } else {
          failed += 1;
          errors.push({ email: row.email, error: res.error ?? "unknown" });
        }
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        if (isMailgunThrottle(msg)) {
          paused = true;
          retryAt = parseRetryAt(msg, null);
          pauseReason = retryAt
            ? `Mailgun asked us to pause until ${retryAt}. Run it again after that time.`
            : "Mailgun asked us to pause for rate limiting. Run it again shortly.";
          errors.push({ email: row.email, error: pauseReason });
          break;
        }
        failed += 1;
        errors.push({ email: row.email, error: msg });
      }
      await new Promise((r) => setTimeout(r, SEND_DELAY_MS));
    }

    const accepted = alreadySent + sent;
    const remaining = Math.max(0, audience.length - accepted - skipped - failed);

    return {
      total: audience.length,
      queued: accepted,
      sent,
      alreadySent,
      skipped,
      failed,
      remaining,
      paused,
      retryAt,
      pauseReason,
      firstErrors: errors.slice(0, 10),
    };
  });
