/**
 * Provider Qualifications & CPD — server functions
 *
 * Two flows, one file:
 *  1. Regulated permission (provider proves they're approved to deliver an
 *     Ofqual-regulated qualification via EQA report / centre certificate /
 *     approval letter).
 *  2. CPD accreditation (REPS accredits the provider's own CPD course based
 *     on syllabus + assessment criteria + tutor CV).
 *
 * Every submission runs a Lovable AI extraction pass. Failure is non-fatal:
 * the row lands with ai_verdict='inconclusive' and admin still reviews.
 */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

// ─────────────────────────────────────────────────────────────────────────────
// Types shared with UI

export type RegulatedPermissionRow = {
  id: string;
  provider_id: string;
  qualification_id: string;
  qualification: {
    id: string;
    title: string;
    level: number | null;
    awarding_body_slug: string;
    ofqual_ref: string | null;
  } | null;
  evidence_type: "eqa_report" | "centre_certificate" | "approval_letter";
  evidence_doc_paths: string[];
  awarding_body_reference: string | null;
  ai_verdict: "recommend_approve" | "flagged" | "inconclusive" | null;
  ai_red_flags: string[];
  status: "submitted" | "approved" | "rejected" | "changes_requested";
  admin_note: string | null;
  evidence_issued_at: string | null;
  evidence_expires_at: string | null;
  created_at: string;
  reviewed_at: string | null;
};

export type CpdCourseRow = {
  id: string;
  provider_id: string;
  title: string;
  level: number | null;
  hours: number | null;
  delivery_mode: "in_person" | "online" | "blended" | null;
  summary: string | null;
  syllabus_doc_path: string | null;
  assessment_criteria_doc_path: string | null;
  tutor_cv_doc_path: string | null;
  ai_verdict: "recommend_approve" | "flagged" | "inconclusive" | null;
  ai_red_flags: string[];
  status: "submitted" | "approved" | "rejected" | "changes_requested";
  reps_cpd_number: string | null;
  accredited_at: string | null;
  admin_note: string | null;
  created_at: string;
};

// ─────────────────────────────────────────────────────────────────────────────
// Catalogue (public read)

export const listQualifications = createServerFn({ method: "GET" })
  .handler(async () => {
    const { createClient } = await import("@supabase/supabase-js");
    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_PUBLISHABLE_KEY!,
      { auth: { storage: undefined, persistSession: false, autoRefreshToken: false } },
    );
    const { data, error } = await supabase
      .from("qualifications")
      .select("id, title, level, awarding_body_slug, ofqual_ref, title_slug")
      .eq("is_active", true)
      .order("awarding_body_slug")
      .order("level", { ascending: true, nullsFirst: false })
      .order("title");
    if (error) throw new Error(error.message);
    return data ?? [];
  });

// ─────────────────────────────────────────────────────────────────────────────
// Provider — regulated permissions

const submitRegulatedInput = z.object({
  qualification_id: z.string().uuid(),
  evidence_type: z.enum(["eqa_report", "centre_certificate", "approval_letter"]),
  evidence_doc_paths: z.array(z.string().min(1)).min(1).max(5),
  awarding_body_reference: z.string().max(120).optional().nullable(),
});

export const submitRegulatedPermission = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => submitRegulatedInput.parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    // Ownership: every doc must be under the caller's storage folder
    for (const p of data.evidence_doc_paths) {
      if (!p.startsWith(`${userId}/`)) {
        throw new Error("Forbidden: doc path does not belong to you");
      }
    }

    // Ensure a professional row exists
    await supabase.from("professionals").upsert({ id: userId } as never, { onConflict: "id" });

    const { data: row, error } = await supabase
      .from("provider_regulated_permissions")
      .insert({
        provider_id: userId,
        qualification_id: data.qualification_id,
        evidence_type: data.evidence_type,
        evidence_doc_paths: data.evidence_doc_paths,
        awarding_body_reference: data.awarding_body_reference ?? null,
      } as never)
      .select("id")
      .single();
    if (error) throw new Error(error.message);

    // Kick off AI extraction (non-blocking; fails soft)
    try {
      await runRegulatedAiExtraction(row!.id);
    } catch (e) {
      console.error("[AI extraction — regulated] failed", e);
    }

    return row;
  });

export const listMyRegulatedPermissions = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data, error } = await supabase
      .from("provider_regulated_permissions")
      .select(
        "id, provider_id, qualification_id, evidence_type, evidence_doc_paths, awarding_body_reference, ai_verdict, ai_red_flags, status, admin_note, evidence_issued_at, evidence_expires_at, created_at, reviewed_at, qualification:qualification_id (id, title, level, awarding_body_slug, ofqual_ref)",
      )
      .eq("provider_id", userId)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return (data ?? []) as unknown as RegulatedPermissionRow[];
  });

export const deleteMyRegulatedPermission = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { error } = await supabase
      .from("provider_regulated_permissions")
      .delete()
      .eq("id", data.id)
      .eq("provider_id", userId)
      .eq("status", "submitted");
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ─────────────────────────────────────────────────────────────────────────────
// Provider — CPD courses

const submitCpdInput = z.object({
  title: z.string().min(3).max(160),
  level: z.number().int().min(1).max(7).optional().nullable(),
  hours: z.number().min(0.5).max(500).optional().nullable(),
  delivery_mode: z.enum(["in_person", "online", "blended"]).optional().nullable(),
  summary: z.string().max(1500).optional().nullable(),
  syllabus_doc_path: z.string().min(1),
  assessment_criteria_doc_path: z.string().min(1),
  tutor_cv_doc_path: z.string().min(1),
});

export const submitCpdCourse = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => submitCpdInput.parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    for (const p of [data.syllabus_doc_path, data.assessment_criteria_doc_path, data.tutor_cv_doc_path]) {
      if (!p.startsWith(`${userId}/`)) {
        throw new Error("Forbidden: doc path does not belong to you");
      }
    }

    await supabase.from("professionals").upsert({ id: userId } as never, { onConflict: "id" });

    const { data: row, error } = await supabase
      .from("cpd_courses")
      .insert({
        provider_id: userId,
        title: data.title,
        level: data.level ?? null,
        hours: data.hours ?? null,
        delivery_mode: data.delivery_mode ?? null,
        summary: data.summary ?? null,
        syllabus_doc_path: data.syllabus_doc_path,
        assessment_criteria_doc_path: data.assessment_criteria_doc_path,
        tutor_cv_doc_path: data.tutor_cv_doc_path,
      } as never)
      .select("id")
      .single();
    if (error) throw new Error(error.message);

    try {
      await runCpdAiExtraction(row!.id);
    } catch (e) {
      console.error("[AI extraction — CPD] failed", e);
    }

    return row;
  });

export const listMyCpdCourses = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data, error } = await supabase
      .from("cpd_courses")
      .select(
        "id, provider_id, title, level, hours, delivery_mode, summary, syllabus_doc_path, assessment_criteria_doc_path, tutor_cv_doc_path, ai_verdict, ai_red_flags, status, reps_cpd_number, accredited_at, admin_note, created_at",
      )
      .eq("provider_id", userId)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return (data ?? []) as unknown as CpdCourseRow[];
  });

export const deleteMyCpdCourse = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { error } = await supabase
      .from("cpd_courses")
      .delete()
      .eq("id", data.id)
      .eq("provider_id", userId)
      .eq("status", "submitted");
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ─────────────────────────────────────────────────────────────────────────────
// Admin queues

async function requireAdmin(userId: string) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await supabaseAdmin.rpc("has_role", { _user_id: userId, _role: "admin" });
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Forbidden");
}

export const adminListRegulatedQueue = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({ status: z.enum(["submitted", "approved", "rejected", "changes_requested"]).default("submitted") }).parse(d ?? {}),
  )
  .handler(async ({ data, context }) => {
    await requireAdmin(context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: rows, error } = await supabaseAdmin
      .from("provider_regulated_permissions")
      .select(
        "id, provider_id, qualification_id, evidence_type, evidence_doc_paths, awarding_body_reference, ai_extraction, ai_verdict, ai_red_flags, status, admin_note, evidence_issued_at, evidence_expires_at, created_at, reviewed_at, qualification:qualification_id (id, title, level, awarding_body_slug, ofqual_ref), provider:provider_id (id, slug, legal_entity_name, identity_verified_name, contact_email)",
      )
      .eq("status", data.status)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return rows ?? [];
  });

export const adminListCpdQueue = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({ status: z.enum(["submitted", "approved", "rejected", "changes_requested"]).default("submitted") }).parse(d ?? {}),
  )
  .handler(async ({ data, context }) => {
    await requireAdmin(context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: rows, error } = await supabaseAdmin
      .from("cpd_courses")
      .select(
        "id, provider_id, title, level, hours, delivery_mode, summary, syllabus_doc_path, assessment_criteria_doc_path, tutor_cv_doc_path, ai_extraction, ai_verdict, ai_red_flags, status, reps_cpd_number, accredited_at, admin_note, created_at, provider:provider_id (id, slug, legal_entity_name, identity_verified_name, contact_email)",
      )
      .eq("status", data.status)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return rows ?? [];
  });

export const adminDecideRegulated = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        id: z.string().uuid(),
        decision: z.enum(["approved", "rejected", "changes_requested"]),
        admin_note: z.string().max(1000).optional().nullable(),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    await requireAdmin(context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    if (data.decision !== "approved" && !data.admin_note?.trim()) {
      throw new Error("Admin note required when rejecting or requesting changes");
    }
    const { error } = await supabaseAdmin
      .from("provider_regulated_permissions")
      .update({
        status: data.decision,
        admin_note: data.admin_note?.trim() || null,
        reviewed_by: context.userId,
        reviewed_at: new Date().toISOString(),
      } as never)
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const adminDecideCpd = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        id: z.string().uuid(),
        decision: z.enum(["approved", "rejected", "changes_requested"]),
        admin_note: z.string().max(1000).optional().nullable(),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    await requireAdmin(context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    if (data.decision !== "approved" && !data.admin_note?.trim()) {
      throw new Error("Admin note required when rejecting or requesting changes");
    }
    const { error } = await supabaseAdmin
      .from("cpd_courses")
      .update({
        status: data.decision,
        admin_note: data.admin_note?.trim() || null,
        reviewed_by: context.userId,
        reviewed_at: new Date().toISOString(),
      } as never)
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ─────────────────────────────────────────────────────────────────────────────
// Public — approved rows for /t/$slug

export const getProviderQualificationsForProfile = createServerFn({ method: "GET" })
  .inputValidator((d: unknown) => z.object({ provider_id: z.string().uuid() }).parse(d))
  .handler(async ({ data }) => {
    const { createClient } = await import("@supabase/supabase-js");
    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_PUBLISHABLE_KEY!,
      { auth: { storage: undefined, persistSession: false, autoRefreshToken: false } },
    );
    const [reg, cpd] = await Promise.all([
      supabase
        .from("provider_regulated_permissions")
        .select("id, qualification:qualification_id (id, title, level, awarding_body_slug, ofqual_ref)")
        .eq("provider_id", data.provider_id)
        .eq("status", "approved"),
      supabase
        .from("cpd_courses")
        .select("id, title, level, hours, delivery_mode, summary, reps_cpd_number, accredited_at")
        .eq("provider_id", data.provider_id)
        .eq("status", "approved")
        .order("accredited_at", { ascending: false }),
    ]);
    if (reg.error) throw new Error(reg.error.message);
    if (cpd.error) throw new Error(cpd.error.message);
    return {
      regulated: (reg.data ?? []) as unknown as Array<{
        id: string;
        qualification: {
          id: string;
          title: string;
          level: number | null;
          awarding_body_slug: string;
          ofqual_ref: string | null;
        } | null;
      }>,
      cpd: cpd.data ?? [],
    };
  });

// ─────────────────────────────────────────────────────────────────────────────
// AI extraction (Lovable AI Gateway, gemini-2.5-pro)

const REGULATED_SYSTEM = `You are an evidence reviewer for REPS, a professional register for fitness training providers. You inspect one PDF/image of provider evidence and extract structured fields. Return ONLY valid JSON. Do not fabricate.

Fields:
- document_type: "eqa_report" | "centre_certificate" | "approval_letter" | "other"
- awarding_body_detected: canonical name if visible (Active IQ, Focus Awards, YMCA Awards, NCFE, VTCT, Innovate Awarding, TQUK, 1st4sport, or other)
- centre_name_detected
- centre_number_detected
- qualifications_listed: array of {title, ofqual_ref_if_visible}
- issue_date: YYYY-MM-DD if visible
- expiry_date: YYYY-MM-DD if visible
- signatory_name
- signatory_role
- confidence: 0..1 overall
- red_flags: array of strings such as "no letterhead", "expired", "template mismatch", "unreadable", "wrong document type"`;

const CPD_SYSTEM = `You are a CPD accreditation reviewer for REPS. The provider is requesting REPS accreditation for a fitness/coaching CPD course. You inspect three uploaded files (syllabus, assessment criteria, tutor CV — you receive them in this order) and extract structured fields. Return ONLY valid JSON. Do not fabricate.

Fields:
- syllabus: {learning_outcomes: string[], total_hours: number|null, delivery_mode: "in_person"|"online"|"blended"|null, has_assessment_reference: boolean}
- assessment: {assessment_methods: string[], pass_criteria: string|null, grading_rubric_present: boolean}
- tutor: {name: string|null, highest_qualification_level: number|null, qualification_titles: string[], years_experience: number|null, domain_match_to_syllabus: boolean}
- confidence: 0..1 overall
- red_flags: array such as "file mislabelled", "tutor under-qualified", "missing assessment method", "syllabus too thin", "no learning outcomes"`;

async function callGemini(system: string, parts: Array<{ text?: string } | { image_url: { url: string } }>): Promise<{ verdict: "recommend_approve" | "flagged" | "inconclusive"; red_flags: string[]; raw: unknown } | null> {
  const key = process.env.LOVABLE_API_KEY;
  if (!key) return null;
  const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
    body: JSON.stringify({
      model: "google/gemini-2.5-pro",
      messages: [
        { role: "system", content: system },
        {
          role: "user",
          content: parts.map((p) =>
            "text" in p && p.text
              ? { type: "text", text: p.text }
              : "image_url" in p
                ? { type: "image_url", image_url: p.image_url }
                : { type: "text", text: "" },
          ),
        },
      ],
      response_format: { type: "json_object" },
    }),
  });
  if (!res.ok) {
    const body = await res.text();
    console.error(`[AI gateway] ${res.status}: ${body}`);
    return null;
  }
  const json = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
  const content = json.choices?.[0]?.message?.content;
  if (!content) return null;
  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(content);
  } catch {
    return null;
  }
  const redFlags = Array.isArray(parsed.red_flags) ? (parsed.red_flags as string[]) : [];
  const confidence = typeof parsed.confidence === "number" ? (parsed.confidence as number) : 0.5;
  const verdict: "recommend_approve" | "flagged" | "inconclusive" =
    redFlags.length > 0 || confidence < 0.6
      ? "flagged"
      : confidence >= 0.85
        ? "recommend_approve"
        : "inconclusive";
  return { verdict, red_flags: redFlags, raw: parsed };
}

async function signedUrlFor(path: string): Promise<string | null> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await supabaseAdmin.storage
    .from("verification-docs")
    .createSignedUrl(path, 60 * 10);
  if (error || !data) return null;
  return data.signedUrl;
}

async function runRegulatedAiExtraction(id: string): Promise<void> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data: row, error } = await supabaseAdmin
    .from("provider_regulated_permissions")
    .select(
      "id, evidence_doc_paths, evidence_type, qualification:qualification_id (title, level, awarding_body_slug)",
    )
    .eq("id", id)
    .single();
  if (error || !row) return;

  const urls: string[] = [];
  for (const p of (row as { evidence_doc_paths: string[] }).evidence_doc_paths ?? []) {
    const u = await signedUrlFor(p);
    if (u) urls.push(u);
  }
  if (urls.length === 0) return;

  const qual = (row as unknown as { qualification: { title: string; level: number | null; awarding_body_slug: string } | null }).qualification;
  const claim = qual
    ? `The provider is claiming approval to deliver "${qual.title}" (Level ${qual.level ?? "?"}) via ${qual.awarding_body_slug}. Their submitted evidence type is: ${(row as { evidence_type: string }).evidence_type}.`
    : "";

  const parts: Array<{ text?: string } | { image_url: { url: string } }> = [{ text: claim }];
  for (const url of urls) parts.push({ image_url: { url } });

  const result = await callGemini(REGULATED_SYSTEM, parts);
  if (!result) {
    await supabaseAdmin
      .from("provider_regulated_permissions")
      .update({ ai_verdict: "inconclusive", ai_red_flags: [] } as never)
      .eq("id", id);
    return;
  }
  await supabaseAdmin
    .from("provider_regulated_permissions")
    .update({
      ai_extraction: result.raw as never,
      ai_verdict: result.verdict as never,
      ai_red_flags: result.red_flags as never,
    })
    .eq("id", id);
}

async function runCpdAiExtraction(id: string): Promise<void> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data: row, error } = await supabaseAdmin
    .from("cpd_courses")
    .select("id, title, level, hours, syllabus_doc_path, assessment_criteria_doc_path, tutor_cv_doc_path")
    .eq("id", id)
    .single();
  if (error || !row) return;

  const paths = [
    (row as { syllabus_doc_path: string }).syllabus_doc_path,
    (row as { assessment_criteria_doc_path: string }).assessment_criteria_doc_path,
    (row as { tutor_cv_doc_path: string }).tutor_cv_doc_path,
  ];
  const urls: string[] = [];
  for (const p of paths) {
    const u = await signedUrlFor(p);
    if (u) urls.push(u);
  }
  if (urls.length < 3) return;

  const claim = `Course claimed: "${(row as { title: string }).title}", level ${
    (row as { level: number | null }).level ?? "unspecified"
  }, ${(row as { hours: number | null }).hours ?? "unspecified"} hours. Files are (in order): syllabus, assessment criteria, tutor CV.`;

  const parts: Array<{ text?: string } | { image_url: { url: string } }> = [{ text: claim }];
  for (const url of urls) parts.push({ image_url: { url } });

  const result = await callGemini(CPD_SYSTEM, parts);
  if (!result) {
    await supabaseAdmin
      .from("cpd_courses")
      .update({ ai_verdict: "inconclusive", ai_red_flags: [] } as never)
      .eq("id", id);
    return;
  }
  await supabaseAdmin
    .from("cpd_courses")
    .update({
      ai_extraction: result.raw as never,
      ai_verdict: result.verdict as never,
      ai_red_flags: result.red_flags as never,
    })
    .eq("id", id);
}

// ─────────────────────────────────────────────────────────────────────────────
// Signed URLs for provider viewing their own docs + admin viewing any

export const getQualificationDocSignedUrl = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ path: z.string().min(1) }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const isOwn = data.path.startsWith(`${userId}/`);
    if (!isOwn) {
      const { data: isAdmin } = await supabase.rpc("has_role", { _user_id: userId, _role: "admin" });
      if (!isAdmin) throw new Error("Forbidden");
    }
    const { data: signed, error } = await supabaseAdmin.storage
      .from("verification-docs")
      .createSignedUrl(data.path, 60 * 10);
    if (error || !signed) throw new Error(error?.message ?? "Sign failed");
    return { url: signed.signedUrl };
  });

// ─────────────────────────────────────────────────────────────────────────────
// Public — approved qualifications & CPD for a provider (read-only, anon-safe)

export type PublicProviderRegulatedRow = {
  id: string;
  qualification: {
    id: string;
    title: string;
    level: number | null;
    awarding_body_slug: string;
    ofqual_ref: string | null;
  } | null;
};

export type PublicProviderCpdRow = {
  id: string;
  title: string;
  level: number | null;
  hours: number | null;
  delivery_mode: "in_person" | "online" | "blended" | null;
  summary: string | null;
  reps_cpd_number: string | null;
  accredited_at: string | null;
};

export const listPublicProviderQualifications = createServerFn({ method: "GET" })
  .inputValidator((d: unknown) =>
    z.object({ providerId: z.string().uuid() }).parse(d),
  )
  .handler(async ({ data }): Promise<{
    regulated: PublicProviderRegulatedRow[];
    cpd: PublicProviderCpdRow[];
    reps_member_id: string | null;
  }> => {
    const { createClient } = await import("@supabase/supabase-js");
    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_PUBLISHABLE_KEY!,
      { auth: { storage: undefined, persistSession: false, autoRefreshToken: false } },
    );

    const [reg, cpd, pro] = await Promise.all([
      supabase
        .from("provider_regulated_permissions")
        .select(
          "id, qualification:qualification_id (id, title, level, awarding_body_slug, ofqual_ref)",
        )
        .eq("provider_id", data.providerId)
        .eq("status", "approved"),
      supabase
        .from("cpd_courses")
        .select(
          "id, title, level, hours, delivery_mode, summary, reps_cpd_number, accredited_at",
        )
        .eq("provider_id", data.providerId)
        .eq("status", "approved")
        .order("accredited_at", { ascending: false }),
      supabase
        .from("professionals")
        .select("reps_member_id")
        .eq("id", data.providerId)
        .maybeSingle(),
    ]);

    return {
      regulated: ((reg.data ?? []) as unknown) as PublicProviderRegulatedRow[],
      cpd: ((cpd.data ?? []) as unknown) as PublicProviderCpdRow[],
      reps_member_id:
        (pro.data as { reps_member_id?: string | null } | null)?.reps_member_id ?? null,
    };
  });
