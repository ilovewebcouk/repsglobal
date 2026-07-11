/**
 * Certificate template admin — server functions.
 *
 * Admins upload Adobe-designed PDFs (certificate + optional unit summary),
 * paste a JSON coordinate field map, and mark one template as the default.
 * The renderer in `pdf.server.ts` loads the default template at issue time
 * and overlays the variable data at the coordinates in `field_map`.
 */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuthWithImpersonation as requireSupabaseAuth } from "@/integrations/supabase/auth-middleware-impersonation";

export type CertificateTemplateDTO = {
  id: string;
  slug: string;
  name: string;
  is_default: boolean;
  certificate_pdf_path: string;
  unit_summary_pdf_path: string | null;
  field_map_json: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

async function assertAdmin(supabase: any, userId: string) {
  const { data: isAdmin } = await supabase.rpc("has_role", { _user_id: userId, _role: "admin" });
  if (!isAdmin) throw new Error("Forbidden");
}

export const listCertificateTemplates = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<CertificateTemplateDTO[]> => {
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin
      .from("certificate_templates")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return ((data ?? []) as any[]).map((r) => ({
      id: r.id,
      slug: r.slug,
      name: r.name,
      is_default: r.is_default,
      certificate_pdf_path: r.certificate_pdf_path,
      unit_summary_pdf_path: r.unit_summary_pdf_path,
      field_map_json: JSON.stringify(r.field_map ?? {}),
      notes: r.notes,
      created_at: r.created_at,
      updated_at: r.updated_at,
    }));
  });

const uploadSchema = z.object({
  slug: z.string().min(2).max(64).regex(/^[a-z0-9-]+$/),
  name: z.string().min(2).max(120),
  certificate_pdf_b64: z.string().min(100),
  unit_summary_pdf_b64: z.string().nullable().optional(),
  field_map_json: z.string(),
  notes: z.string().nullable().optional(),
  set_default: z.boolean().default(false),
});

export const createCertificateTemplate = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => uploadSchema.parse(input))
  .handler(async ({ data, context }): Promise<CertificateTemplateDTO> => {
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const id = crypto.randomUUID();
    const certPath = `${id}/certificate.pdf`;
    const unitPath = data.unit_summary_pdf_b64 ? `${id}/unit-summary.pdf` : null;

    const certBytes = Uint8Array.from(atob(data.certificate_pdf_b64), (c) => c.charCodeAt(0));
    const { error: upErr } = await supabaseAdmin.storage
      .from("certificate-templates")
      .upload(certPath, certBytes, { contentType: "application/pdf", upsert: true });
    if (upErr) throw upErr;

    if (unitPath && data.unit_summary_pdf_b64) {
      const unitBytes = Uint8Array.from(atob(data.unit_summary_pdf_b64), (c) => c.charCodeAt(0));
      const { error: upErr2 } = await supabaseAdmin.storage
        .from("certificate-templates")
        .upload(unitPath, unitBytes, { contentType: "application/pdf", upsert: true });
      if (upErr2) throw upErr2;
    }

    if (data.set_default) {
      await supabaseAdmin.from("certificate_templates").update({ is_default: false } as never).eq("is_default", true);
    }

    const { data: row, error } = await supabaseAdmin
      .from("certificate_templates")
      .insert({
        id,
        slug: data.slug,
        name: data.name,
        is_default: data.set_default,
        certificate_pdf_path: certPath,
        unit_summary_pdf_path: unitPath,
        field_map: data.field_map ?? {},
        notes: data.notes ?? null,
      } as never)
      .select()
      .single();
    if (error) throw error;
    return row as CertificateTemplateDTO;
  });

export const setDefaultCertificateTemplate = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i) => z.object({ id: z.string().uuid() }).parse(i))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin.from("certificate_templates").update({ is_default: false } as never).eq("is_default", true);
    const { error } = await supabaseAdmin
      .from("certificate_templates")
      .update({ is_default: true } as never)
      .eq("id", data.id);
    if (error) throw error;
    return { ok: true };
  });

export const updateCertificateTemplateFieldMap = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i) => z.object({ id: z.string().uuid(), field_map: z.record(z.string(), z.unknown()) }).parse(i))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("certificate_templates")
      .update({ field_map: data.field_map } as never)
      .eq("id", data.id);
    if (error) throw error;
    return { ok: true };
  });

export const deleteCertificateTemplate = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i) => z.object({ id: z.string().uuid() }).parse(i))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: row } = await supabaseAdmin
      .from("certificate_templates")
      .select("certificate_pdf_path, unit_summary_pdf_path")
      .eq("id", data.id)
      .maybeSingle();
    const paths = [
      (row as any)?.certificate_pdf_path,
      (row as any)?.unit_summary_pdf_path,
    ].filter(Boolean) as string[];
    if (paths.length > 0) {
      await supabaseAdmin.storage.from("certificate-templates").remove(paths);
    }
    const { error } = await supabaseAdmin.from("certificate_templates").delete().eq("id", data.id);
    if (error) throw error;
    return { ok: true };
  });

/** Renders a preview using dummy learner data, returns PDF bytes as base64 */
export const previewCertificateTemplate = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i) => z.object({ id: z.string().uuid() }).parse(i))
  .handler(async ({ data, context }): Promise<{ pdf_b64: string }> => {
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    // Temporarily flag this template as default in memory by calling renderer with it
    // Simpler: force it default for the duration of the render by loading its map directly
    const { data: row } = await supabaseAdmin
      .from("certificate_templates")
      .select("*")
      .eq("id", data.id)
      .maybeSingle();
    if (!row) throw new Error("Template not found");

    // Swap: temporarily mark this one default, render, then restore. Cheapest — call renderer with a
    // sentinel by directly invoking with a fake-default row. We'll do a lightweight redirect:
    // set is_default=true for this row (unsetting others), render, then restore whichever was previously default.
    const { data: prevDefault } = await supabaseAdmin
      .from("certificate_templates")
      .select("id")
      .eq("is_default", true)
      .maybeSingle();
    const prevDefaultId = (prevDefault as any)?.id as string | undefined;

    if (prevDefaultId !== (row as any).id) {
      if (prevDefaultId) {
        await supabaseAdmin.from("certificate_templates").update({ is_default: false } as never).eq("id", prevDefaultId);
      }
      await supabaseAdmin.from("certificate_templates").update({ is_default: true } as never).eq("id", (row as any).id);
    }

    try {
      const { generateCertificatePdf } = await import("./pdf.server");
      const pdfBytes = await generateCertificatePdf({
        certificateNumber: "REPS-CERT-PREVIEW",
        learnerName: "Jamie Sample Learner",
        courseTitle: "Level 2 Certificate in Gym Instructing",
        courseLevel: 2,
        repsCourseNumber: "RC-1234",
        ofqualNumber: "603/1234/5",
        providerName: "Sample Training Ltd",
        providerLogoUrl: null,
        issuedAt: new Date(),
        verificationUrl: "https://repsuk.org/verify/preview-token",
        unitSummary: [
          "Anatomy and physiology for exercise",
          "Health, safety and welfare in a fitness environment",
          "Principles of exercise, fitness and health",
          "Know how to support clients who take part in exercise",
          "Planning gym-based exercise",
          "Instructing gym-based exercise",
        ],
      });
      // Base64
      let b64 = "";
      const chunk = 0x8000;
      for (let i = 0; i < pdfBytes.length; i += chunk) {
        b64 += String.fromCharCode.apply(null, Array.from(pdfBytes.subarray(i, i + chunk)));
      }
      return { pdf_b64: btoa(b64) };
    } finally {
      if (prevDefaultId && prevDefaultId !== (row as any).id) {
        await supabaseAdmin.from("certificate_templates").update({ is_default: false } as never).eq("id", (row as any).id);
        await supabaseAdmin.from("certificate_templates").update({ is_default: true } as never).eq("id", prevDefaultId);
      }
    }
  });
