import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/**
 * "New REPS rollout" re-engagement broadcast. Mirrors the relaunch broadcast:
 * same audience RPC (`get_relaunch_audience` — every confirmed member +
 * BD-seed members minus admins / demo / suppressed), same Mailgun rail,
 * same pacing / pause-on-throttle safety, per-recipient idempotency.
 *
 * Uses a distinct broadcast tag + template so it can't collide with the
 * original relaunch send in `email_send_log`.
 */
const BROADCAST_TAG = "v1-2026-07-06";
const TEMPLATE_NAME = "new-reps-rollout";
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

export const previewNewRepsRolloutAudience = createServerFn({ method: "POST" })
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

export const getNewRepsRolloutStatus = createServerFn({ method: "POST" })
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

    const { data: sentRows } = await supabaseAdmin
      .from("email_send_log")
      .select("recipient_email, status, created_at")
      .like("message_id", `${TEMPLATE_NAME}-${BROADCAST_TAG}-%`)
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
      broadcastTag: BROADCAST_TAG,
    };
  });

export const sendNewRepsRolloutBroadcast = createServerFn({ method: "POST" })
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

    const React = await import("react");
    const { render } = await import("@react-email/components");
    const { TEMPLATES } = await import("@/lib/email-templates/registry");
    const tmpl = TEMPLATES[TEMPLATE_NAME];
    if (!tmpl) throw new Error(`${TEMPLATE_NAME} template missing`);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const element = React.createElement(tmpl.component as any, {});
    const html = await render(element);
    const text = await render(element, { plainText: true });
    const subject =
      typeof tmpl.subject === "function" ? tmpl.subject({}) : tmpl.subject;

    const { sendViaMailgun } = await import("@/lib/email/mailgun.server");

    const { data: sentRows, error: sentRowsError } = await supabaseAdmin
      .from("email_send_log")
      .select("message_id")
      .eq("template_name", TEMPLATE_NAME)
      .eq("status", "sent")
      .like("message_id", `${TEMPLATE_NAME}-${BROADCAST_TAG}-%`)
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

    for (const row of audience) {
      const idempotencyKey = `${TEMPLATE_NAME}-${BROADCAST_TAG}-${row.email}`;
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
          templateName: TEMPLATE_NAME,
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
