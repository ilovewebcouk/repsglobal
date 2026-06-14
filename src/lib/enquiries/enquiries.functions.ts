// Public enquiry submission + pro-side inbox management.
// RLS: anyone can INSERT (validated server-side here); pros can SELECT/UPDATE
// their own. We use supabaseAdmin so we can resolve professional_id from the
// public slug atomically without leaking the lookup as a separate query.
import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

const SubmitSchema = z.object({
  slug: z.string().min(1).max(120),
  service_id: z.string().uuid().nullable().optional(),
  sender_name: z.string().trim().min(1).max(120),
  sender_email: z.string().trim().email().max(200),
  sender_phone: z.string().trim().max(40).nullable().optional(),
  goals: z.array(z.string().trim().max(80)).max(8).default([]),
  frequency: z.string().trim().max(60).nullable().optional(),
  start_by: z.string().trim().max(60).nullable().optional(),
  budget: z.string().trim().max(60).nullable().optional(),
  location: z.string().trim().max(120).nullable().optional(),
  message: z.string().trim().min(10).max(4000),
});

export const submitEnquiry = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => SubmitSchema.parse(d))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: pro, error: proErr } = await supabaseAdmin
      .from("professionals")
      .select("id")
      .eq("slug", data.slug)
      .eq("is_published", true)
      .maybeSingle();
    if (proErr) throw proErr;
    if (!pro) throw new Error("Professional not found");

    // Validate service ownership if provided.
    let serviceId: string | null = null;
    let serviceTitle: string | null = null;
    if (data.service_id) {
      const { data: svc } = await supabaseAdmin
        .from("services")
        .select("id, title")
        .eq("id", data.service_id)
        .eq("professional_id", pro.id)
        .maybeSingle();
      if (svc) {
        serviceId = svc.id;
        serviceTitle = svc.title;
      }
    }

    const { data: row, error } = await supabaseAdmin
      .from("enquiries")
      .insert({
        professional_id: pro.id,
        service_id: serviceId,
        sender_name: data.sender_name,
        sender_email: data.sender_email,
        sender_phone: data.sender_phone || null,
        goals: data.goals,
        frequency: data.frequency || null,
        start_by: data.start_by || null,
        budget: data.budget || null,
        location: data.location || null,
        message: data.message,
        source: "profile_enquire",
      })
      .select("id")
      .single();
    if (error) throw error;

    // Best-effort AI scoring so the lead lands in the trainer's pipeline pre-qualified.
    try {
      const { scoreLeadById } = await import("@/lib/leads/score.server");
      await scoreLeadById(row.id, pro.id);
    } catch (e) {
      console.error("[submitEnquiry] auto-score failed:", e);
    }


    // Notify the pro by email (best-effort — never block the submission).
    try {
      const { data: prof } = await supabaseAdmin
        .from("profiles")
        .select("full_name")
        .eq("id", pro.id)
        .maybeSingle();
      const { data: authUser } = await supabaseAdmin.auth.admin.getUserById(pro.id);
      const recipient = authUser?.user?.email ?? null;
      if (recipient) {
        const { sendTransactionalEmailServer } = await import("@/lib/email/send.server");
        const fullName = prof?.full_name ?? "";
        const firstName = fullName.split(" ")[0] || "there";
        await sendTransactionalEmailServer({
          templateName: "enquiry-notification",
          recipientEmail: recipient,
          idempotencyKey: `enquiry-${row.id}`,
          templateData: {
            proFirstName: firstName,
            senderName: data.sender_name,
            senderEmail: data.sender_email,
            senderPhone: data.sender_phone || null,
            serviceTitle,
            goals: data.goals,
            frequency: data.frequency || null,
            startBy: data.start_by || null,
            budget: data.budget || null,
            location: data.location || null,
            message: data.message,
            inboxUrl: "https://repsglobal.lovable.app/dashboard/enquiries",
          },
        });
      }
    } catch (e) {
      console.error("[submitEnquiry] notification email failed:", e);
    }

    return { id: row.id };
  });

/* ------------------------- Pro-side inbox ------------------------- */

export type EnquiryDTO = {
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
  status: "new" | "read" | "replied" | "archived" | "spam";
  created_at: string;
  read_at: string | null;
  replied_at: string | null;
};

export const listMyEnquiries = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<EnquiryDTO[]> => {
    const userId = context.userId;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin
      .from("enquiries")
      .select(
        "id, sender_name, sender_email, sender_phone, service_id, goals, frequency, start_by, budget, location, message, status, created_at, read_at, replied_at",
      )
      .eq("professional_id", userId)
      .neq("status", "spam")
      .order("created_at", { ascending: false })
      .limit(200);
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
      status: r.status as EnquiryDTO["status"],
      created_at: r.created_at,
      read_at: r.read_at,
      replied_at: r.replied_at,
    }));
  });

const UpdateStatusSchema = z.object({
  id: z.string().uuid(),
  status: z.enum(["new", "read", "replied", "archived", "spam"]),
});

export const updateEnquiryStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => UpdateStatusSchema.parse(d))
  .handler(async ({ data, context }) => {
    const userId = context.userId;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const patch: {
      status: string;
      read_at?: string;
      replied_at?: string;
      archived_at?: string;
    } = { status: data.status };
    if (data.status === "read") patch.read_at = new Date().toISOString();
    if (data.status === "replied") patch.replied_at = new Date().toISOString();
    if (data.status === "archived") patch.archived_at = new Date().toISOString();
    const { error } = await supabaseAdmin
      .from("enquiries")
      .update(patch)
      .eq("id", data.id)
      .eq("professional_id", userId);
    if (error) throw error;
    return { ok: true };
  });

/* ------------------------- Verified inbox stats ------------------------- */

export type EnquiryStats = {
  this_month_count: number;
  reply_rate_pct: number | null;
  reply_time_avg_hours: number | null;
  total: number;
};

export const getEnquiryStats = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<EnquiryStats> => {
    const userId = context.userId;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);
    const since30 = new Date(Date.now() - 30 * 86_400_000).toISOString();

    const { data, error } = await supabaseAdmin
      .from("enquiries")
      .select("id, created_at, replied_at, status")
      .eq("professional_id", userId)
      .neq("status", "spam");
    if (error) throw error;
    const rows = data ?? [];

    const thisMonth = rows.filter((r) => r.created_at >= monthStart.toISOString());
    const last30 = rows.filter((r) => r.created_at >= since30);
    const replied30 = last30.filter((r) => r.replied_at || r.status === "replied");

    const replyTimeAvg = replied30.length
      ? replied30
          .filter((r) => r.replied_at)
          .reduce(
            (acc, r) => acc + (new Date(r.replied_at!).getTime() - new Date(r.created_at).getTime()) / 3_600_000,
            0,
          ) / Math.max(1, replied30.filter((r) => r.replied_at).length)
      : null;

    return {
      this_month_count: thisMonth.length,
      reply_rate_pct: last30.length ? Math.round((replied30.length / last30.length) * 100) : null,
      reply_time_avg_hours: replyTimeAvg,
      total: rows.length,
    };
  });
