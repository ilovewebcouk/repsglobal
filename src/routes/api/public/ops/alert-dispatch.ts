// Cron-callable dispatcher: emails admins about newly-opened CRIT alerts that
// haven't been notified yet. Idempotent via email_dispatched_at column.
// Auth: bypassed by /api/public/* prefix; pg_cron passes the project apikey
// header but we don't strictly require it because there's no PII exposed in
// either direction and the worst case is a no-op when nothing is pending.

import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/public/ops/alert-dispatch")({
  server: {
    handlers: {
      POST: async () => handle(),
      GET: async () => handle(),
    },
  },
});

async function handle() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { sendTransactionalEmailServer } = await import("@/lib/email/send.server");

  // 1. Pending CRIT alerts that opened in the last 24h and have not been
  //    emailed yet, and are not currently muted.
  const since = new Date(Date.now() - 24 * 3600_000).toISOString();
  const { data: pending, error } = await supabaseAdmin
    .from("ops_alerts")
    .select("id, kind, severity, opened_at, context, muted_until")
    .eq("severity", "crit")
    .is("email_dispatched_at", null)
    .is("resolved_at", null)
    .gte("opened_at", since)
    .order("opened_at", { ascending: true })
    .limit(20);
  if (error) return Response.json({ ok: false, error: error.message }, { status: 500 });
  if (!pending || pending.length === 0) return Response.json({ ok: true, sent: 0 });

  // 2. Admin recipients
  const { data: adminRows } = await supabaseAdmin.rpc("ops_admin_emails" as never);
  const recipients = ((adminRows ?? []) as Array<{ email: string }>)
    .map((r) => r.email)
    .filter((e): e is string => Boolean(e));
  if (recipients.length === 0) {
    // Mark dispatched so we don't loop forever if nobody is configured.
    await supabaseAdmin
      .from("ops_alerts")
      .update({ email_dispatched_at: new Date().toISOString() })
      .in("id", pending.map((p) => p.id));
    return Response.json({ ok: true, sent: 0, note: "no_recipients" });
  }

  let sent = 0;
  for (const alert of pending) {
    const now = alert.muted_until ? new Date(alert.muted_until) > new Date() : false;
    if (now) continue;

    const summary = summarise(alert.kind, alert.context as Record<string, unknown> | null);
    for (const to of recipients) {
      try {
        await sendTransactionalEmailServer({
          templateName: "ops-alert",
          recipientEmail: to,
          idempotencyKey: `ops-alert-${alert.id}-${to}`,
          templateData: {
            kind: alert.kind,
            severity: alert.severity,
            summary,
            openedAt: alert.opened_at,
            href: "https://repsuk.org/admin",
          },
        });
        sent++;
      } catch { /* keep going for other recipients */ }
    }
    await supabaseAdmin
      .from("ops_alerts")
      .update({ email_dispatched_at: new Date().toISOString() })
      .eq("id", alert.id);
  }
  return Response.json({ ok: true, sent });
}

function summarise(kind: string, ctx: Record<string, unknown> | null): string {
  const c = ctx ?? {};
  switch (kind) {
    case "cron.failed":
      return `Cron failures detected (${c.failures_24h ?? "?"} in 24h).`;
    case "webhook.dlq":
      return `Stripe webhook events in DLQ (${c.dlq_7d ?? "?"} in 7d).`;
    case "email.dlq":
      return `Emails dead-lettered (${c.dlq_7d ?? "?"} in 7d).`;
    case "email.queue_backing_up":
      return `Email queue depth elevated (tx=${c.queue_transactional ?? "?"}, auth=${c.queue_auth ?? "?"}).`;
    case "payments.failed_active":
      return `${c.count ?? "?"} active failed payments need recovery.`;
    case "payments.failure_spike":
      return `Payment failures today ${c.today ?? "?"} vs 7d avg ${c.avg_7d ?? "?"}.`;
    case "payments.refund_spike":
      return `${c.today ?? "?"} refunds today.`;
    default:
      return `Operations alert: ${kind}.`;
  }
}
