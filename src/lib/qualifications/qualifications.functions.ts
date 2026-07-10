/**
 * Provider Qualifications & REPS-accredited courses — server functions.
 *
 * Two flows, one file:
 *  1. Regulated permission — provider proves they're approved to deliver an
 *     Ofqual-regulated qualification (EQA report / centre certificate /
 *     approval letter). REPS's role is to verify the evidence.
 *  2. REPS course accreditation — provider submits syllabus + assessment
 *     criteria + tutor CV; AI drafts the full public spec (title, level,
 *     learning outcomes, GLH, delivery mode, etc.); a REPS admin reviews,
 *     edits and publishes. On approval the row gets a globally-unique
 *     `REPS-QUAL-NNNNNN` number and the spec is what the public sees.
 *
 * The admin is the awarding body. Providers propose; REPS decides.
 */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuthWithImpersonation as requireSupabaseAuth } from "@/integrations/supabase/auth-middleware-impersonation";
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
  reps_qualification_number: string | null;
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
  status: "submitted" | "approved" | "rejected" | "changes_requested" | "withdrawn";
  admin_note: string | null;
  evidence_issued_at: string | null;
  evidence_expires_at: string | null;
  created_at: string;
  reviewed_at: string | null;
  withdrawn_at: string | null;
  withdrawn_reason: string | null;
};

export type RepsCourseStatus =
  | "submitted"
  | "ai_drafted"
  | "changes_requested"
  | "approved"
  | "rejected"
  | "withdrawn";

/** A REPS-accredited course, as seen by the provider dashboard. */
export type RepsCourseRow = {
  id: string;
  provider_id: string;
  proposed_title: string;
  syllabus_doc_path: string;
  assessment_criteria_doc_path: string;
  tutor_cv_doc_path: string;
  ai_verdict: "recommend_approve" | "flagged" | "inconclusive" | null;
  ai_red_flags: string[];
  ai_drafted_at: string | null;
  official_title: string | null;
  official_level: number | null;
  reps_qual_number: string | null;
  spec_who_for: string | null;
  spec_learning_outcomes: string[] | null;
  spec_how_youll_study: string | null;
  spec_how_youre_assessed: string | null;
  spec_prerequisites: string | null;
  spec_guided_learning_hours: number | null;
  spec_total_qualification_time: number | null;
  spec_delivery_mode: "in_person" | "online" | "blended" | null;
  spec_published_at: string | null;
  status: RepsCourseStatus;
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
// Ofqual resolve

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
// Provider guard

async function assertProviderHasTradingName(supabase: any, userId: string) {
  const { data: pro } = await supabase
    .from("professionals")
    .select("account_type")
    .eq("id", userId)
    .maybeSingle();
  if (pro?.account_type !== "organisation") return;

  const { data, error } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", userId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  const name = (data?.full_name as string | null | undefined)?.trim();
  if (!name) {
    throw new Error(
      "Set your trading name on your Verification page before submitting qualifications or courses.",
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Regulated permissions — submit / list / remove

const submitRegulatedInput = z.object({
  ofqual_number: z.string().min(1).max(20),
  evidence_type: z.enum(["eqa_report", "centre_certificate", "approval_letter"]),
  evidence_doc_paths: z.array(z.string().min(1)).min(1).max(5),
  awarding_body_reference: z.string().max(120).optional().nullable(),
});

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

    for (const p of data.evidence_doc_paths) {
      if (!p.startsWith(`${userId}/`)) {
        throw new Error("Forbidden: doc path does not belong to you");
      }
    }

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

    try {
      await runRegulatedAiExtraction(row!.id);
    } catch (e) {
      console.error("[AI extraction — regulated] failed", e);
    }

    return row;
  });

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

    for (const p of data.evidence_doc_paths) {
      if (!p.startsWith(`${userId}/`)) {
        throw new Error("Forbidden: doc path does not belong to you");
      }
    }

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
        "id, provider_id, ofqual_number, ofqual_snapshot, ofqual_found, reps_qualification_number, qualification_id, evidence_type, evidence_doc_paths, awarding_body_reference, ai_verdict, ai_red_flags, ai_cross_check, status, admin_note, evidence_issued_at, evidence_expires_at, created_at, reviewed_at, withdrawn_at, withdrawn_reason, qualification:qualification_id (id, title, level, awarding_body_slug, ofqual_ref)",
      )
      .eq("provider_id", userId)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return (data ?? []) as unknown as RegulatedPermissionRow[];
  });

export const removeMyRegulatedPermission = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        id: z.string().uuid(),
        reason: z.string().max(500).optional().nullable(),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    const { data: row, error: readErr } = await supabase
      .from("provider_regulated_permissions")
      .select("id, provider_id, status, evidence_doc_paths")
      .eq("id", data.id)
      .maybeSingle();
    if (readErr) throw new Error(readErr.message);
    if (!row) throw new Error("Not found");
    if ((row as { provider_id: string }).provider_id !== userId) throw new Error("Forbidden");

    const rowStatus = (row as { status: string }).status;
    if (rowStatus === "withdrawn") return { mode: "withdrawn" as const };

    if (rowStatus === "approved") {
      const { error } = await supabase
        .from("provider_regulated_permissions")
        .update({
          status: "withdrawn",
          withdrawn_at: new Date().toISOString(),
          withdrawn_reason: data.reason?.trim() || null,
        } as never)
        .eq("id", (row as { id: string }).id)
        .eq("provider_id", userId);
      if (error) throw new Error(error.message);
      return { mode: "withdrawn" as const };
    }

    const { error } = await supabase
      .from("provider_regulated_permissions")
      .delete()
      .eq("id", (row as { id: string }).id)
      .eq("provider_id", userId);
    if (error) throw new Error(error.message);

    try {
      const paths = ((row as { evidence_doc_paths: string[] }).evidence_doc_paths ?? []).filter(
        (p: string) => typeof p === "string" && p.startsWith(`${userId}/`),
      );
      if (paths.length > 0) {
        await supabase.storage.from("verification-docs").remove(paths);
      }
    } catch (e) {
      console.error("[removeMyRegulatedPermission] storage cleanup failed", e);
    }

    return { mode: "deleted" as const };
  });

export const deleteMyRegulatedPermission = removeMyRegulatedPermission;

// ─────────────────────────────────────────────────────────────────────────────
// REPS-accredited courses — submit / list / remove

const submitRepsCourseInput = z.object({
  proposed_title: z.string().min(3).max(200),
  syllabus_doc_path: z.string().min(1),
  assessment_criteria_doc_path: z.string().min(1),
  tutor_cv_doc_path: z.string().min(1),
});

export const submitRepsCourse = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => submitRepsCourseInput.parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    await assertProviderHasTradingName(supabase, userId);

    for (const p of [
      data.syllabus_doc_path,
      data.assessment_criteria_doc_path,
      data.tutor_cv_doc_path,
    ]) {
      if (!p.startsWith(`${userId}/`)) {
        throw new Error("Forbidden: doc path does not belong to you");
      }
    }

    await supabase.from("professionals").upsert({ id: userId } as never, { onConflict: "id" });

    const { data: row, error } = await supabase
      .from("reps_courses")
      .insert({
        provider_id: userId,
        proposed_title: data.proposed_title.trim(),
        syllabus_doc_path: data.syllabus_doc_path,
        assessment_criteria_doc_path: data.assessment_criteria_doc_path,
        tutor_cv_doc_path: data.tutor_cv_doc_path,
      } as never)
      .select("id")
      .single();
    if (error) throw new Error(error.message);

    // Fire-and-forget AI drafting — provider polls for the drafted state.
    void runRepsCourseAiDraft((row as { id: string }).id).catch((e) => {
      console.error("[AI draft — REPS course] failed", e);
    });

    return row;
  });

export const listMyRepsCourses = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data, error } = await supabase
      .from("reps_courses")
      .select(
        "id, provider_id, proposed_title, syllabus_doc_path, assessment_criteria_doc_path, tutor_cv_doc_path, ai_verdict, ai_red_flags, ai_drafted_at, official_title, official_level, reps_qual_number, spec_who_for, spec_learning_outcomes, spec_how_youll_study, spec_how_youre_assessed, spec_prerequisites, spec_guided_learning_hours, spec_total_qualification_time, spec_delivery_mode, spec_published_at, status, accredited_at, admin_note, created_at",
      )
      .eq("provider_id", userId)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return (data ?? []) as unknown as RepsCourseRow[];
  });

export const removeMyRepsCourse = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        id: z.string().uuid(),
        reason: z.string().max(500).optional().nullable(),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    const { data: row, error: readErr } = await supabase
      .from("reps_courses")
      .select("id, provider_id, status, syllabus_doc_path, assessment_criteria_doc_path, tutor_cv_doc_path")
      .eq("id", data.id)
      .maybeSingle();
    if (readErr) throw new Error(readErr.message);
    if (!row) throw new Error("Not found");
    const r = row as {
      id: string;
      provider_id: string;
      status: string;
      syllabus_doc_path: string;
      assessment_criteria_doc_path: string;
      tutor_cv_doc_path: string;
    };
    if (r.provider_id !== userId) throw new Error("Forbidden");

    if (r.status === "withdrawn") return { mode: "withdrawn" as const };

    if (r.status === "approved") {
      const { error } = await supabase
        .from("reps_courses")
        .update({
          status: "withdrawn",
          withdrawn_at: new Date().toISOString(),
          withdrawn_reason: data.reason?.trim() || null,
        } as never)
        .eq("id", r.id)
        .eq("provider_id", userId);
      if (error) throw new Error(error.message);
      return { mode: "withdrawn" as const };
    }

    const { error } = await supabase
      .from("reps_courses")
      .delete()
      .eq("id", r.id)
      .eq("provider_id", userId);
    if (error) throw new Error(error.message);

    try {
      const paths = [r.syllabus_doc_path, r.assessment_criteria_doc_path, r.tutor_cv_doc_path].filter(
        (p): p is string => typeof p === "string" && p.startsWith(`${userId}/`),
      );
      if (paths.length > 0) {
        await supabase.storage.from("verification-docs").remove(paths);
      }
    } catch (e) {
      console.error("[removeMyRepsCourse] storage cleanup failed", e);
    }

    return { mode: "deleted" as const };
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
    z.object({ status: z.enum(["submitted", "approved", "rejected", "changes_requested", "withdrawn"]).default("submitted") }).parse(d ?? {}),
  )
  .handler(async ({ data, context }) => {
    await requireAdmin(context.realUserId ?? context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: rows, error } = await supabaseAdmin
      .from("provider_regulated_permissions")
      .select(
        "id, provider_id, ofqual_number, ofqual_snapshot, ofqual_found, reps_qualification_number, submission_group_id, qualification_id, evidence_type, evidence_doc_paths, awarding_body_reference, ai_extraction, ai_verdict, ai_red_flags, ai_cross_check, status, admin_note, evidence_issued_at, evidence_expires_at, created_at, reviewed_at, withdrawn_at, withdrawn_reason, qualification:qualification_id (id, title, level, awarding_body_slug, ofqual_ref), provider:provider_id (id, slug, legal_entity_name, identity_verified_name, contact_email)",
      )
      .eq("status", data.status)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return await hydrateProviderNames(rows ?? [], supabaseAdmin);
  });

export const adminListRepsCourseQueue = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        status: z
          .enum(["submitted", "ai_drafted", "changes_requested", "approved", "rejected", "withdrawn"])
          .default("submitted"),
      })
      .parse(d ?? {}),
  )
  .handler(async ({ data, context }) => {
    await requireAdmin(context.realUserId ?? context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: rows, error } = await supabaseAdmin
      .from("reps_courses")
      .select(
        "id, provider_id, proposed_title, syllabus_doc_path, assessment_criteria_doc_path, tutor_cv_doc_path, ai_draft, ai_verdict, ai_red_flags, ai_drafted_at, official_title, official_level, reps_qual_number, spec_who_for, spec_learning_outcomes, spec_how_youll_study, spec_how_youre_assessed, spec_prerequisites, spec_guided_learning_hours, spec_total_qualification_time, spec_delivery_mode, spec_published_at, status, accredited_at, admin_note, created_at, provider:provider_id (id, slug, legal_entity_name, identity_verified_name, contact_email)",
      )
      .eq("status", data.status)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return await hydrateProviderNames(rows ?? [], supabaseAdmin);
  });

async function hydrateProviderNames<
  T extends {
    provider?:
      | { id?: string | null; legal_entity_name?: string | null; identity_verified_name?: string | null }
      | null;
  },
>(rows: T[], supabaseAdmin: any): Promise<T[]> {
  const ids = Array.from(
    new Set(rows.map((r) => r.provider?.id).filter((id): id is string => Boolean(id))),
  );
  if (ids.length === 0) return rows;
  const { data: profs } = await supabaseAdmin
    .from("profiles")
    .select("id, full_name")
    .in("id", ids);
  const nameById = new Map<string, string>();
  for (const p of (profs as Array<{ id: string; full_name: string | null }> | null) ?? []) {
    const n = p.full_name?.trim();
    if (n) nameById.set(p.id, n);
  }
  return rows.map((r) => {
    if (!r.provider?.id) return r;
    const n = nameById.get(r.provider.id);
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
    await requireAdmin(context.realUserId ?? context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    if (data.decision !== "approved" && !data.admin_note?.trim()) {
      throw new Error("Admin note required when rejecting or requesting changes");
    }
    const { error } = await supabaseAdmin
      .from("provider_regulated_permissions")
      .update({
        status: data.decision,
        admin_note: data.admin_note?.trim() || null,
        reviewed_by: context.realUserId ?? context.userId,
        reviewed_at: new Date().toISOString(),
      } as never)
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// Admin edits the spec fields (typically after AI drafting, before approval).
const specInput = z.object({
  id: z.string().uuid(),
  official_title: z.string().min(3).max(200).nullable(),
  official_level: z.number().int().min(1).max(7).nullable(),
  spec_who_for: z.string().max(2000).nullable(),
  spec_learning_outcomes: z.array(z.string().min(1).max(500)).max(30).nullable(),
  spec_how_youll_study: z.string().max(2000).nullable(),
  spec_how_youre_assessed: z.string().max(2000).nullable(),
  spec_prerequisites: z.string().max(1000).nullable(),
  spec_guided_learning_hours: z.number().min(0).max(1000).nullable(),
  spec_total_qualification_time: z.number().min(0).max(2000).nullable(),
  spec_delivery_mode: z.enum(["in_person", "online", "blended"]).nullable(),
});

export const adminSaveRepsCourseSpec = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => specInput.parse(d))
  .handler(async ({ data, context }) => {
    await requireAdmin(context.realUserId ?? context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("reps_courses")
      .update({
        official_title: data.official_title,
        official_level: data.official_level,
        spec_who_for: data.spec_who_for,
        spec_learning_outcomes: data.spec_learning_outcomes as never,
        spec_how_youll_study: data.spec_how_youll_study,
        spec_how_youre_assessed: data.spec_how_youre_assessed,
        spec_prerequisites: data.spec_prerequisites,
        spec_guided_learning_hours: data.spec_guided_learning_hours,
        spec_total_qualification_time: data.spec_total_qualification_time,
        spec_delivery_mode: data.spec_delivery_mode,
      } as never)
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const adminDecideRepsCourse = createServerFn({ method: "POST" })
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
    await requireAdmin(context.realUserId ?? context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    if (data.decision !== "approved" && !data.admin_note?.trim()) {
      throw new Error("Admin note required when rejecting or requesting changes");
    }
    const { error } = await supabaseAdmin
      .from("reps_courses")
      .update({
        status: data.decision,
        admin_note: data.admin_note?.trim() || null,
        reviewed_by: context.realUserId ?? context.userId,
        reviewed_at: new Date().toISOString(),
      } as never)
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// Redraft with AI (admin can rerun after provider re-uploads better docs).
export const adminRedraftRepsCourse = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await requireAdmin(context.realUserId ?? context.userId);
    await runRepsCourseAiDraft(data.id, { overwrite: true });
    return { ok: true };
  });

// ─────────────────────────────────────────────────────────────────────────────
// Doc access (signed URLs)

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
// Public — approved rows for /t/$slug

export type PublicProviderRegulatedRow = {
  id: string;
  ofqual_number: string | null;
  ofqual_snapshot: OfqualSnapshot;
  reps_qualification_number: string | null;
  spec_who_for: string | null;
  spec_learning_outcomes: string[] | null;
  spec_how_youll_study: string | null;
  spec_how_youre_assessed: string | null;
  spec_prerequisites: string | null;
  spec_guided_learning_hours: number | null;
  spec_total_qualification_time: number | null;
  qualification: {
    id: string;
    title: string;
    level: number | null;
    awarding_body_slug: string;
    ofqual_ref: string | null;
  } | null;
};

export type PublicProviderRepsCourseRow = {
  id: string;
  official_title: string | null;
  official_level: number | null;
  reps_qual_number: string | null;
  spec_who_for: string | null;
  spec_learning_outcomes: string[] | null;
  spec_how_youll_study: string | null;
  spec_how_youre_assessed: string | null;
  spec_prerequisites: string | null;
  spec_guided_learning_hours: number | null;
  spec_total_qualification_time: number | null;
  spec_delivery_mode: "in_person" | "online" | "blended" | null;
  accredited_at: string | null;
};

export const listPublicProviderQualifications = createServerFn({ method: "GET" })
  .inputValidator((d: unknown) => z.object({ providerId: z.string().uuid() }).parse(d))
  .handler(async ({ data }): Promise<{
    regulated: PublicProviderRegulatedRow[];
    courses: PublicProviderRepsCourseRow[];
    reps_member_id: string | null;
  }> => {
    const { createClient } = await import("@supabase/supabase-js");
    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_PUBLISHABLE_KEY!,
      { auth: { storage: undefined, persistSession: false, autoRefreshToken: false } },
    );

    const [reg, courses, pro] = await Promise.all([
      supabase
        .from("provider_regulated_permissions")
        .select(
          "id, ofqual_number, ofqual_snapshot, reps_qualification_number, spec_who_for, spec_learning_outcomes, spec_how_youll_study, spec_how_youre_assessed, spec_prerequisites, spec_guided_learning_hours, spec_total_qualification_time, qualification:qualification_id (id, title, level, awarding_body_slug, ofqual_ref)",
        )
        .eq("provider_id", data.providerId)
        .eq("status", "approved"),
      supabase
        .from("reps_courses")
        .select(
          "id, official_title, official_level, reps_qual_number, spec_who_for, spec_learning_outcomes, spec_how_youll_study, spec_how_youre_assessed, spec_prerequisites, spec_guided_learning_hours, spec_total_qualification_time, spec_delivery_mode, accredited_at",
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
      courses: ((courses.data ?? []) as unknown) as PublicProviderRepsCourseRow[],
      reps_member_id:
        (pro.data as { reps_member_id?: string | null } | null)?.reps_member_id ?? null,
    };
  });

// ─────────────────────────────────────────────────────────────────────────────
// AI drafting

const REGULATED_SYSTEM = `You are an evidence reviewer for REPS, a professional register for fitness training providers. You inspect one PDF/image of provider evidence — an EQA report, centre approval certificate, or approval letter — and extract structured fields. Return ONLY valid JSON. Do not fabricate. If a field is not visible in the document, return null (or an empty array). Do not guess.

Fields:
- document_type: "eqa_report" | "centre_certificate" | "approval_letter" | "other"
- awarding_body_detected: canonical awarding body name if visible
- centre_name_detected: the approved centre name as it appears on the document
- centre_number_detected: the awarding body's centre number for that provider, if quoted
- approval_status: "approved" | "suspended" | "withdrawn" | "unclear"
- qualifications_listed: array of {title, ofqual_ref_if_visible}
- issue_date: YYYY-MM-DD if visible
- expiry_date: YYYY-MM-DD if visible
- eqa_name: External Quality Assurer's name if visible
- signatory_name
- signatory_role
- confidence: 0..1 overall
- red_flags: array of short strings`;

const REPS_COURSE_SYSTEM = `You are the accreditation reviewer for REPS, a global register of exercise professionals. A provider has submitted a course for REPS accreditation, with three PDFs (in order): syllabus, assessment criteria, tutor CV. You must draft the same fields Ofqual publishes for a regulated qualification — REPS is the awarding body here, and the admin will edit and publish your draft as the public specification.

Only use facts present in the supplied documents. Never invent hours, learning outcomes, tutor credentials, or content. British English. No exclamation marks, no marketing jargon.

Return ONLY valid JSON with this exact shape:
{
  "official_title": string,                       // Clean, formal title. Prefer sentence case with proper nouns. e.g. "REPS Level 3 Kettlebell Coach". If the provider's working title is fine, keep it.
  "official_level": number,                       // 1 to 7. Match learning depth: Lvl 2 = supporting, Lvl 3 = independent instructor, Lvl 4 = specialist/exercise referral, Lvl 5 = advanced specialist, Lvl 6 = degree-equivalent, Lvl 7 = postgraduate-equivalent.
  "spec_who_for": string,                          // "This course is for..." — 2-4 sentences.
  "spec_learning_outcomes": string[],              // 5-10 statements starting "On completion, learners will..." — one outcome per string.
  "spec_how_youll_study": string,                  // Narrative combining hours, delivery mode, and structure. 2-4 sentences.
  "spec_how_youre_assessed": string,               // Assessment methods and pass criteria, from the assessment doc. 2-4 sentences.
  "spec_prerequisites": string,                    // What learners must hold or be able to do beforehand. Empty string if none.
  "spec_guided_learning_hours": number,            // GLH — tutor-led hours only. 0 if not stated.
  "spec_total_qualification_time": number,         // TQT — all learner time including self-study. 0 if not stated.
  "spec_delivery_mode": "in_person" | "online" | "blended",
  "verdict": "recommend_approve" | "flagged" | "inconclusive",
  "red_flags": string[],                           // Concerns the admin must resolve before approving.
  "reviewer_notes": string                         // 1-3 sentences summarising what you found and any concerns.
}

Length rules (enforce yourself — the schema does NOT):
- Each learning outcome ≤ 200 chars.
- Long-text fields ≤ 1500 chars.
- If a document is thin/missing/unreadable, set verdict = "inconclusive" and list the gap in red_flags.`;

async function callGemini(
  system: string,
  parts: Array<{ text?: string } | { image_url: { url: string } }>,
): Promise<{ raw: Record<string, unknown>; text: string } | null> {
  const key = process.env.LOVABLE_API_KEY;
  if (!key) return null;
  const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
    body: JSON.stringify({
      model: "google/gemini-3-flash-preview",
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
  const content = json.choices?.[0]?.message?.content ?? "";
  try {
    return { raw: JSON.parse(content) as Record<string, unknown>, text: content };
  } catch {
    return null;
  }
}

async function signedUrlFor(path: string): Promise<string | null> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await supabaseAdmin.storage
    .from("verification-docs")
    .createSignedUrl(path, 60 * 10);
  if (error || !data) return null;
  return data.signedUrl;
}

// Clamp helpers — AI is prompted with limits but we still enforce in code.
const clampStr = (v: unknown, max: number): string | null => {
  if (typeof v !== "string") return null;
  const s = v.trim();
  return s ? s.slice(0, max) : null;
};
const clampNum = (v: unknown, min: number, max: number): number | null => {
  const n = typeof v === "number" ? v : typeof v === "string" ? Number(v) : NaN;
  if (!Number.isFinite(n)) return null;
  return Math.max(min, Math.min(max, n));
};
const clampInt = (v: unknown, min: number, max: number): number | null => {
  const n = clampNum(v, min, max);
  return n == null ? null : Math.round(n);
};
const clampStrArr = (v: unknown, maxItems: number, maxLen: number): string[] | null => {
  if (!Array.isArray(v)) return null;
  const out = v
    .map((x) => clampStr(x, maxLen))
    .filter((x): x is string => Boolean(x))
    .slice(0, maxItems);
  return out.length ? out : null;
};

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

  const raw = result.raw as {
    awarding_body_detected?: string | null;
    qualifications_listed?: Array<{ title?: string | null; ofqual_ref_if_visible?: string | null }> | null;
    confidence?: number | null;
    red_flags?: string[] | null;
  };
  const norm = (s: string | null | undefined) =>
    (s ?? "").toLowerCase().replace(/[^a-z0-9]+/g, "").trim();

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

  const redFlags = Array.isArray(raw.red_flags) ? (raw.red_flags as string[]) : [];
  const confidence = typeof raw.confidence === "number" ? raw.confidence : 0.5;
  const verdict: "recommend_approve" | "flagged" | "inconclusive" =
    redFlags.length > 0 || confidence < 0.6
      ? "flagged"
      : confidence >= 0.85
        ? "recommend_approve"
        : "inconclusive";

  await supabaseAdmin
    .from("provider_regulated_permissions")
    .update({
      ai_extraction: result.raw as never,
      ai_verdict: verdict as never,
      ai_red_flags: redFlags as never,
      ai_cross_check: {
        ofqual_found: r.ofqual_found,
        awarding_body_match: awardingBodyMatch,
        qualification_in_doc: qualificationInDoc,
      } as never,
    })
    .eq("id", id);
}

async function runRepsCourseAiDraft(
  id: string,
  options: { overwrite?: boolean } = {},
): Promise<void> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data: row, error } = await supabaseAdmin
    .from("reps_courses")
    .select(
      "id, proposed_title, syllabus_doc_path, assessment_criteria_doc_path, tutor_cv_doc_path, status",
    )
    .eq("id", id)
    .single();
  if (error || !row) return;
  const r = row as {
    id: string;
    proposed_title: string;
    syllabus_doc_path: string;
    assessment_criteria_doc_path: string;
    tutor_cv_doc_path: string;
    status: string;
  };

  const urls: string[] = [];
  for (const p of [r.syllabus_doc_path, r.assessment_criteria_doc_path, r.tutor_cv_doc_path]) {
    const u = await signedUrlFor(p);
    if (u) urls.push(u);
  }
  if (urls.length < 3) return;

  const claim = `Provider's working title: "${r.proposed_title}". Files (in order): syllabus, assessment criteria, tutor CV. Draft the full public specification per the schema.`;
  const parts: Array<{ text?: string } | { image_url: { url: string } }> = [{ text: claim }];
  for (const url of urls) parts.push({ image_url: { url } });

  const result = await callGemini(REPS_COURSE_SYSTEM, parts);
  if (!result) {
    await supabaseAdmin
      .from("reps_courses")
      .update({
        ai_verdict: "inconclusive",
        ai_red_flags: ["AI drafting failed — retry from admin"],
        status: r.status === "submitted" ? "ai_drafted" : r.status,
      } as never)
      .eq("id", id);
    return;
  }

  const raw = result.raw as Record<string, unknown>;
  const verdictRaw = typeof raw.verdict === "string" ? raw.verdict : "inconclusive";
  const verdict =
    verdictRaw === "recommend_approve" || verdictRaw === "flagged" || verdictRaw === "inconclusive"
      ? verdictRaw
      : "inconclusive";
  const redFlags = clampStrArr(raw.red_flags, 20, 200) ?? [];

  const deliveryRaw = typeof raw.spec_delivery_mode === "string" ? raw.spec_delivery_mode : null;
  const deliveryMode: "in_person" | "online" | "blended" | null =
    deliveryRaw === "in_person" || deliveryRaw === "online" || deliveryRaw === "blended"
      ? deliveryRaw
      : null;

  // Only overwrite the official/spec fields when the row is a fresh draft or
  // admin explicitly requested a redraft. Never clobber admin edits.
  const shouldFillOfficial = options.overwrite || r.status === "submitted";

  const update: Record<string, unknown> = {
    ai_draft: raw as never,
    ai_verdict: verdict,
    ai_red_flags: redFlags,
    ai_drafted_at: new Date().toISOString(),
  };
  if (shouldFillOfficial) {
    update.official_title = clampStr(raw.official_title, 200) ?? r.proposed_title.slice(0, 200);
    update.official_level = clampInt(raw.official_level, 1, 7);
    update.spec_who_for = clampStr(raw.spec_who_for, 2000);
    update.spec_learning_outcomes = clampStrArr(raw.spec_learning_outcomes, 30, 500);
    update.spec_how_youll_study = clampStr(raw.spec_how_youll_study, 2000);
    update.spec_how_youre_assessed = clampStr(raw.spec_how_youre_assessed, 2000);
    update.spec_prerequisites = clampStr(raw.spec_prerequisites, 1000);
    update.spec_guided_learning_hours = clampNum(raw.spec_guided_learning_hours, 0, 1000);
    update.spec_total_qualification_time = clampNum(raw.spec_total_qualification_time, 0, 2000);
    update.spec_delivery_mode = deliveryMode;
  }
  if (r.status === "submitted") {
    update.status = "ai_drafted";
  }

  await supabaseAdmin.from("reps_courses").update(update as never).eq("id", id);
}
