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
  status: "new" | "read" | "replied" | "archived" | "spam";
  priority: LeadPriority | null;
  estimated_value_pence: number | null;
  follow_up_at: string | null;
  ai_score: number | null;
  ai_band: LeadBand | null;
  ai_summary: string | null;
  ai_recommended_action: string | null;
  ai_predicted_pct: number | null;
  ai_reasons: string[];
  ai_updated_at: string | null;
  created_at: string;
  read_at: string | null;
  replied_at: string | null;
  sender_user_id: string | null;
  converted_client_id: string | null;
  last_invite_sent_at: string | null;
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
        "id, sender_name, sender_email, sender_phone, service_id, goals, frequency, start_by, budget, location, message, source, stage, status, priority, estimated_value_pence, follow_up_at, ai_score, ai_band, ai_summary, ai_recommended_action, ai_predicted_pct, ai_reasons, ai_updated_at, created_at, read_at, replied_at, sender_user_id, converted_client_id",
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

    // Latest pending invite per email for this pro (so the UI can show
    // "Sign-up link sent {timeAgo}" without a second round-trip).
    const emails = Array.from(
      new Set(
        rows
          .filter((r) => !r.sender_user_id && r.sender_email)
          .map((r) => r.sender_email.toLowerCase()),
      ),
    );
    const inviteMap = new Map<string, string>();
    if (emails.length) {
      const { data: invites } = await supabaseAdmin
        .from("client_invites")
        .select("email, created_at")
        .eq("professional_id", userId)
        .in("email", emails)
        .order("created_at", { ascending: false });
      for (const inv of invites ?? []) {
        const key = (inv.email ?? "").toLowerCase();
        if (key && !inviteMap.has(key)) inviteMap.set(key, inv.created_at);
      }
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
      sender_user_id: r.sender_user_id ?? null,
      converted_client_id: r.converted_client_id ?? null,
      last_invite_sent_at:
        !r.sender_user_id && r.sender_email
          ? (inviteMap.get(r.sender_email.toLowerCase()) ?? null)
          : null,
    }));
  });

/* -------------------- Convert lead to client -------------------- */

const ConvertLeadSchema = z.object({ enquiryId: z.string().uuid() });

export const convertLeadToClient = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => ConvertLeadSchema.parse(d))
  .handler(async ({ data, context }): Promise<{ clientId: string }> => {
    const { supabase } = context;
    const { data: clientId, error } = await supabase.rpc("convert_lead_to_client", {
      _enquiry_id: data.enquiryId,
    });
    if (error) throw new Error(error.message);
    return { clientId: clientId as unknown as string };
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

/* -------------------- Backfill AI scores -------------------- */

export const backfillLeadScores = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<{ scored: number; skipped: number }> => {
    const userId = context.userId;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: rows, error } = await supabaseAdmin
      .from("enquiries")
      .select("id")
      .eq("professional_id", userId)
      .is("ai_score", null)
      .neq("status", "spam")
      .order("created_at", { ascending: false })
      .limit(25);
    if (error) throw error;
    const { scoreLeadById } = await import("./score.server");
    let scored = 0;
    for (const r of rows ?? []) {
      try {
        await scoreLeadById(r.id, userId);
        scored++;
      } catch {
        // continue — one bad lead shouldn't stop the batch
      }
    }
    return { scored, skipped: (rows?.length ?? 0) - scored };
  });

/* -------------------- Pipeline KPIs -------------------- */

export type LeadKpis = {
  active_leads: number;
  hot_leads: number;
  reply_time_avg_hours: number | null;
  conversion_pct_30d: number | null;
  pipeline_value_pence: number;
  predicted_revenue_30d_pence: number | null;
  potential_monthly_revenue_pence: number;
  source_counts: { source: string; count: number }[];
  follow_ups_due_48h: number;
  follow_ups_due_list: { id: string; name: string; when: string }[];
  funnel: { stage: LeadStage; count: number }[];
  stage_counts: Record<LeadStage, number>;
  weekly_deltas: Record<LeadStage, number>;
  conversion_rates: {
    lead_to_call: number | null;
    call_to_proposal: number | null;
    proposal_to_client: number | null;
    average_client_value_pence: number | null;
  };
};

export const getLeadKpis = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<LeadKpis> => {
    const userId = context.userId;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const since30 = new Date(Date.now() - 30 * 86_400_000).toISOString();
    const since7 = new Date(Date.now() - 7 * 86_400_000).toISOString();
    const since14 = new Date(Date.now() - 14 * 86_400_000).toISOString();
    const in48 = new Date(Date.now() + 48 * 3600_000).toISOString();
    const nowIso = new Date().toISOString();

    const { data, error } = await supabaseAdmin
      .from("enquiries")
      .select(
        "id, sender_name, stage, source, estimated_value_pence, ai_score, ai_predicted_pct, follow_up_at, created_at, replied_at",
      )
      .eq("professional_id", userId)
      .neq("status", "spam");
    if (error) throw error;
    const rows = data ?? [];

    const active = rows.filter((r) => r.stage !== "converted" && r.stage !== "lost");
    const hot = rows.filter((r) => (r.ai_score ?? 0) >= 80 && r.stage !== "converted" && r.stage !== "lost");

    const recentReplied = rows.filter((r) => r.replied_at && r.replied_at >= since30 && r.created_at);
    const replyTimeAvg = recentReplied.length
      ? recentReplied.reduce(
          (acc, r) => acc + (new Date(r.replied_at!).getTime() - new Date(r.created_at!).getTime()) / 3_600_000,
          0,
        ) / recentReplied.length
      : null;

    const since30Rows = rows.filter((r) => r.created_at >= since30);
    const conversion = since30Rows.length
      ? (since30Rows.filter((r) => r.stage === "converted").length / since30Rows.length) * 100
      : null;

    const pipelineValue = active.reduce((a, r) => a + (r.estimated_value_pence ?? 0), 0);
    const predictedRevenue = active.reduce(
      (a, r) => a + ((r.estimated_value_pence ?? 0) * ((r.ai_predicted_pct ?? 0) / 100)),
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
    );
    const followUpsList = followUpsDue
      .sort((a, b) => (a.follow_up_at! < b.follow_up_at! ? -1 : 1))
      .slice(0, 5)
      .map((r) => {
        const d = new Date(r.follow_up_at!);
        const today = new Date();
        const same = d.toDateString() === today.toDateString();
        const tomorrow = new Date(today.getTime() + 86_400_000);
        const isTom = d.toDateString() === tomorrow.toDateString();
        return {
          id: r.id,
          name: r.sender_name,
          when: same ? "Today" : isTom ? "Tomorrow" : d.toLocaleDateString(undefined, { day: "numeric", month: "short" }),
        };
      });

    const stageCounts = Object.fromEntries(LEAD_STAGES.map((s) => [s, 0])) as Record<LeadStage, number>;
    const stageThisWeek = Object.fromEntries(LEAD_STAGES.map((s) => [s, 0])) as Record<LeadStage, number>;
    const stagePrevWeek = Object.fromEntries(LEAD_STAGES.map((s) => [s, 0])) as Record<LeadStage, number>;
    for (const r of rows) {
      const st = (r.stage ?? "new") as LeadStage;
      stageCounts[st]++;
      if (r.created_at >= since7) stageThisWeek[st]++;
      else if (r.created_at >= since14) stagePrevWeek[st]++;
    }
    const weeklyDeltas = Object.fromEntries(
      LEAD_STAGES.map((s) => {
        const cur = stageThisWeek[s];
        const prev = stagePrevWeek[s];
        if (prev === 0) return [s, cur > 0 ? 100 : 0];
        return [s, Math.round(((cur - prev) / prev) * 100)];
      }),
    ) as Record<LeadStage, number>;

    const funnel = LEAD_STAGES.map((stage) => ({ stage, count: stageCounts[stage] }));

    const totalLeads = rows.length || 1;
    const callPlus = stageCounts.call_booked + stageCounts.proposal_sent + stageCounts.trial_booked + stageCounts.converted;
    const propPlus = stageCounts.proposal_sent + stageCounts.trial_booked + stageCounts.converted;
    const convertedCount = stageCounts.converted;
    const convertedRows = rows.filter((r) => r.stage === "converted" && (r.estimated_value_pence ?? 0) > 0);
    const avgClientValue = convertedRows.length
      ? Math.round(convertedRows.reduce((a, r) => a + (r.estimated_value_pence ?? 0), 0) / convertedRows.length)
      : null;

    return {
      active_leads: active.length,
      hot_leads: hot.length,
      reply_time_avg_hours: replyTimeAvg,
      conversion_pct_30d: conversion,
      pipeline_value_pence: Math.round(pipelineValue),
      predicted_revenue_30d_pence: predictedRevenue ? Math.round(predictedRevenue) : null,
      potential_monthly_revenue_pence: Math.round(pipelineValue),
      source_counts: sourceCounts,
      follow_ups_due_48h: followUpsDue.length,
      follow_ups_due_list: followUpsList,
      funnel,
      stage_counts: stageCounts,
      weekly_deltas: weeklyDeltas,
      conversion_rates: {
        lead_to_call: totalLeads ? Math.round((callPlus / totalLeads) * 100) : null,
        call_to_proposal: callPlus ? Math.round((propPlus / callPlus) * 100) : null,
        proposal_to_client: propPlus ? Math.round((convertedCount / propPlus) * 100) : null,
        average_client_value_pence: avgClientValue,
      },
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

/* -------------------- Add note -------------------- */

const AddLeadNoteSchema = z.object({
  enquiryId: z.string().uuid(),
  body: z.string().trim().min(1).max(2000),
});

export const addLeadNote = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => AddLeadNoteSchema.parse(d))
  .handler(async ({ data, context }) => {
    const userId = context.userId;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    // Verify ownership
    const { data: enq, error: enqErr } = await supabaseAdmin
      .from("enquiries")
      .select("id")
      .eq("id", data.enquiryId)
      .eq("professional_id", userId)
      .maybeSingle();
    if (enqErr) throw enqErr;
    if (!enq) throw new Error("Lead not found");

    const { error } = await supabaseAdmin.from("lead_activity").insert({
      enquiry_id: data.enquiryId,
      professional_id: userId,
      type: "note",
      payload: { body: data.body },
      created_by: userId,
    });
    if (error) throw error;
    return { ok: true };
  });

/* -------------------- Send sign-up link to a lead -------------------- */

const SendSignupLinkSchema = z.object({ enquiryId: z.string().uuid() });

export const sendLeadSignupLink = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => SendSignupLinkSchema.parse(d))
  .handler(async ({ data, context }): Promise<{ acceptUrl: string; expiresAt: string }> => {
    const userId = context.userId;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: enq, error: enqErr } = await supabaseAdmin
      .from("enquiries")
      .select("id, professional_id, sender_user_id, sender_email, sender_name")
      .eq("id", data.enquiryId)
      .eq("professional_id", userId)
      .maybeSingle();
    if (enqErr) throw enqErr;
    if (!enq) throw new Error("Lead not found");
    if (enq.sender_user_id) throw new Error("Lead is already linked to a REPs account");
    if (!enq.sender_email) throw new Error("No email on file for this lead");

    const token =
      crypto.randomUUID().replace(/-/g, "") + crypto.randomUUID().replace(/-/g, "");

    const { data: invite, error: invErr } = await supabaseAdmin
      .from("client_invites")
      .insert({
        professional_id: userId,
        email: enq.sender_email,
        full_name: enq.sender_name ?? null,
        token_hash: token,
        status: "pending",
      })
      .select("id, expires_at")
      .single();
    if (invErr) throw new Error(invErr.message);

    await supabaseAdmin.from("lead_activity").insert({
      enquiry_id: data.enquiryId,
      professional_id: userId,
      type: "invite_sent",
      payload: {
        email: enq.sender_email,
        invite_id: invite.id,
        expires_at: invite.expires_at,
      },
      created_by: userId,
    });

    const origin = process.env.PUBLIC_SITE_URL ?? "https://repsglobal.lovable.app";
    return {
      acceptUrl: `${origin}/accept-invite?token=${token}`,
      expiresAt: invite.expires_at,
    };
  });
