// Unified Activity Feed — Admin Activity v1.
//
// PURPOSE
//   Read-through union of operational events for the /admin/activity console.
//   Read-only. NOT the source of truth for billing, visibility, or any
//   business decision. Source-of-truth tables (Stripe mirror, subscriptions,
//   payment_events, disputes, verification_decisions) remain canonical.
//
//   Per-source fetches run in parallel via safeFetch. If one source fails the
//   feed still renders, the failure is logged to ops_alerts, and the caller
//   receives `degraded_sources` so the UI can surface a partial-feed warning.
//
// NOT TOUCHED
//   src/lib/ops/timeline.functions.ts (powers Member 360 per-user timeline).
//   That file is intentionally separate; M360 keeps its own implementation.

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { tierLabel, subscriptionStatusLabel, countryDisplay } from "@/lib/activity/labels";

async function assertAdmin(ctx: { supabase: unknown; userId: string }) {
  const supa = ctx.supabase as { rpc: (n: string, p: object) => Promise<{ data: unknown }> };
  const { data } = await supa.rpc("has_role", { _user_id: ctx.userId, _role: "admin" });
  if (!data) throw new Error("Forbidden");
}

export type ActivitySeverity = "info" | "success" | "warning" | "critical";
export type ActivitySource =
  | "auth"
  | "session"
  | "payment"
  | "subscription"
  | "dispute"
  | "review"
  | "verification"
  | "support"
  | "enquiry"
  | "admin_audit"
  | "impersonation"
  | "email";

export interface ActivityEvent {
  id: string;
  ts: string;
  source: ActivitySource;
  type: string;
  severity: ActivitySeverity;
  summary: string;
  user_id?: string | null;
  user_label?: string | null;
  amount_pence?: number | null;
  url?: string | null;
}

export interface ActivityFeedResult {
  events: ActivityEvent[];
  counts: { total: number; bySeverity: Record<ActivitySeverity, number> };
  needs_attention: ActivityEvent[];
  degraded_sources: string[];
  online_now: number;
  generated_at: string;
}

const Input = z.object({
  limit: z.number().int().min(10).max(500).default(150),
  since_hours: z.number().int().min(1).max(24 * 30).default(24),
  source: z.string().optional(),
  severity: z.enum(["info", "success", "warning", "critical"]).optional(),
});

async function safeFetch<T>(
  label: string,
  fn: () => Promise<T[]>,
  bag: { degraded: string[] },
): Promise<T[]> {
  try {
    return await fn();
  } catch (err) {
    bag.degraded.push(label);
    console.error(`[activity-feed] source "${label}" failed`, err);
    return [];
  }
}

export const getActivityFeed = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => Input.parse(d ?? {}))
  .handler(async ({ data, context }): Promise<ActivityFeedResult> => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const since = new Date(Date.now() - data.since_hours * 3600 * 1000).toISOString();
    const cap = data.limit;
    const degraded: string[] = [];
    const bag = { degraded };

    async function labelUsers(ids: (string | null | undefined)[]): Promise<Map<string, string>> {
      const unique = Array.from(new Set(ids.filter((x): x is string => Boolean(x))));
      if (unique.length === 0) return new Map();
      const map = new Map<string, string>();
      try {
        const { data: rows } = await supabaseAdmin
          .from("profiles")
          .select("id, full_name, display_name")
          .in("id", unique);
        for (const r of (rows ?? []) as Array<{ id: string; full_name: string | null; display_name: string | null }>) {
          map.set(r.id, r.full_name || r.display_name || r.id.slice(0, 8));
        }
      } catch {
        /* labels are nice-to-have */
      }
      return map;
    }

    const [
      auth, sessions, payments, subs, disputes, reviews,
      verif, support, enquiries, audit, impersonation, emails,
    ] = await Promise.all([
      safeFetch("auth", async () => {
        const { data, error } = await supabaseAdmin
          .from("auth_events")
          .select("id, user_id, event, created_at, country_code, device")
          .gte("created_at", since)
          .order("created_at", { ascending: false })
          .limit(cap);
        if (error) throw error;
        return (data ?? []) as Array<{ id: string; user_id: string | null; event: string; created_at: string; country_code: string | null; device: string | null }>;
      }, bag),
      safeFetch("session", async () => {
        const { data, error } = await supabaseAdmin
          .from("user_sessions")
          .select("id, user_id, started_at, country_code, device, browser, pages_viewed, last_seen_at")
          .gte("started_at", since)
          .order("started_at", { ascending: false })
          .limit(cap);
        if (error) throw error;
        return (data ?? []) as Array<{ id: string; user_id: string | null; started_at: string; country_code: string | null; device: string | null; browser: string | null; pages_viewed: number; last_seen_at: string }>;
      }, bag),
      safeFetch("payment", async () => {
        const { data, error } = await supabaseAdmin
          .from("payment_events")
          .select("id, user_id, event_type, created_at, payload")
          .gte("created_at", since)
          .order("created_at", { ascending: false })
          .limit(cap);
        if (error) throw error;
        return (data ?? []) as Array<{ id: string; user_id: string | null; event_type: string; created_at: string; payload: unknown }>;
      }, bag),
      safeFetch("subscription", async () => {
        const { data, error } = await supabaseAdmin
          .from("subscriptions")
          .select("id, user_id, status, tier, updated_at")
          .gte("updated_at", since)
          .order("updated_at", { ascending: false })
          .limit(cap);
        if (error) throw error;
        return (data ?? []) as Array<{ id: string; user_id: string | null; status: string; tier: string | null; updated_at: string }>;
      }, bag),
      safeFetch("dispute", async () => {
        const { data, error } = await supabaseAdmin
          .from("disputes")
          .select("id, user_id, status, reason, amount_pence, opened_at")
          .gte("opened_at", since)
          .order("opened_at", { ascending: false })
          .limit(cap);
        if (error) throw error;
        return (data ?? []) as Array<{ id: string; user_id: string | null; status: string; reason: string | null; amount_pence: number | null; opened_at: string }>;
      }, bag),
      safeFetch("review", async () => {
        const { data, error } = await supabaseAdmin
          .from("reviews")
          .select("id, client_user_id, professional_id, rating, moderation_status, created_at")
          .gte("created_at", since)
          .order("created_at", { ascending: false })
          .limit(cap);
        if (error) throw error;
        return (data ?? []) as Array<{ id: string; client_user_id: string | null; professional_id: string; rating: number; moderation_status: string; created_at: string }>;
      }, bag),
      safeFetch("verification", async () => {
        const { data, error } = await supabaseAdmin
          .from("verification_decisions")
          .select("id, professional_id, decision, created_at, unlocked_tier")
          .gte("created_at", since)
          .order("created_at", { ascending: false })
          .limit(cap);
        if (error) throw error;
        return (data ?? []) as Array<{ id: string; professional_id: string; decision: string; created_at: string; unlocked_tier: string | null }>;
      }, bag),
      safeFetch("support", async () => {
        const { data, error } = await supabaseAdmin
          .from("support_messages")
          .select("id, ticket_id, author_user_id, direction, created_at")
          .gte("created_at", since)
          .order("created_at", { ascending: false })
          .limit(cap);
        if (error) throw error;
        return (data ?? []) as Array<{ id: string; ticket_id: string; author_user_id: string | null; direction: string; created_at: string }>;
      }, bag),
      safeFetch("enquiry", async () => {
        const { data, error } = await supabaseAdmin
          .from("enquiries")
          .select("id, professional_id, sender_email, created_at")
          .gte("created_at", since)
          .order("created_at", { ascending: false })
          .limit(cap);
        if (error) throw error;
        return (data ?? []) as Array<{ id: string; professional_id: string; sender_email: string; created_at: string }>;
      }, bag),
      safeFetch("admin_audit", async () => {
        const { data, error } = await supabaseAdmin
          .from("admin_audit_log")
          .select("id, actor_id, action, target_table, target_id, created_at")
          .gte("created_at", since)
          .order("created_at", { ascending: false })
          .limit(cap);
        if (error) throw error;
        return (data ?? []) as Array<{ id: string; actor_id: string; action: string; target_table: string | null; target_id: string | null; created_at: string }>;
      }, bag),
      safeFetch("impersonation", async () => {
        const { data, error } = await supabaseAdmin
          .from("admin_impersonation_sessions")
          .select("id, admin_id, professional_id, started_at, ended_at, ended_reason")
          .gte("started_at", since)
          .order("started_at", { ascending: false })
          .limit(cap);
        if (error) throw error;
        return (data ?? []) as Array<{ id: string; admin_id: string; professional_id: string; started_at: string; ended_at: string | null; ended_reason: string | null }>;
      }, bag),
      safeFetch("email", async () => {
        const { data, error } = await supabaseAdmin
          .from("email_send_log")
          .select("id, recipient_email, template_name, status, created_at, error_message")
          .gte("created_at", since)
          .in("status", ["failed", "dlq"])
          .order("created_at", { ascending: false })
          .limit(cap);
        if (error) throw error;
        return (data ?? []) as Array<{ id: string; recipient_email: string; template_name: string; status: string; created_at: string; error_message: string | null }>;
      }, bag),
    ]);

    // ---- Identity labels ----
    const userLabels = await labelUsers([
      ...auth.map((r) => r.user_id),
      ...sessions.map((r) => r.user_id),
      ...payments.map((r) => r.user_id),
      ...subs.map((r) => r.user_id),
      ...disputes.map((r) => r.user_id),
      ...reviews.map((r) => r.client_user_id),
      ...verif.map((r) => r.professional_id),
      ...support.map((r) => r.author_user_id),
      ...enquiries.map((r) => r.professional_id),
      ...audit.map((r) => r.actor_id),
      ...impersonation.map((r) => r.admin_id),
      ...impersonation.map((r) => r.professional_id),
    ]);

    const events: ActivityEvent[] = [];

    for (const r of auth) {
      const sev: ActivitySeverity = r.event === "sign_in_failed" ? "warning" : "info";
      events.push({
        id: `auth:${r.id}`,
        ts: r.created_at,
        source: "auth",
        type: r.event,
        severity: sev,
        summary: `${r.event.replaceAll("_", " ")} · ${userLabels.get(r.user_id ?? "") ?? "unknown"}`,
        user_id: r.user_id,
        user_label: userLabels.get(r.user_id ?? "") ?? null,
      });
    }

    for (const r of sessions) {
      events.push({
        id: `session:${r.id}`,
        ts: r.started_at,
        source: "session",
        type: "session_started",
        severity: "info",
        summary: `Session · ${userLabels.get(r.user_id ?? "") ?? "unknown"} · ${r.device ?? "device?"} · ${countryDisplay(r.country_code).label}`,
        user_id: r.user_id,
        user_label: userLabels.get(r.user_id ?? "") ?? null,
      });
    }

    for (const r of payments) {
      const failed = /failed|refund|action|dispute/i.test(r.event_type);
      const amount = (r.payload as { data?: { object?: { amount?: number } } } | null)?.data?.object?.amount ?? null;
      events.push({
        id: `payment:${r.id}`,
        ts: r.created_at,
        source: "payment",
        type: r.event_type,
        severity: failed ? "warning" : "success",
        summary: `${r.event_type}${amount ? ` · £${(amount / 100).toFixed(2)}` : ""} · ${userLabels.get(r.user_id ?? "") ?? "unknown"}`,
        user_id: r.user_id,
        user_label: userLabels.get(r.user_id ?? "") ?? null,
        amount_pence: amount,
      });
    }

    for (const r of subs) {
      const sev: ActivitySeverity =
        r.status === "canceled" || r.status === "incomplete_expired" ? "warning" :
        r.status === "active" ? "success" : "info";
      events.push({
        id: `sub:${r.id}:${r.updated_at}`,
        ts: r.updated_at,
        source: "subscription",
        type: `subscription_${r.status}`,
        severity: sev,
        summary: `${tierLabel(r.tier, r.status) ?? "—"} · ${subscriptionStatusLabel(r.status)} · ${userLabels.get(r.user_id ?? "") ?? "unknown"}`,
        user_id: r.user_id,
        user_label: userLabels.get(r.user_id ?? "") ?? null,
      });
    }

    for (const r of disputes) {
      events.push({
        id: `dispute:${r.id}`,
        ts: r.opened_at,
        source: "dispute",
        type: `dispute_${r.status}`,
        severity: "critical",
        summary: `Dispute opened · £${((r.amount_pence ?? 0) / 100).toFixed(2)} · ${r.reason ?? "—"} · ${userLabels.get(r.user_id ?? "") ?? "unknown"}`,
        user_id: r.user_id,
        user_label: userLabels.get(r.user_id ?? "") ?? null,
        amount_pence: r.amount_pence,
        url: `/admin/billing/disputes/${r.id}`,
      });
    }

    for (const r of reviews) {
      events.push({
        id: `review:${r.id}`,
        ts: r.created_at,
        source: "review",
        type: `review_${r.moderation_status}`,
        severity: r.moderation_status === "pending" ? "warning" : "info",
        summary: `Review ${r.rating}★ ${r.moderation_status} · ${userLabels.get(r.client_user_id ?? "") ?? "anon"}`,
        user_id: r.client_user_id,
      });
    }

    for (const r of verif) {
      const sev: ActivitySeverity =
        r.decision === "approved" ? "success" :
        r.decision === "rejected" ? "warning" : "info";
      events.push({
        id: `verif:${r.id}`,
        ts: r.created_at,
        source: "verification",
        type: `verification_${r.decision}`,
        severity: sev,
        summary: `Verification ${r.decision} · ${userLabels.get(r.professional_id) ?? "pro"}${r.unlocked_tier ? ` → ${r.unlocked_tier}` : ""}`,
        user_id: r.professional_id,
        user_label: userLabels.get(r.professional_id) ?? null,
      });
    }

    for (const r of support) {
      events.push({
        id: `support:${r.id}`,
        ts: r.created_at,
        source: "support",
        type: `support_${r.direction}`,
        severity: "info",
        summary: `Support ${r.direction} · ${userLabels.get(r.author_user_id ?? "") ?? "—"}`,
        url: `/admin/support/${r.ticket_id}`,
      });
    }

    for (const r of enquiries) {
      events.push({
        id: `enquiry:${r.id}`,
        ts: r.created_at,
        source: "enquiry",
        type: "enquiry_received",
        severity: "info",
        summary: `Enquiry → ${userLabels.get(r.professional_id) ?? "pro"} from ${r.sender_email}`,
      });
    }

    for (const r of audit) {
      events.push({
        id: `audit:${r.id}`,
        ts: r.created_at,
        source: "admin_audit",
        type: r.action,
        severity: /delete|cancel|remove/i.test(r.action) ? "warning" : "info",
        summary: `${userLabels.get(r.actor_id) ?? "admin"} · ${r.action}${r.target_table ? ` (${r.target_table})` : ""}`,
      });
    }

    for (const r of impersonation) {
      events.push({
        id: `imp:${r.id}:${r.started_at}`,
        ts: r.started_at,
        source: "impersonation",
        type: r.ended_at ? "impersonation_ended" : "impersonation_started",
        severity: "warning",
        summary: `${userLabels.get(r.admin_id) ?? "admin"} viewing as ${userLabels.get(r.professional_id) ?? "pro"}${r.ended_reason ? ` (${r.ended_reason})` : ""}`,
      });
    }

    for (const r of emails) {
      const label = r.status === "dlq" ? "Email dead-lettered" : "Email failed";
      events.push({
        id: `email:${r.id}`,
        ts: r.created_at,
        source: "email",
        type: `email_${r.status}`,
        severity: "warning",
        summary: `${label}: ${r.template_name} → ${r.recipient_email}`,
      });
    }

    // Sort + filter
    events.sort((a, b) => (a.ts < b.ts ? 1 : -1));
    let filtered = events;
    if (data.source) filtered = filtered.filter((e) => e.source === data.source);
    if (data.severity) filtered = filtered.filter((e) => e.severity === data.severity);
    filtered = filtered.slice(0, cap);

    const bySeverity: Record<ActivitySeverity, number> = { info: 0, success: 0, warning: 0, critical: 0 };
    for (const e of filtered) bySeverity[e.severity]++;

    const needs_attention = events
      .filter((e) => e.severity === "critical" || e.severity === "warning")
      .slice(0, 20);

    // Online now: distinct user sessions seen in last 5 minutes.
    let online_now = 0;
    try {
      const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
      const { data: live } = await supabaseAdmin
        .from("user_sessions")
        .select("user_id")
        .gte("last_seen_at", fiveMinAgo)
        .is("ended_at", null);
      online_now = new Set((live ?? []).map((r) => r.user_id).filter(Boolean)).size;
    } catch (err) {
      degraded.push("online_now");
      console.error("[activity-feed] online_now failed", err);
    }

    if (degraded.length > 0) {
      try {
        await supabaseAdmin.from("ops_alerts").insert({
          kind: "activity_feed_partial",
          severity: "warning",
          context: { degraded, since_hours: data.since_hours },
        });
      } catch {
        /* best-effort */
      }
    }

    return {
      events: filtered,
      counts: { total: filtered.length, bySeverity },
      needs_attention,
      degraded_sources: degraded,
      online_now,
      generated_at: new Date().toISOString(),
    };
  });
