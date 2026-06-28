// Global Activity Stream — chronological feed of operational events across
// REPS. Distinct from the per-member Flight Recorder. Admin-only, read-only.

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

async function assertAdmin(ctx: { supabase: unknown; userId: string }) {
  const supa = ctx.supabase as { rpc: (n: string, p: object) => Promise<{ data: unknown }> };
  const { data } = await supa.rpc("has_role", { _user_id: ctx.userId, _role: "admin" });
  if (!data) throw new Error("Forbidden");
}

export type ActivityKind =
  | "member_joined"
  | "tier_upgrade"
  | "payment_succeeded"
  | "payment_failed"
  | "payment_refunded"
  | "recovery_completed"
  | "verification_decision"
  | "pro_published"
  | "support_ticket"
  | "review_pending"
  | "email_failure"
  | "cron_failure"
  | "alert_opened"
  | "admin_action";

export interface ActivityEvent {
  ts: string;
  kind: ActivityKind;
  severity: "info" | "warn" | "crit";
  summary: string;
  user_id: string | null;
  href: string | null;
}

const Input = z.object({
  kinds: z.array(z.string()).optional(),
  since: z.string().datetime().optional(),
  limit: z.number().int().min(1).max(500).default(200),
});

export const getActivityStream = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => Input.parse(d ?? {}))
  .handler(async ({ data, context }): Promise<ActivityEvent[]> => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const since = data.since ?? new Date(Date.now() - 24 * 3600_000).toISOString();

    const memberHref = (uid: string | null) =>
      uid ? `/admin/ops/member/${uid}` : null;

    const out: ActivityEvent[] = [];

    const [payRes, subRes, verifRes, ticketsRes, reviewsRes, emailFailRes, alertRes, auditRes, churnRes] =
      await Promise.all([
        supabaseAdmin.from("payment_events")
          .select("id, created_at, event_type, processing_error, user_id, payload, dead_lettered_at")
          .gte("created_at", since)
          .order("created_at", { ascending: false })
          .limit(300),
        supabaseAdmin.from("subscriptions")
          .select("id, created_at, user_id, tier, status")
          .gte("created_at", since)
          .order("created_at", { ascending: false })
          .limit(200),
        supabaseAdmin.from("verification_decisions")
          .select("id, created_at, professional_id, decision, notes")
          .gte("created_at", since)
          .order("created_at", { ascending: false })
          .limit(100),
        supabaseAdmin.from("support_tickets")
          .select("id, created_at, ticket_number, requester_user_id, subject")
          .gte("created_at", since)
          .order("created_at", { ascending: false })
          .limit(100),
        supabaseAdmin.from("reviews")
          .select("id, created_at, professional_id, rating, status")
          .gte("created_at", since)
          .order("created_at", { ascending: false })
          .limit(100),
        supabaseAdmin.from("email_send_log")
          .select("id, created_at, status, template_name, recipient_email")
          .gte("created_at", since)
          .in("status", ["dlq", "failed", "bounced"])
          .order("created_at", { ascending: false })
          .limit(150),
        supabaseAdmin.from("ops_alerts")
          .select("id, opened_at, kind, severity")
          .gte("opened_at", since)
          .order("opened_at", { ascending: false })
          .limit(100),
        supabaseAdmin.from("admin_audit_log")
          .select("id, created_at, actor_id, action, target_id, target_table")
          .gte("created_at", since)
          .order("created_at", { ascending: false })
          .limit(100),
        supabaseAdmin.from("churn_lifecycle")
          .select("id, entered_at, user_id, stage")
          .gte("entered_at", since)
          .eq("stage", "recovered")
          .order("entered_at", { ascending: false })
          .limit(100),
      ]);

    for (const e of (payRes.data ?? []) as Array<{ id: string; created_at: string; event_type: string; processing_error: string | null; user_id: string | null; payload: { amount_total?: number; amount?: number } | null; dead_lettered_at: string | null }>) {
      if (e.event_type === "invoice.payment_succeeded" || e.event_type === "checkout.session.completed") {
        const amount = e.payload?.amount_total ?? e.payload?.amount;
        out.push({
          ts: e.created_at,
          kind: "payment_succeeded",
          severity: "info",
          summary: amount != null
            ? `Payment £${(Number(amount) / 100).toFixed(2)} received`
            : "Payment received",
          user_id: e.user_id,
          href: memberHref(e.user_id),
        });
      } else if (e.event_type === "invoice.payment_failed") {
        out.push({
          ts: e.created_at,
          kind: "payment_failed",
          severity: "crit",
          summary: e.processing_error ? `Payment failed — ${e.processing_error}` : "Payment failed",
          user_id: e.user_id,
          href: memberHref(e.user_id),
        });
      } else if (e.event_type === "charge.refunded") {
        out.push({
          ts: e.created_at,
          kind: "payment_refunded",
          severity: "warn",
          summary: "Refund issued",
          user_id: e.user_id,
          href: memberHref(e.user_id),
        });
      }
    }

    for (const s of (subRes.data ?? []) as Array<{ id: string; created_at: string; user_id: string; tier: string | null; status: string }>) {
      out.push({
        ts: s.created_at,
        kind: s.tier === "core" ? "member_joined" : "tier_upgrade",
        severity: "info",
        summary: s.tier === "core"
          ? "Member joined REPS Core"
          : `Subscribed to ${s.tier ?? "REPS"}`,
        user_id: s.user_id,
        href: memberHref(s.user_id),
      });
    }

    for (const v of (verifRes.data ?? []) as Array<{ id: string; created_at: string; professional_id: string; decision: string; notes: string | null }>) {
      out.push({
        ts: v.created_at,
        kind: "verification_decision",
        severity: v.decision === "approved" ? "info" : "warn",
        summary: v.decision === "approved" ? "Verification approved" : `Verification ${v.decision}`,
        user_id: v.professional_id,
        href: memberHref(v.professional_id),
      });
    }

    for (const t of (ticketsRes.data ?? []) as Array<{ id: string; created_at: string; ticket_number: string | null; user_id: string | null; subject: string | null }>) {
      out.push({
        ts: t.created_at,
        kind: "support_ticket",
        severity: "info",
        summary: `Support ticket ${t.ticket_number ?? ""} — ${t.subject ?? "(no subject)"}`.trim(),
        user_id: t.user_id,
        href: "/admin/support",
      });
    }

    for (const r of (reviewsRes.data ?? []) as Array<{ id: string; created_at: string; professional_id: string; rating: number | null; status: string }>) {
      if (r.status === "pending" || r.status === "needs_review") {
        out.push({
          ts: r.created_at,
          kind: "review_pending",
          severity: "info",
          summary: `New review (${r.rating ?? "?"}★) awaiting moderation`,
          user_id: r.professional_id,
          href: "/admin/reviews",
        });
      }
    }

    for (const e of (emailFailRes.data ?? []) as Array<{ id: string; created_at: string; status: string; template_name: string | null; recipient_email: string | null }>) {
      out.push({
        ts: e.created_at,
        kind: "email_failure",
        severity: e.status === "dlq" ? "crit" : "warn",
        summary: `Email ${e.status}: ${e.template_name ?? "?"} → ${e.recipient_email ?? "?"}`,
        user_id: null,
        href: "/admin/ops/email",
      });
    }

    for (const a of (alertRes.data ?? []) as Array<{ id: string; opened_at: string; kind: string; severity: string }>) {
      out.push({
        ts: a.opened_at,
        kind: "alert_opened",
        severity: (a.severity as "info" | "warn" | "crit") ?? "warn",
        summary: `Alert opened: ${a.kind}`,
        user_id: null,
        href: "/admin/ops/alerts",
      });
    }

    for (const a of (auditRes.data ?? []) as Array<{ id: string; created_at: string; actor_user_id: string | null; action: string; target_user_id: string | null }>) {
      out.push({
        ts: a.created_at,
        kind: "admin_action",
        severity: "info",
        summary: `Admin ${a.action}`,
        user_id: a.target_user_id,
        href: memberHref(a.target_user_id),
      });
    }

    for (const c of (churnRes.data ?? []) as Array<{ id: string; entered_at: string; user_id: string; stage: string }>) {
      out.push({
        ts: c.entered_at,
        kind: "recovery_completed",
        severity: "info",
        summary: "Subscription recovered",
        user_id: c.user_id,
        href: memberHref(c.user_id),
      });
    }

    out.sort((a, b) => (a.ts < b.ts ? 1 : -1));
    let filtered = out;
    if (data.kinds && data.kinds.length > 0) {
      const allowed = new Set(data.kinds);
      filtered = filtered.filter((e) => allowed.has(e.kind));
    }
    return filtered.slice(0, data.limit);
  });
