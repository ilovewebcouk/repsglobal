/**
 * Certificate template preview renderer — server-only helper.
 *
 * Lives outside `templates.functions.ts` so the createServerFn split
 * transform doesn't strip it from the handler bundle.
 */
import { renderCertificateWithTemplate } from "./pdf.server";

export async function renderTemplatePreview(
  templateId: string,
  overrideFieldMap: unknown | null,
): Promise<{ pdf_b64: string }> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data: row } = await supabaseAdmin
    .from("certificate_templates")
    .select("certificate_pdf_path, unit_summary_pdf_path, field_map")
    .eq("id", templateId)
    .maybeSingle();
  if (!row) throw new Error("Template not found");
  const r = row as any;

  const pdfBytes = await renderCertificateWithTemplate(
    {
      certificate_pdf_path: r.certificate_pdf_path as string,
      unit_summary_pdf_path: (r.unit_summary_pdf_path ?? null) as string | null,
      field_map: (overrideFieldMap ?? r.field_map ?? {}) as any,
    },
    {
      certificateNumber: "REPS-CERT-PREVIEW",
      learnerName: "Jamie Sample Learner",
      courseTitle: "Level 2 Certificate in Gym Instructing",
      courseLevel: 2,
      repsCourseNumber: "RC-1234",
      ofqualNumber: "603/1234/5",
      providerName: "Sample Training Ltd",
      providerLogoUrl: null,
      providerCenterNumber: "REPS-000123",
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
    },
  );

  let b64 = "";
  const chunk = 0x8000;
  for (let i = 0; i < pdfBytes.length; i += chunk) {
    b64 += String.fromCharCode.apply(null, Array.from(pdfBytes.subarray(i, i + chunk)));
  }
  return { pdf_b64: btoa(b64) };
}
