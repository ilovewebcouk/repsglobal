// Public enquiry submission. Inserts into public.enquiries via supabaseAdmin.
// RLS allows anyone to INSERT; we still validate input server-side and resolve
// the professional_id from the public slug to prevent spoofing.
import { createServerFn } from "@tanstack/react-start";
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

    // If a service_id was passed, verify it belongs to this pro.
    let serviceId: string | null = null;
    if (data.service_id) {
      const { data: svc } = await supabaseAdmin
        .from("services")
        .select("id")
        .eq("id", data.service_id)
        .eq("professional_id", pro.id)
        .maybeSingle();
      if (svc) serviceId = svc.id;
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
    return { id: row.id };
  });
