// Phase 2.0 Leads pipeline — CRUD + stage/value/follow-up + activity log + KPIs.
// All server-side; trainer-scoped via supabaseAdmin + manual user_id filter.
import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

export const LEAD_STAGES = [
  "new",
  "contacted",
  "call_booked",
  "proposal_sent",
  "trial_booked",
  "converted",
  "lost",
] as const;
export type LeadStage = (typeof LEAD_STAGES)[number];

export const LEAD_STAGE_LABEL: Record<LeadStage, string> = {
  new: "New",
  contacted: "Contacted",
  call_booked: "Call booked",
  proposal_sent: "Proposal sent",
  trial_booked: "Trial booked",
  converted: "Converted",
  lost: "Lost",
};

export type LeadBand = "cold" | "warm" | "hot";
export type LeadPriority = "low" | "medium" | "high";

export type LeadDTO = {
  id: string;
  sender_name: string;
  sender_email: string;
  sender_phone: string | null;
  service_id: string | null;
  service_title: string | null;
  goals: string[];
  frequency: string | null;
  start_by: string | null;
  budget: string | null;
  location: string | null;
  message: string;
  source: string;
  stage: LeadStage;
  priority: LeadPriority | null;
  estimated_value_pence: number | null;
  follow_up_at: string | null;
  ai_score: number | null;
  ai_band: LeadBand | null;
  ai_summary: string | null;
  ai_recommended_action: string | null;
  ai_predicted_pct: number | null;
  ai_updated_at: string | null;
  created_at: string;
  read_at: string | null;
  replied_at: string | null;
};

/* -------------------- List leads -------------------- */

export const listLeads = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<LeadDTO[]> => {
    const userId = context.userId;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin
      .from("enquiries")
      .select(
        "id, sender_name, sender_email, sender_phone, service_id, goals, frequency, start_by, budget, location, message, source, stage, priority, estimated_value_pence, follow_up_at, ai_score, ai_band, ai_summary, ai_recommended_action, ai_predicted_pct, ai_updated_at, created_at, read_at, replied_at",
      )
      .eq("professional_id", userId)
      .neq("status", "spam")
      .order("created_at", { ascending: false })
      .limit(500);
    if (error) throw error;

    const rows = data ?? [];
    const serviceIds = Array.from(
      new Set(rows.map((r) => r.service_id).filter((v): v is string => !!v)),
    );
    const titleMap = new Map<string, string>();
    if (serviceIds.length) {
      const { data: svcs } = await supabaseAdmin
        .from("services")
        .select("id, title")
        .in("id", serviceIds);
      for (const s of svcs ?? []) titleMap.set(s.id, s.title);
    }

    return rows.map((r) => ({
      id: r.id,
      sender_name: r.sender_name,
      sender_email: r.sender_email,
      sender_phone: r.sender_phone,
      service_id: r.service_id,
      service_title: r.service_id ? (titleMap.get(r.service_id) ?? null) : null,
      goals: Array.isArray(r.goals) ? r.goals : [],
      frequency: r.frequency,
      start_by: r.start_by,
      budget: r.budget,
      location: r.location,
      message: r.message,
      source: r.source ?? "profile_enquire",
      stage: (r.stage ?? "new") as LeadStage,
      priority: (r.priority ?? null) as LeadPriority | null,
      estimated_value_pence: r.estimated_value_pence,
      follow_up_at: r.follow_up_at,
      ai_score: r.ai_score,
      ai_band: (r.ai_band ?? null) as LeadBand | null,
      ai_summary: r.ai_summary,
      ai_recommended_action: r.ai_recommended_action,
      ai_predicted_pct: r.ai_predicted_pct,
      ai_updated_at: r.ai_updated_at,
      created_at: r.created_at,
      read_at: r.read_at,
      replied_at: r.replied_at,
    }));
  });

/* -------------------- Update lead fields -------------------- */

const UpdateLeadSchema = z.object({
  id: z.string().uuid(),
  stage: z.enum(LEAD_STAGES).optional(),
  priority: z.enum(["low", "medium", "high"]).nullable().optional(),
  estimated_value_pence: z.number().int().nonnegative().nullable().optional(),
  follow_up_at: z.string().nullable().optional(),
});

export const updateLead = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => UpdateLeadSchema.parse(d))
  .handler(async ({ data, context }) => {
    const userId = context.userId;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const patch: {
      stage?: LeadStage;
      priority?: LeadPriority | null;
      estimated_value_pence?: number | null;
      follow_up_at?: string | null;
    } = {};
    if (data.stage !== undefined) patch.stage = data.stage;
    if (data.priority !== undefined) patch.priority = data.priority;
    if (data.estimated_value_pence !== undefined)
      patch.estimated_value_pence = data.estimated_value_pence;
    if (data.follow_up_at !== undefined) patch.follow_up_at = data.follow_up_at;
    if (Object.keys(patch).length === 0) return { ok: true };

    const { error } = await supabaseAdmin
      .from("enquiries")
      .update(patch)
      .eq("id", data.id)
      .eq("professional_id", userId);
    if (error) throw error;

    // Log activity for stage changes
    if (data.stage) {
      await supabaseAdmin.from("lead_activity").insert({
        enquiry_id: data.id,
        professional_id: userId,
        type: "stage_change",
        payload: { to: data.stage },
        created_by: userId,
      });
    }
    return { ok: true };
  });

/* -------------------- Bulk stage update -------------------- */

const BulkStageSchema = z.object({
  ids: z.array(z.string().uuid()).min(1).max(200),
  stage: z.enum(LEAD_STAGES),
});

export const bulkSetStage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => BulkStageSchema.parse(d))
  .handler(async ({ data, context }) => {
    const userId = context.userId;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("enquiries")
      .update({ stage: data.stage })
      .in("id", data.ids)
      .eq("professional_id", userId);
    if (error) throw error;
    return { ok: true, count: data.ids.length };
  });

/* -------------------- Create manual lead -------------------- */

const CreateLeadSchema = z.object({
  sender_name: z.string().trim().min(1).max(120),
  sender_email: z.string().trim().email().max(200),
  sender_phone: z.string().trim().max(40).nullable().optional(),
  goals: z.array(z.string().trim().max(80)).max(8).default([]),
  message: z.string().trim().min(1).max(4000),
  estimated_value_pence: z.number().int().nonnegative().nullable().optional(),
  source: z.string().trim().max(40).default("manual"),
});

export const createLead = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => CreateLeadSchema.parse(d))
  .handler(async ({ data, context }) => {
    const userId = context.userId;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: row, error } = await supabaseAdmin
      .from("enquiries")
      .insert({
        professional_id: userId,
        sender_name: data.sender_name,
        sender_email: data.sender_email,
        sender_phone: data.sender_phone || null,
        goals: data.goals,
        message: data.message,
        source: data.source,
        estimated_value_pence: data.estimated_value_pence ?? null,
      })
      .select("id")
      .single();
    if (error) throw error;

    // Best-effort AI score so the AI Insight card is never blank on a new lead.
    try {
      const { scoreLeadById } = await import("./score.server");
      await scoreLeadById(row.id, userId);
    } catch (e) {
      console.error("[createLead] auto-score failed:", e);
    }

    return { id: row.id };
  });

/* -------------------- Pipeline KPIs -------------------- */

export type LeadKpis = {
  active_leads: number;
  hot_leads: number;
  reply_time_avg_hours: number | null;
  conversion_pct_30d: number | null;
  pipeline_value_pence: number;
  predicted_revenue_30d_pence: number | null;
  source_counts: { source: string; count: number }[];
  follow_ups_due_48h: number;
  funnel: { stage: LeadStage; count: number }[];
};

export const getLeadKpis = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<LeadKpis> => {
    const userId = context.userId;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const since30 = new Date(Date.now() - 30 * 86_400_000).toISOString();
    const in48 = new Date(Date.now() + 48 * 3600_000).toISOString();
    const nowIso = new Date().toISOString();

    const { data, error } = await supabaseAdmin
      .from("enquiries")
      .select(
        "id, stage, source, estimated_value_pence, ai_score, ai_predicted_pct, follow_up_at, created_at, replied_at",
      )
      .eq("professional_id", userId)
      .neq("status", "spam");
    if (error) throw error;
    const rows = data ?? [];

    const active = rows.filter((r) => r.stage !== "converted" && r.stage !== "lost");
    const hot = rows.filter((r) => (r.ai_score ?? 0) >= 80 && r.stage !== "converted" && r.stage !== "lost");

    // Avg reply time (hrs) of leads replied within last 30 days
    const recentReplied = rows.filter(
      (r) => r.replied_at && r.replied_at >= since30 && r.created_at,
    );
    const replyTimeAvg = recentReplied.length
      ? recentReplied.reduce(
          (acc, r) =>
            acc + (new Date(r.replied_at!).getTime() - new Date(r.created_at!).getTime()) / 3_600_000,
          0,
        ) / recentReplied.length
      : null;

    // Conversion % over last 30 days
    const since30Rows = rows.filter((r) => r.created_at >= since30);
    const conversion = since30Rows.length
      ? (since30Rows.filter((r) => r.stage === "converted").length / since30Rows.length) * 100
      : null;

    const pipelineValue = active.reduce(
      (a, r) => a + (r.estimated_value_pence ?? 0),
      0,
    );
    const predictedRevenue = active.reduce(
      (a, r) =>
        a +
        ((r.estimated_value_pence ?? 0) * ((r.ai_predicted_pct ?? 0) / 100)),
      0,
    );

    const sourceMap = new Map<string, number>();
    for (const r of rows) {
      sourceMap.set(r.source ?? "unknown", (sourceMap.get(r.source ?? "unknown") ?? 0) + 1);
    }
    const sourceCounts = Array.from(sourceMap.entries())
      .map(([source, count]) => ({ source, count }))
      .sort((a, b) => b.count - a.count);

    const followUpsDue = rows.filter(
      (r) =>
        r.follow_up_at &&
        r.follow_up_at >= nowIso &&
        r.follow_up_at <= in48 &&
        r.stage !== "converted" &&
        r.stage !== "lost",
    ).length;

    const funnelMap = new Map<LeadStage, number>();
    for (const s of LEAD_STAGES) funnelMap.set(s, 0);
    for (const r of rows) {
      const st = (r.stage ?? "new") as LeadStage;
      funnelMap.set(st, (funnelMap.get(st) ?? 0) + 1);
    }
    const funnel = LEAD_STAGES.map((stage) => ({
      stage,
      count: funnelMap.get(stage) ?? 0,
    }));

    return {
      active_leads: active.length,
      hot_leads: hot.length,
      reply_time_avg_hours: replyTimeAvg,
      conversion_pct_30d: conversion,
      pipeline_value_pence: Math.round(pipelineValue),
      predicted_revenue_30d_pence: predictedRevenue ? Math.round(predictedRevenue) : null,
      source_counts: sourceCounts,
      follow_ups_due_48h: followUpsDue,
      funnel,
    };
  });

/* -------------------- Activity feed -------------------- */

export type LeadActivityDTO = {
  id: string;
  type: string;
  payload_json: string;
  created_at: string;
};

export const listLeadActivity = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ enquiryId: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }): Promise<LeadActivityDTO[]> => {
    const userId = context.userId;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: rows, error } = await supabaseAdmin
      .from("lead_activity")
      .select("id, type, payload, created_at")
      .eq("enquiry_id", data.enquiryId)
      .eq("professional_id", userId)
      .order("created_at", { ascending: false })
      .limit(100);
    if (error) throw error;
    return (rows ?? []).map((r) => ({
      id: r.id,
      type: r.type,
      payload_json: JSON.stringify(r.payload ?? {}),
      created_at: r.created_at,
    }));
  });
