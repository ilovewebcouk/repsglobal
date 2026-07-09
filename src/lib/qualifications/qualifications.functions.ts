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
import { OFQUAL_QUAL_NO_REGEX } from "@/lib/cpd/awarding-bodies";

// ─────────────────────────────────────────────────────────────────────────────
// Types shared with UI

export type OfqualSnapshot = {
  qualificationNumber: string;
  title: string | null;
  awardingOrganisation: string | null;
  level: string | null;
  status: string | null;
} | null;

export type RegulatedPermissionRow = {
  id: string;
  provider_id: string;
  ofqual_number: string | null;
  ofqual_snapshot: OfqualSnapshot;
  ofqual_found: boolean;
  // Legacy — historic rows only.
  qualification_id: string | null;
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
  ai_cross_check: {
    ofqual_found: boolean;
    awarding_body_match: boolean;
    qualification_in_doc: "yes" | "no" | "inconclusive";
  } | null;
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
// Ofqual resolve (called by the provider dashboard as they type the number)

export const resolveOfqualNumber = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({ ofqual_number: z.string().min(1).max(20) }).parse(d),
  )
  .handler(async ({ data }) => {
    const trimmed = data.ofqual_number.trim().toUpperCase();
    if (!OFQUAL_QUAL_NO_REGEX.test(trimmed)) {
      return { valid: false as const, found: false, snapshot: null };
    }
    const { lookupOfqualQualification } = await import("@/lib/cpd/ofqual.server");
    const result = await lookupOfqualQualification(trimmed);
    return {
      valid: true as const,
      found: result.found,
      snapshot: result.record
        ? {
            qualificationNumber: result.record.qualificationNumber,
            title: result.record.title,
            awardingOrganisation: result.record.awardingOrganisation,
            level: result.record.level,
            status: result.record.status,
          }
        : null,
    };
  });

// ─────────────────────────────────────────────────────────────────────────────
// Provider — regulated permission submission (Ofqual-number-first)

const submitRegulatedInput = z.object({
  ofqual_number: z.string().min(1).max(20),
  evidence_type: z.enum(["eqa_report", "centre_certificate", "approval_letter"]),
  evidence_doc_paths: z.array(z.string().min(1)).min(1).max(5),
  awarding_body_reference: z.string().max(120).optional().nullable(),
});

// Gate: training PROVIDERS (organisations) must set a trading name
// (profiles.business_name) before they can submit regulated qualifications
// or CPD courses — otherwise the admin queue can't identify them.
// Individual trainers submitting their own qualifications are exempt.
async function assertProviderHasTradingName(supabase: any, userId: string) {
  const { data: pro } = await supabase
    .from("professionals")
    .select("account_type")
    .eq("id", userId)
    .maybeSingle();
  if (pro?.account_type !== "organisation") return;

  const { data, error } = await supabase
    .from("profiles")
    .select("business_name")
    .eq("id", userId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  const name = (data?.business_name as string | null | undefined)?.trim();
  if (!name) {
    throw new Error(
      "Set your trading name on your Verification page before submitting qualifications or CPD.",
    );
  }
}


export const submitRegulatedPermission = createServerFn({ method: "POST" })

  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => submitRegulatedInput.parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    await assertProviderHasTradingName(supabase, userId);



    const ofqualNumber = data.ofqual_number.trim().toUpperCase();
    if (!OFQUAL_QUAL_NO_REGEX.test(ofqualNumber)) {
      throw new Error("Ofqual qualification number must look like 601/3866/X");
    }

    // Ownership: every doc must be under the caller's storage folder
    for (const p of data.evidence_doc_paths) {
      if (!p.startsWith(`${userId}/`)) {
        throw new Error("Forbidden: doc path does not belong to you");
      }
    }

    // Snapshot the Ofqual register at submit time
    const { lookupOfqualQualification } = await import("@/lib/cpd/ofqual.server");
    const lookup = await lookupOfqualQualification(ofqualNumber);
    const snapshot = lookup.record
      ? {
          qualificationNumber: lookup.record.qualificationNumber,
          title: lookup.record.title,
          awardingOrganisation: lookup.record.awardingOrganisation,
          level: lookup.record.level,
          status: lookup.record.status,
        }
      : null;

    // Ensure a professional row exists
    await supabase.from("professionals").upsert({ id: userId } as never, { onConflict: "id" });

    const { data: row, error } = await supabase
      .from("provider_regulated_permissions")
      .insert({
        provider_id: userId,
        ofqual_number: ofqualNumber,
        ofqual_snapshot: snapshot as never,
        ofqual_found: lookup.found,
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

// Batch: submit several Ofqual numbers sharing the same evidence documents.
// One EQA report or approval letter usually covers multiple qualifications;
// this creates one row per number, all tied together by submission_group_id.
const submitRegulatedBatchInput = z.object({
  ofqual_numbers: z.array(z.string().min(1).max(20)).min(1).max(10),
  evidence_type: z.enum(["eqa_report", "centre_certificate", "approval_letter"]),
  evidence_doc_paths: z.array(z.string().min(1)).min(1).max(5),
  awarding_body_reference: z.string().max(120).optional().nullable(),
});

export const submitRegulatedPermissionBatch = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => submitRegulatedBatchInput.parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    await assertProviderHasTradingName(supabase, userId);



    // Ownership: every doc must be under the caller's storage folder.
    for (const p of data.evidence_doc_paths) {
      if (!p.startsWith(`${userId}/`)) {
        throw new Error("Forbidden: doc path does not belong to you");
      }
    }

    // Normalise + dedupe + validate format.
    const numbers = Array.from(
      new Set(data.ofqual_numbers.map((n) => n.trim().toUpperCase()).filter(Boolean)),
    );
    if (numbers.length === 0) throw new Error("Add at least one Ofqual number");
    for (const n of numbers) {
      if (!OFQUAL_QUAL_NO_REGEX.test(n)) {
        throw new Error(`Ofqual number ${n} must look like 601/3866/X`);
      }
    }

    await supabase.from("professionals").upsert({ id: userId } as never, { onConflict: "id" });

    const { lookupOfqualQualification } = await import("@/lib/cpd/ofqual.server");
    const groupId = crypto.randomUUID();
    const insertedIds: string[] = [];

    for (const ofqualNumber of numbers) {
      const lookup = await lookupOfqualQualification(ofqualNumber);
      const snapshot = lookup.record
        ? {
            qualificationNumber: lookup.record.qualificationNumber,
            title: lookup.record.title,
            awardingOrganisation: lookup.record.awardingOrganisation,
            level: lookup.record.level,
            status: lookup.record.status,
          }
        : null;

      const { data: row, error } = await supabase
        .from("provider_regulated_permissions")
        .insert({
          provider_id: userId,
          ofqual_number: ofqualNumber,
          ofqual_snapshot: snapshot as never,
          ofqual_found: lookup.found,
          submission_group_id: groupId,
          evidence_type: data.evidence_type,
          evidence_doc_paths: data.evidence_doc_paths,
          awarding_body_reference: data.awarding_body_reference ?? null,
        } as never)
        .select("id")
        .single();
      if (error) throw new Error(error.message);
      insertedIds.push(row!.id);
    }

    // Kick off AI extraction per row (non-blocking; fails soft).
    for (const id of insertedIds) {
      try {
        await runRegulatedAiExtraction(id);
      } catch (e) {
        console.error("[AI extraction — regulated batch] failed", e);
      }
    }

    return { group_id: groupId, ids: insertedIds };
  });

export const listMyRegulatedPermissions = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data, error } = await supabase
      .from("provider_regulated_permissions")
      .select(
        "id, provider_id, ofqual_number, ofqual_snapshot, ofqual_found, qualification_id, evidence_type, evidence_doc_paths, awarding_body_reference, ai_verdict, ai_red_flags, ai_cross_check, status, admin_note, evidence_issued_at, evidence_expires_at, created_at, reviewed_at, qualification:qualification_id (id, title, level, awarding_body_slug, ofqual_ref)",
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
    await assertProviderHasTradingName(supabase, userId);



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
        "id, provider_id, ofqual_number, ofqual_snapshot, ofqual_found, submission_group_id, qualification_id, evidence_type, evidence_doc_paths, awarding_body_reference, ai_extraction, ai_verdict, ai_red_flags, ai_cross_check, status, admin_note, evidence_issued_at, evidence_expires_at, created_at, reviewed_at, qualification:qualification_id (id, title, level, awarding_body_slug, ofqual_ref), provider:provider_id (id, slug, legal_entity_name, identity_verified_name, contact_email)",
      )
      .eq("status", data.status)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return await hydrateProviderNames(rows ?? [], supabaseAdmin);
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
    return await hydrateProviderNames(rows ?? [], supabaseAdmin);
  });

// Provider display name comes from ONE column: profiles.business_name.
// The joined `provider.legal_entity_name` field is overwritten with this
// value so downstream UI keeps its existing shape, but the read path no
// longer falls back through identity_verified_name / display_name /
// full_name — those aren't the provider's public trading name.
async function hydrateProviderNames<T extends { provider?: { id?: string | null; legal_entity_name?: string | null; identity_verified_name?: string | null } | null }>(
  rows: T[],
  supabaseAdmin: any,
): Promise<T[]> {
  const ids = Array.from(
    new Set(
      rows
        .map((r) => r.provider?.id)
        .filter((id): id is string => Boolean(id)),
    ),
  );
  if (ids.length === 0) return rows;
  const { data: profs } = await supabaseAdmin
    .from("profiles")
    .select("id, business_name")
    .in("id", ids);
  const nameById = new Map<string, string>();
  for (const p of ((profs as Array<{ id: string; business_name: string | null }> | null) ?? [])) {
    const n = p.business_name?.trim();
    if (n) nameById.set(p.id, n);
  }
  return rows.map((r) => {
    if (!r.provider?.id) return r;
    const n = nameById.get(r.provider.id);
    // Always prefer business_name (the provider-editable trading name) over
    // whatever legal_entity_name/identity_verified_name were stored.
    return { ...r, provider: { ...r.provider, legal_entity_name: n ?? null, identity_verified_name: null } };
  });
}



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

const REGULATED_SYSTEM = `You are an evidence reviewer for REPS, a professional register for fitness training providers. You inspect one PDF/image of provider evidence — an EQA report, centre approval certificate, or approval letter — and extract structured fields. Return ONLY valid JSON. Do not fabricate. If a field is not visible in the document, return null (or an empty array). Do not guess.

Fields:
- document_type: "eqa_report" | "centre_certificate" | "approval_letter" | "other"
- awarding_body_detected: canonical awarding body name if visible (e.g. Active IQ, Focus Awards, YMCA Awards, NCFE, VTCT, Innovate Awarding, TQUK, 1st4sport, Pearson, City & Guilds), or the name as it appears on the document
- centre_name_detected: the approved centre name as it appears on the document (this is the training provider being approved)
- centre_number_detected: the awarding body's centre number for that provider, if quoted
- approval_status: "approved" | "suspended" | "withdrawn" | "unclear"
- qualifications_listed: array of {title, ofqual_ref_if_visible}, listing every regulated qualification the document says this centre is approved to deliver
- issue_date: YYYY-MM-DD if visible (report date or letter date)
- expiry_date: YYYY-MM-DD if visible (expiry of approval, or next EQA visit / next review date)
- eqa_name: External Quality Assurer's name if visible
- signatory_name
- signatory_role
- confidence: 0..1 overall
- red_flags: array of short strings such as "no letterhead", "expired", "template mismatch", "unreadable", "wrong document type", "centre_number_missing", "no dates present"`;

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
      "id, evidence_doc_paths, evidence_type, ofqual_number, ofqual_snapshot, ofqual_found",
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

  const r = row as unknown as {
    evidence_type: string;
    ofqual_number: string | null;
    ofqual_snapshot: {
      title: string | null;
      awardingOrganisation: string | null;
      level: string | null;
      status: string | null;
    } | null;
    ofqual_found: boolean;
  };
  const snap = r.ofqual_snapshot;
  const claim = snap
    ? `The provider is claiming approval to deliver Ofqual qualification ${r.ofqual_number} — "${snap.title ?? "?"}"${
        snap.level ? ` (${snap.level})` : ""
      }, awarded by ${snap.awardingOrganisation ?? "?"}. Their submitted evidence type is: ${r.evidence_type}. Confirm from the document whether their centre is approved to deliver this qualification, and extract every field per the schema.`
    : `The provider entered Ofqual number ${r.ofqual_number ?? "(unknown)"}, which was NOT found on the Ofqual register. Their submitted evidence type is: ${r.evidence_type}. Extract every field per the schema so a human reviewer can judge.`;

  const parts: Array<{ text?: string } | { image_url: { url: string } }> = [{ text: claim }];
  for (const url of urls) parts.push({ image_url: { url } });

  const result = await callGemini(REGULATED_SYSTEM, parts);
  if (!result) {
    await supabaseAdmin
      .from("provider_regulated_permissions")
      .update({
        ai_verdict: "inconclusive",
        ai_red_flags: [],
        ai_cross_check: {
          ofqual_found: r.ofqual_found,
          awarding_body_match: false,
          qualification_in_doc: "inconclusive",
        } as never,
      } as never)
      .eq("id", id);
    return;
  }

  // Cross-check: awarding body match + qualification listed in doc
  const raw = result.raw as {
    awarding_body_detected?: string | null;
    qualifications_listed?: Array<{ title?: string | null; ofqual_ref_if_visible?: string | null }> | null;
  };
  const norm = (s: string | null | undefined) =>
    (s ?? "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();

  let awardingBodyMatch = false;
  if (snap?.awardingOrganisation && raw.awarding_body_detected) {
    const a = norm(snap.awardingOrganisation);
    const b = norm(raw.awarding_body_detected);
    awardingBodyMatch = !!a && !!b && (a === b || a.includes(b) || b.includes(a));
  }

  let qualificationInDoc: "yes" | "no" | "inconclusive" = "inconclusive";
  const listed = Array.isArray(raw.qualifications_listed) ? raw.qualifications_listed : [];
  if (listed.length > 0) {
    const target = norm(r.ofqual_number ?? "");
    const targetTitle = norm(snap?.title ?? "");
    const hit = listed.some((q) => {
      const ref = norm(q?.ofqual_ref_if_visible ?? "");
      const t = norm(q?.title ?? "");
      if (target && ref && (ref === target || ref.includes(target) || target.includes(ref))) return true;
      if (targetTitle && t && (t === targetTitle || t.includes(targetTitle) || targetTitle.includes(t))) return true;
      return false;
    });
    qualificationInDoc = hit ? "yes" : "no";
  }

  await supabaseAdmin
    .from("provider_regulated_permissions")
    .update({
      ai_extraction: result.raw as never,
      ai_verdict: result.verdict as never,
      ai_red_flags: result.red_flags as never,
      ai_cross_check: {
        ofqual_found: r.ofqual_found,
        awarding_body_match: awardingBodyMatch,
        qualification_in_doc: qualificationInDoc,
      } as never,
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
  ofqual_number: string | null;
  ofqual_snapshot: OfqualSnapshot;
  // Historic rows may still link to the deprecated catalogue table.
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
          "id, ofqual_number, ofqual_snapshot, qualification:qualification_id (id, title, level, awarding_body_slug, ofqual_ref)",
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
