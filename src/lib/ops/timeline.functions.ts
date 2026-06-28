// Member Timeline ("Flight Recorder").
//
// Merges chronological events from every important source for one user into a
// single normalised feed. Read-only. Admin-only.

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

async function assertAdmin(ctx: { supabase: unknown; userId: string }) {
  const supa = ctx.supabase as { rpc: (n: string, p: object) => Promise<{ data: unknown }> };
  const { data } = await supa.rpc("has_role", { _user_id: ctx.userId, _role: "admin" });
  if (!data) throw new Error("Forbidden");
}

export type TimelineSource =
  | "payment"
  | "webhook"
  | "subscription"
  | "churn"
  | "recovery"
  | "email"
  | "verification"
  | "support"
  | "review"
  | "admin"
  | "identity"
  | "auth";

export interface TimelineEvent {
  ts: string;
  source: TimelineSource;
  type: string;
  status?: string | null;
  summary: string;
  entityId?: string | null;
  entityKind?: string | null;
  externalUrl?: string | null;
}

export interface MemberTimelineResult {
  user_id: string;
  email: string | null;
  full_name: string | null;
  stripe_customer_id: string | null;
  events: TimelineEvent[];
  truncated: boolean;
}

export const getMemberTimeline = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({ user_id: z.string().uuid(), limit: z.number().int().min(1).max(1000).default(500) }).parse(d),
  )
  .handler(async ({ data, context }): Promise<MemberTimelineResult> => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // -- basic identity --
    const [authRes, profileRes, subRes] = await Promise.all([
      supabaseAdmin.auth.admin.getUserById(data.user_id),
      supabaseAdmin.from("profiles").select("full_name").eq("id", data.user_id).maybeSingle(),
      supabaseAdmin.from("subscriptions").select("stripe_customer_id").eq("user_id", data.user_id).maybeSingle(),
    ]);
    const email = authRes.data?.user?.email ?? null;
    const fullName = (profileRes.data as { full_name?: string | null } | null)?.full_name ?? null;
    const stripeCustomerId = (subRes.data as { stripe_customer_id?: string | null } | null)?.stripe_customer_id ?? null;
    const stripeBase = "https://dashboard.stripe.com";

    // -- parallel fetches --
    const [
      payRes, subsRes, churnRes, renewRes, emailRes,
      verifRes, vDecRes, ticketsRes, msgsRes,
      reviewsAsProRes, reviewsAsClientRes,
      auditActorRes, auditTargetRes, nameRes,
    ] = await Promise.all([
      supabaseAdmin.from("payment_events")
        .select("id, created_at, event_type, processing_error, dead_lettered_at, processed_at, stripe_subscription_id")
        .eq("user_id", data.user_id).order("created_at", { ascending: false }).limit(200),
      supabaseAdmin.from("subscriptions")
        .select("id, created_at, updated_at, status, tier, cancel_at_period_end, stripe_subscription_id")
        .eq("user_id", data.user_id),
      supabaseAdmin.from("churn_lifecycle")
        .select("id, entered_at, stage, reason, source_event")
        .eq("user_id", data.user_id),
      supabaseAdmin.from("renewal_tokens")
        .select("id, created_at, consumed_at, purpose, intended_tier, expires_at")
        .eq("user_id", data.user_id).order("created_at", { ascending: false }).limit(50),
      // Email log keyed by recipient_email — only if we know the email
      email
        ? supabaseAdmin.from("email_send_log")
            .select("id, created_at, template_name, status, message_id, error_message")
            .eq("recipient_email", email).order("created_at", { ascending: false }).limit(150)
        : Promise.resolve({ data: [] as Array<Record<string, unknown>> }),
      supabaseAdmin.from("verification_notifications")
        .select("id, created_at, event, context").eq("professional_id", data.user_id)
        .order("created_at", { ascending: false }).limit(50),
      supabaseAdmin.from("verification_decisions")
        .select("id, created_at, decision, notes").eq("professional_id", data.user_id)
        .order("created_at", { ascending: false }).limit(30).then(
          (r) => r,
          () => ({ data: [] as Array<Record<string, unknown>> }),
        ),
      supabaseAdmin.from("support_tickets")
        .select("id, created_at, subject, status").eq("requester_user_id", data.user_id)
        .order("created_at", { ascending: false }).limit(50).then(
          (r) => r,
          () => ({ data: [] as Array<Record<string, unknown>> }),
        ),
      supabaseAdmin.from("support_messages")
        .select("id, created_at, direction, ticket_id").eq("author_user_id", data.user_id)
        .order("created_at", { ascending: false }).limit(100).then(
          (r) => r,
          () => ({ data: [] as Array<Record<string, unknown>> }),
        ),
      supabaseAdmin.from("reviews")
        .select("id, created_at, moderation_status, rating, title").eq("professional_id", data.user_id)
        .order("created_at", { ascending: false }).limit(50),
      supabaseAdmin.from("reviews")
        .select("id, created_at, moderation_status, rating, title").eq("client_user_id", data.user_id)
        .order("created_at", { ascending: false }).limit(50),
      supabaseAdmin.from("admin_audit_log")
        .select("id, created_at, action, target_table, target_id, reason").eq("actor_id", data.user_id)
        .order("created_at", { ascending: false }).limit(50),
      supabaseAdmin.from("admin_audit_log")
        .select("id, created_at, action, target_table, actor_id, reason").eq("target_id", data.user_id)
        .order("created_at", { ascending: false }).limit(100),
      supabaseAdmin.from("identity_name_changes")
        .select("id, created_at, old_full_name, new_full_name, source").eq("user_id", data.user_id)
        .order("created_at", { ascending: false }).limit(20).then(
          (r) => r,
          () => ({ data: [] as Array<Record<string, unknown>> }),
        ),
    ]);

    const events: TimelineEvent[] = [];

    // payment_events
    for (const r of (payRes.data ?? []) as Array<{
      id: string; created_at: string; event_type: string;
      processing_error: string | null; dead_lettered_at: string | null; processed_at: string | null;
      stripe_subscription_id: string | null;
    }>) {
      const status = r.dead_lettered_at ? "dead_lettered" : r.processed_at ? "processed" : "pending";
      events.push({
        ts: r.created_at,
        source: r.event_type.startsWith("invoice") || r.event_type.startsWith("charge") ? "payment" : "webhook",
        type: r.event_type,
        status,
        summary: r.processing_error ? `${r.event_type} — ${r.processing_error.slice(0, 100)}` : r.event_type,
        entityId: r.id,
        entityKind: "payment_event",
        externalUrl: r.stripe_subscription_id ? `${stripeBase}/subscriptions/${r.stripe_subscription_id}` : null,
      });
    }

    // subscriptions — created + last-updated as two events
    for (const r of (subsRes.data ?? []) as Array<{
      id: string; created_at: string; updated_at: string; status: string;
      tier: string; cancel_at_period_end: boolean; stripe_subscription_id: string | null;
    }>) {
      events.push({
        ts: r.created_at, source: "subscription", type: "subscription.created", status: r.status,
        summary: `${r.tier} created (${r.status})`, entityId: r.id, entityKind: "subscription",
        externalUrl: r.stripe_subscription_id ? `${stripeBase}/subscriptions/${r.stripe_subscription_id}` : null,
      });
      if (r.updated_at && r.updated_at !== r.created_at) {
        events.push({
          ts: r.updated_at, source: "subscription", type: "subscription.updated", status: r.status,
          summary: `${r.tier} ${r.status}${r.cancel_at_period_end ? " (cancel-at-period-end)" : ""}`,
          entityId: r.id, entityKind: "subscription",
          externalUrl: r.stripe_subscription_id ? `${stripeBase}/subscriptions/${r.stripe_subscription_id}` : null,
        });
      }
    }

    // churn
    for (const r of (churnRes.data ?? []) as Array<{
      id: string; entered_at: string; stage: string; reason: string | null; source_event: string | null;
    }>) {
      events.push({
        ts: r.entered_at, source: "churn", type: `churn.${r.stage}`, status: r.stage,
        summary: r.reason ?? `Entered ${r.stage}${r.source_event ? ` via ${r.source_event}` : ""}`,
        entityId: r.id, entityKind: "churn_lifecycle",
      });
    }

    // renewal tokens
    for (const r of (renewRes.data ?? []) as Array<{
      id: string; created_at: string; consumed_at: string | null; purpose: string;
      intended_tier: string; expires_at: string;
    }>) {
      events.push({
        ts: r.created_at, source: "recovery", type: `token.${r.purpose}.minted`,
        status: r.consumed_at ? "consumed" : "active",
        summary: `Recovery token (${r.purpose}, ${r.intended_tier})`,
        entityId: r.id, entityKind: "renewal_token",
      });
      if (r.consumed_at) {
        events.push({
          ts: r.consumed_at, source: "recovery", type: `token.${r.purpose}.consumed`, status: "consumed",
          summary: `Recovery token consumed`,
          entityId: r.id, entityKind: "renewal_token",
        });
      }
    }

    // emails
    for (const r of (emailRes.data ?? []) as Array<{
      id: string; created_at: string; template_name: string; status: string;
      message_id: string | null; error_message: string | null;
    }>) {
      events.push({
        ts: r.created_at, source: "email", type: `email.${r.template_name}`, status: r.status,
        summary: r.error_message
          ? `${r.template_name} — ${r.status}: ${r.error_message.slice(0, 100)}`
          : `${r.template_name} — ${r.status}`,
        entityId: r.message_id ?? r.id, entityKind: "email_send_log",
      });
    }

    // verification notifications
    for (const r of (verifRes.data ?? []) as Array<{
      id: string; created_at: string; event: string; context: Record<string, unknown> | null;
    }>) {
      events.push({
        ts: r.created_at, source: "verification", type: r.event, summary: r.event,
        entityId: r.id, entityKind: "verification_notification",
      });
    }

    // verification decisions
    for (const r of (vDecRes.data ?? []) as unknown as Array<{
      id: string; created_at: string; decision: string; notes: string | null;
    }>) {
      events.push({
        ts: r.created_at, source: "verification", type: `verification.${r.decision}`, status: r.decision,
        summary: r.notes ?? `Decision: ${r.decision}`,
        entityId: r.id, entityKind: "verification_decision",
      });
    }

    // support tickets + messages
    for (const r of (ticketsRes.data ?? []) as unknown as Array<{
      id: string; created_at: string; subject: string; status: string;
    }>) {
      events.push({
        ts: r.created_at, source: "support", type: "support.ticket_created", status: r.status,
        summary: r.subject ?? "Ticket created", entityId: r.id, entityKind: "support_ticket",
      });
    }
    for (const r of (msgsRes.data ?? []) as unknown as Array<{
      id: string; created_at: string; direction: string; ticket_id: string;
    }>) {
      events.push({
        ts: r.created_at, source: "support", type: `support.message.${r.direction}`,
        summary: `Message ${r.direction}`,
        entityId: r.id, entityKind: "support_message",
      });
    }

    // reviews — as pro
    for (const r of (reviewsAsProRes.data ?? []) as Array<{
      id: string; created_at: string; moderation_status: string; rating: number; title: string | null;
    }>) {
      events.push({
        ts: r.created_at, source: "review", type: "review.received", status: r.moderation_status,
        summary: `Review received (${r.rating}★)${r.title ? ` — ${r.title}` : ""}`,
        entityId: r.id, entityKind: "review",
      });
    }
    // reviews — as client
    for (const r of (reviewsAsClientRes.data ?? []) as Array<{
      id: string; created_at: string; moderation_status: string; rating: number; title: string | null;
    }>) {
      events.push({
        ts: r.created_at, source: "review", type: "review.submitted", status: r.moderation_status,
        summary: `Review submitted (${r.rating}★)${r.title ? ` — ${r.title}` : ""}`,
        entityId: r.id, entityKind: "review",
      });
    }

    // admin audit
    for (const r of (auditActorRes.data ?? []) as Array<{
      id: string; created_at: string; action: string; target_table: string | null; target_id: string | null; reason: string | null;
    }>) {
      events.push({
        ts: r.created_at, source: "admin", type: r.action,
        summary: `[by user] ${r.action}${r.target_table ? ` on ${r.target_table}` : ""}${r.reason ? ` — ${r.reason}` : ""}`,
        entityId: r.id, entityKind: "admin_audit_log",
      });
    }
    for (const r of (auditTargetRes.data ?? []) as Array<{
      id: string; created_at: string; action: string; target_table: string | null; actor_id: string | null; reason: string | null;
    }>) {
      events.push({
        ts: r.created_at, source: "admin", type: r.action,
        summary: `${r.action}${r.target_table ? ` on ${r.target_table}` : ""}${r.reason ? ` — ${r.reason}` : ""}`,
        entityId: r.id, entityKind: "admin_audit_log",
      });
    }

    // identity name changes
    for (const r of (nameRes.data ?? []) as unknown as Array<{
      id: string; created_at: string; old_full_name: string | null; new_full_name: string | null; source: string;
    }>) {
      events.push({
        ts: r.created_at, source: "identity", type: "identity.name_changed", status: r.source,
        summary: `Name: ${r.old_full_name ?? "—"} → ${r.new_full_name ?? "—"}`,
        entityId: r.id, entityKind: "identity_name_change",
      });
    }

    // auth signup
    if (authRes.data?.user?.created_at) {
      events.push({
        ts: authRes.data.user.created_at,
        source: "auth", type: "auth.signup", summary: `Account created (${email ?? "no email"})`,
      });
    }
    if (authRes.data?.user?.email_confirmed_at) {
      events.push({
        ts: authRes.data.user.email_confirmed_at,
        source: "auth", type: "auth.email_confirmed", summary: "Email confirmed",
      });
    }
    if (authRes.data?.user?.last_sign_in_at) {
      events.push({
        ts: authRes.data.user.last_sign_in_at,
        source: "auth", type: "auth.signin", summary: "Last sign-in",
      });
    }

    // sort desc by ts, cap
    events.sort((a, b) => b.ts.localeCompare(a.ts));
    const capped = events.slice(0, data.limit);

    return {
      user_id: data.user_id,
      email,
      full_name: fullName,
      stripe_customer_id: stripeCustomerId,
      events: capped,
      truncated: events.length > capped.length,
    };
  });
