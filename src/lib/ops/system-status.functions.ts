// Operations Overview status strip — distills a green/amber/red status for
// Billing · Platform · Emails · Queues · Storage by reusing existing
// Platform Health + Connectivity snapshots. Admin-only.

import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

async function assertAdmin(ctx: { supabase: unknown; userId: string }) {
  const supa = ctx.supabase as { rpc: (n: string, p: object) => Promise<{ data: unknown }> };
  const { data } = await supa.rpc("has_role", { _user_id: ctx.userId, _role: "admin" });
  if (!data) throw new Error("Forbidden");
}

export type StatusTone = "green" | "amber" | "red";

export interface SystemStatusTile {
  key: "billing" | "platform" | "emails" | "queues" | "storage";
  label: string;
  tone: StatusTone;
  detail: string;
  href: string;
}

export interface SystemStatusDTO {
  tiles: SystemStatusTile[];
  checked_at: string;
}

function worst(a: StatusTone, b: StatusTone): StatusTone {
  const rank: Record<StatusTone, number> = { green: 0, amber: 1, red: 2 };
  return rank[a] >= rank[b] ? a : b;
}

export const getSystemStatus = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<SystemStatusDTO> => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    let snap: Record<string, number> = {};
    try {
      const { data } = await supabaseAdmin.rpc("platform_health_snapshot" as never);
      snap = (data ?? {}) as Record<string, number>;
    } catch { /* leave snap empty → amber */ }

    // Storage probe (cheap, never throws)
    let storageOk = true;
    try {
      const { error } = await supabaseAdmin.storage.listBuckets();
      storageOk = !error;
    } catch { storageOk = false; }

    const failedActive = Number(snap.failed_payments_active ?? 0);
    const webhookDlq = Number(snap.dlq_webhook_events_7d ?? 0);
    const stuckPay = Number(snap.stuck_payment_events ?? 0);
    const billingTone: StatusTone = webhookDlq > 0 || stuckPay > 0 || failedActive >= 5
      ? "red"
      : failedActive > 0
      ? "amber"
      : "green";

    const cronFails = Number(snap.cron_failures_24h ?? 0);
    const orphan = Number(snap.orphan_subscriptions ?? 0);
    const platformTone: StatusTone = cronFails >= 5
      ? "red"
      : cronFails > 0 || orphan > 0
      ? "amber"
      : "green";

    const emailDlq = Number(snap.dlq_emails_7d ?? 0);
    const stuckEmails = Number(snap.stuck_pending_emails ?? 0);
    const supp7 = Number(snap.suppressions_7d ?? 0);
    const emailsTone: StatusTone = emailDlq > 0 || stuckEmails > 10
      ? "red"
      : supp7 > 25 || stuckEmails > 0
      ? "amber"
      : "green";

    const qtx = Number(snap.queue_transactional ?? 0);
    const qauth = Number(snap.queue_auth ?? 0);
    const qDepth = qtx + qauth;
    const queuesTone: StatusTone = qDepth >= 500 ? "red" : qDepth >= 100 ? "amber" : "green";

    const storageTone: StatusTone = storageOk ? "green" : "red";

    return {
      tiles: [
        {
          key: "billing",
          label: "Billing",
          tone: worst(billingTone, "green"),
          detail: failedActive > 0
            ? `${failedActive} failed payment${failedActive === 1 ? "" : "s"} active`
            : webhookDlq > 0
            ? `${webhookDlq} webhook DLQ`
            : "All clear",
          href: "/admin/ops/billing",
        },
        {
          key: "platform",
          label: "Platform",
          tone: platformTone,
          detail: cronFails > 0
            ? `${cronFails} cron failure${cronFails === 1 ? "" : "s"} in 24h`
            : orphan > 0
            ? `${orphan} orphan subscriptions`
            : "All clear",
          href: "/admin/ops/platform",
        },
        {
          key: "emails",
          label: "Emails",
          tone: emailsTone,
          detail: emailDlq > 0
            ? `${emailDlq} email${emailDlq === 1 ? "" : "s"} in DLQ (7d)`
            : stuckEmails > 0
            ? `${stuckEmails} pending`
            : "All clear",
          href: "/admin/ops/email",
        },
        {
          key: "queues",
          label: "Queues",
          tone: queuesTone,
          detail: qDepth > 0 ? `${qDepth.toLocaleString()} queued` : "Empty",
          href: "/admin/ops/platform",
        },
        {
          key: "storage",
          label: "Storage",
          tone: storageTone,
          detail: storageOk ? "Reachable" : "Unreachable",
          href: "/admin/ops/platform",
        },
      ],
      checked_at: new Date().toISOString(),
    };
  });
