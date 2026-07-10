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

export type RepsCourseDeliveryMode =
  | "in_person"
  | "online_live"
  | "online_self_paced"
  | "blended";

export type RepsCourseModule = {
  title: string;
  summary: string;
  hours?: number | null;
};

export type RepsCourseEvidenceKind =
  | "specification"
  | "sample_materials"
  | "assessment"
  | "tutor_cv"
  | "other";

export type RepsCourseEvidenceRow = {
  id: string;
  course_id: string;
  provider_id: string;
  file_kind: RepsCourseEvidenceKind;
  file_path: string;
  file_name: string;
  file_size_bytes: number | null;
  mime_type: string | null;
  created_at: string;
};

/** A REPS-endorsed course, as seen by the provider dashboard. */
export type RepsCourseRow = {
  id: string;
  provider_id: string;
  proposed_title: string;
  proposed_level: number | null;
  proposed_credential_type: "award" | "certificate" | "diploma" | "course" | "not_sure" | null;
  proposed_who_for: string | null;
  proposed_what_covered: string | null;
  proposed_learner_outcomes: string | null;
  proposed_delivery_mode: RepsCourseDeliveryMode | null;
  proposed_total_hours: number | null;
  proposed_how_assessed: string | null;
  proposed_prerequisites: string | null;
  proposed_tutor_credentials: string | null;
  proposed_extra_notes: string | null;
  spec_modules: RepsCourseModule[] | null;
  ai_verdict: "recommend_approve" | "flagged" | "inconclusive" | null;
  ai_red_flags: string[];
  ai_drafted_at: string | null;
  official_title: string | null;
  official_level: number | null;
  official_level_rationale: string | null;
  official_level_confidence: "high" | "medium" | "low" | null;
  reviewer_notes: string | null;
  ai_deterministic_flags: string[];
  reps_qual_number: string | null;
  spec_who_for: string | null;
  spec_learning_outcomes: string[] | null;
  spec_how_youll_study: string | null;
  spec_how_youre_assessed: string | null;
  spec_prerequisites: string | null;
  spec_guided_learning_hours: number | null;
  spec_total_qualification_time: number | null;
  spec_delivery_mode: RepsCourseDeliveryMode | "online" | null;
  spec_published_at: string | null;
  status: RepsCourseStatus;
  accredited_at: string | null;
  admin_note: string | null;
  created_at: string;
  endorsement_statement_url: string | null;
  endorsement_statement_agreed: boolean;
  endorsement_statement_last_checked_at: string | null;
  endorsement_statement_found: boolean | null;
  endorsement_statement_check_error: string | null;
};

/**
 * The verbatim statement providers must display on the page that lists the
 * endorsed course. Admin verifies it is present before endorsing.
 */
export const REPS_ENDORSEMENT_STATEMENT =
  "This course has been endorsed by the REPs for its high-quality, non-regulated provision and training programmes. This course is not regulated by Ofqual and is not an accredited qualification. We will be able to advise you on any further recognition, for example progression routes into further and/or higher education. For further information please visit the Learner FAQs on the REPs website.";

/**
 * Two signature phrases we look for in the provider's fetched HTML. Requiring
 * both keeps the check robust to minor punctuation/wording tweaks without
 * accepting an unrelated page.
 */
const REPS_ENDORSEMENT_SIGNATURES = [
  "endorsed by the reps",
  "not regulated by ofqual",
] as const;

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

const DELIVERY_MODES = ["in_person", "online_live", "online_self_paced", "blended"] as const;

const REQUIRED_EVIDENCE_KINDS = [
  "specification",
  "sample_materials",
  "assessment",
  "tutor_cv",
] as const;

const moduleSchema = z.object({
  title: z.string().min(2).max(200),
  summary: z.string().min(2).max(500),
  hours: z.number().min(0).max(500).nullable().optional(),
});

const submitRepsCourseInput = z.object({
  proposed_title: z.string().min(3).max(200),
  proposed_level: z.number().int().min(1).max(7).nullable().optional(),
  proposed_credential_type: z
    .enum(["award", "certificate", "diploma", "course", "not_sure"])
    .nullable()
    .optional(),
  proposed_who_for: z.string().min(10).max(4000),
  proposed_learner_outcomes: z.string().min(10).max(4000),
  proposed_delivery_mode: z.enum(DELIVERY_MODES),
  proposed_total_hours: z.number().min(0.5).max(2000),
  proposed_how_assessed: z.string().min(5).max(4000),
  proposed_prerequisites: z.string().max(2000).nullable().optional(),
  proposed_tutor_credentials: z.string().min(10).max(4000),
  proposed_extra_notes: z.string().max(4000).nullable().optional(),
  spec_modules: z.array(moduleSchema).min(1).max(60),
  evidence_ids: z.array(z.string().uuid()).min(4).max(40),
  endorsement_statement_url: z
    .string()
    .trim()
    .url("Enter a full URL including https://")
    .max(500),
  endorsement_statement_agreed: z.literal(true, {
    message: "You must agree to display the REPS endorsement statement.",
  }),
});

export const submitRepsCourse = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => submitRepsCourseInput.parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    await assertProviderHasTradingName(supabase, userId);

    await supabase.from("professionals").upsert({ id: userId } as never, { onConflict: "id" });

    // Verify evidence rows: all owned by user, not yet attached to a course,
    // and cover every required kind.
    const { data: evidence, error: evErr } = await supabase
      .from("reps_course_evidence")
      .select("id, file_kind, course_id, provider_id")
      .in("id", data.evidence_ids);
    if (evErr) throw new Error(evErr.message);
    const rows = (evidence ?? []) as Array<{
      id: string;
      file_kind: string;
      course_id: string | null;
      provider_id: string;
    }>;
    if (rows.length !== data.evidence_ids.length) {
      throw new Error("Some evidence files were not found");
    }
    for (const r of rows) {
      if (r.provider_id !== userId) throw new Error("Forbidden: evidence file does not belong to you");
    }
    const kinds = new Set(rows.map((r) => r.file_kind));
    for (const required of REQUIRED_EVIDENCE_KINDS) {
      if (!kinds.has(required)) {
        throw new Error(`Missing required evidence: ${required.replace("_", " ")}`);
      }
    }

    // Derive a course "what covered" summary from the module list so existing
    // downstream code that reads proposed_what_covered still works.
    const whatCovered = data.spec_modules
      .map((m, i) => `${i + 1}. ${m.title} — ${m.summary}${m.hours ? ` (${m.hours}h)` : ""}`)
      .join("\n");

    const { data: row, error } = await supabase
      .from("reps_courses")
      .insert({
        provider_id: userId,
        proposed_title: data.proposed_title.trim(),
        proposed_level: data.proposed_level ?? null,
        proposed_credential_type: data.proposed_credential_type ?? null,
        proposed_who_for: data.proposed_who_for.trim(),
        proposed_what_covered: whatCovered,
        proposed_learner_outcomes: data.proposed_learner_outcomes.trim(),
        proposed_delivery_mode: data.proposed_delivery_mode,
        proposed_total_hours: data.proposed_total_hours,
        proposed_how_assessed: data.proposed_how_assessed.trim(),
        proposed_prerequisites: data.proposed_prerequisites?.trim() || null,
        proposed_tutor_credentials: data.proposed_tutor_credentials.trim(),
        proposed_extra_notes: data.proposed_extra_notes?.trim() || null,
        spec_modules: data.spec_modules as never,
        endorsement_statement_url: data.endorsement_statement_url.trim(),
        endorsement_statement_agreed: true,
      } as never)
      .select("id")
      .single();
    if (error) throw new Error(error.message);

    const newCourseId = (row as { id: string }).id;

    // Attach evidence rows to the new course
    const { error: attachErr } = await supabase
      .from("reps_course_evidence")
      .update({ course_id: newCourseId } as never)
      .in("id", data.evidence_ids)
      .eq("provider_id", userId);
    if (attachErr) throw new Error(attachErr.message);

    return row;
  });

const REPS_COURSE_SELECT =
  "id, provider_id, proposed_title, proposed_who_for, proposed_what_covered, proposed_learner_outcomes, proposed_delivery_mode, proposed_total_hours, proposed_how_assessed, proposed_prerequisites, proposed_tutor_credentials, proposed_extra_notes, spec_modules, ai_verdict, ai_red_flags, ai_drafted_at, official_title, official_level, official_level_rationale, official_level_confidence, reviewer_notes, ai_deterministic_flags, reps_qual_number, spec_who_for, spec_learning_outcomes, spec_how_youll_study, spec_how_youre_assessed, spec_prerequisites, spec_guided_learning_hours, spec_total_qualification_time, spec_delivery_mode, spec_published_at, status, accredited_at, admin_note, created_at, endorsement_statement_url, endorsement_statement_agreed, endorsement_statement_last_checked_at, endorsement_statement_found, endorsement_statement_check_error";

export const listMyRepsCourses = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data, error } = await supabase
      .from("reps_courses")
      .select(REPS_COURSE_SELECT)
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
      .select("id, provider_id, status")
      .eq("id", data.id)
      .maybeSingle();
    if (readErr) throw new Error(readErr.message);
    if (!row) throw new Error("Not found");
    const r = row as { id: string; provider_id: string; status: string };
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

    return { mode: "deleted" as const };
  });

// ─────────────────────────────────────────────────────────────────────────────
// Endorsement statement — automated presence check
//
// Providers must display a verbatim REPS endorsement statement on the course
// page they submit. This fn fetches that URL server-side, strips markup and
// looks for two signature phrases. Both must be present.
//
// Used in two places:
//   1. Provider modal — pre-flight "Check now" button (returns the result).
//   2. Admin review — same server fn, re-run on demand before endorsing.

type EndorsementCheckResult = {
  ok: boolean;
  found: boolean;
  fetched_status: number | null;
  error: string | null;
  checked_at: string;
};

async function fetchAndCheckStatement(url: string): Promise<EndorsementCheckResult> {
  const checked_at = new Date().toISOString();
  try {
    // Basic hardening: only allow http/https, block obvious localhost/private hosts.
    const parsed = new URL(url);
    if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
      return { ok: false, found: false, fetched_status: null, error: "URL must be http(s).", checked_at };
    }
    const host = parsed.hostname.toLowerCase();
    if (
      host === "localhost" ||
      host.endsWith(".localhost") ||
      host.startsWith("127.") ||
      host.startsWith("10.") ||
      host.startsWith("192.168.") ||
      host.startsWith("169.254.")
    ) {
      return { ok: false, found: false, fetched_status: null, error: "URL points to a private host.", checked_at };
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    const res = await fetch(parsed.toString(), {
      redirect: "follow",
      signal: controller.signal,
      headers: { "User-Agent": "REPS-EndorsementCheck/1.0 (+https://repsuk.org)" },
    }).finally(() => clearTimeout(timeout));

    if (!res.ok) {
      return { ok: false, found: false, fetched_status: res.status, error: `HTTP ${res.status}`, checked_at };
    }
    const raw = await res.text();
    // Strip tags + collapse whitespace + lowercase for lenient substring match.
    const text = raw
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .toLowerCase();
    const found = REPS_ENDORSEMENT_SIGNATURES.every((sig) => text.includes(sig));
    return { ok: true, found, fetched_status: res.status, error: null, checked_at };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Fetch failed";
    return { ok: false, found: false, fetched_status: null, error: msg, checked_at };
  }
}

/**
 * Pre-flight statement check called from the provider modal before submit.
 * Doesn't require a course row to exist yet — just returns the result.
 */
export const checkEndorsementStatement = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({ url: z.string().trim().url().max(500) }).parse(d),
  )
  .handler(async ({ data }) => {
    return await fetchAndCheckStatement(data.url);
  });

/**
 * Admin-side re-check on an existing course row. Persists the result to
 * `reps_courses.endorsement_statement_*`.
 */
export const adminRecheckEndorsementStatement = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ course_id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await requireAdmin(context.realUserId ?? context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: row, error: rErr } = await supabaseAdmin
      .from("reps_courses")
      .select("id, endorsement_statement_url")
      .eq("id", data.course_id)
      .maybeSingle();
    if (rErr) throw new Error(rErr.message);
    if (!row) throw new Error("Not found");
    const url = (row as { endorsement_statement_url: string | null }).endorsement_statement_url;
    if (!url) throw new Error("This course has no endorsement statement URL on record.");
    const result = await fetchAndCheckStatement(url);
    const { error: uErr } = await supabaseAdmin
      .from("reps_courses")
      .update({
        endorsement_statement_last_checked_at: result.checked_at,
        endorsement_statement_found: result.ok ? result.found : null,
        endorsement_statement_check_error: result.error,
      } as never)
      .eq("id", data.course_id);
    if (uErr) throw new Error(uErr.message);
    return result;
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
    // "submitted" is the admin's NEW bucket — includes rows the AI has already
    // drafted (ai_drafted) since both are pre-human-review.
    const statuses =
      data.status === "submitted" ? ["submitted", "ai_drafted"] : [data.status];
    const { data: rows, error } = await supabaseAdmin
      .from("reps_courses")
      .select(
        REPS_COURSE_SELECT + ", ai_draft, provider:provider_id (id, slug, legal_entity_name, identity_verified_name, contact_email)",
      )
      .in("status", statuses)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return (await hydrateProviderNames((rows ?? []) as never, supabaseAdmin)) as unknown as typeof rows;
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
  spec_delivery_mode: z.enum(["in_person", "online_live", "online_self_paced", "online", "blended"]).nullable(),
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
    const reviewerId = context.realUserId ?? context.userId;
    await requireAdmin(reviewerId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    if (data.decision !== "approved" && !data.admin_note?.trim()) {
      throw new Error("Admin note required when rejecting or requesting changes");
    }
    const decidedAt = new Date().toISOString();
    const { error } = await supabaseAdmin
      .from("reps_courses")
      .update({
        status: data.decision,
        admin_note: data.admin_note?.trim() || null,
        reviewed_by: reviewerId,
        reviewed_at: decidedAt,
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
// Evidence uploads (provider) — Core 4 supporting documents

const EVIDENCE_KINDS = [
  "specification",
  "sample_materials",
  "assessment",
  "tutor_cv",
  "other",
] as const;

const evidenceUploadInput = z.object({
  file_kind: z.enum(EVIDENCE_KINDS),
  file_data_url: z.string().startsWith("data:").max(35_000_000),
  filename: z.string().min(1).max(200),
  mime_type: z.string().max(200).optional().nullable(),
  course_id: z.string().uuid().optional().nullable(),
});

export const uploadRepsCourseEvidence = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => evidenceUploadInput.parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    const match = data.file_data_url.match(/^data:([^;]+);base64,(.+)$/);
    if (!match) throw new Error("Invalid file payload");
    const [, mime, b64] = match;
    const bytes = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
    const hashBuf = await crypto.subtle.digest("SHA-256", bytes);
    const sha256 = Array.from(new Uint8Array(hashBuf), (b) => b.toString(16).padStart(2, "0")).join("");
    const ext = data.filename.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "") || "bin";
    const path = `${userId}/${Date.now()}-${sha256.slice(0, 8)}.${ext}`;

    const { error: upErr } = await supabase.storage
      .from("course-accreditations")
      .upload(path, bytes, { contentType: mime, upsert: false });
    if (upErr) throw new Error(upErr.message);

    // If a course_id is provided, verify ownership. Otherwise the evidence is
    // pending — will be attached to the row that submitRepsCourse creates.
    if (data.course_id) {
      const { data: course } = await supabase
        .from("reps_courses")
        .select("id, provider_id")
        .eq("id", data.course_id)
        .maybeSingle();
      if (!course || (course as { provider_id: string }).provider_id !== userId) {
        throw new Error("Forbidden: course does not belong to you");
      }
    }

    const { data: row, error } = await supabase
      .from("reps_course_evidence")
      .insert({
        course_id: data.course_id ?? null,
        provider_id: userId,
        file_kind: data.file_kind,
        file_path: path,
        file_name: data.filename.slice(0, 200),
        file_size_bytes: bytes.length,
        mime_type: data.mime_type ?? mime,
        uploaded_by: userId,
      } as never)
      .select("id, course_id, provider_id, file_kind, file_path, file_name, file_size_bytes, mime_type, created_at")
      .single();
    if (error) throw new Error(error.message);

    return row as unknown as RepsCourseEvidenceRow;
  });

export const removeRepsCourseEvidence = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: row, error: readErr } = await supabase
      .from("reps_course_evidence")
      .select("id, provider_id, file_path, course_id")
      .eq("id", data.id)
      .maybeSingle();
    if (readErr) throw new Error(readErr.message);
    if (!row) return { ok: true };
    const r = row as { id: string; provider_id: string; file_path: string; course_id: string | null };
    if (r.provider_id !== userId) throw new Error("Forbidden");

    // Once attached to a course that is not still in draft, admins own it.
    if (r.course_id) {
      const { data: course } = await supabase
        .from("reps_courses")
        .select("status")
        .eq("id", r.course_id)
        .maybeSingle();
      const status = (course as { status?: string } | null)?.status;
      if (status && status !== "submitted" && status !== "changes_requested") {
        throw new Error("Cannot remove evidence after the course has been reviewed");
      }
    }

    const { error } = await supabase
      .from("reps_course_evidence")
      .delete()
      .eq("id", r.id)
      .eq("provider_id", userId);
    if (error) throw new Error(error.message);

    try {
      if (r.file_path.startsWith(`${userId}/`)) {
        await supabase.storage.from("course-accreditations").remove([r.file_path]);
      }
    } catch (e) {
      console.error("[removeRepsCourseEvidence] storage cleanup failed", e);
    }
    return { ok: true };
  });

export const listRepsCourseEvidence = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ course_id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    // Ownership check: either the course belongs to the caller, or they are admin.
    const { data: course } = await supabase
      .from("reps_courses")
      .select("id, provider_id")
      .eq("id", data.course_id)
      .maybeSingle();
    if (!course) return [] as RepsCourseEvidenceRow[];
    const isOwner = (course as { provider_id: string }).provider_id === userId;
    if (!isOwner) {
      const { data: isAdmin } = await supabase.rpc("has_role", { _user_id: userId, _role: "admin" });
      if (!isAdmin) throw new Error("Forbidden");
    }
    const { data: rows, error } = await supabase
      .from("reps_course_evidence")
      .select("id, course_id, provider_id, file_kind, file_path, file_name, file_size_bytes, mime_type, created_at")
      .eq("course_id", data.course_id)
      .order("created_at", { ascending: true });
    if (error) throw new Error(error.message);
    return (rows ?? []) as unknown as RepsCourseEvidenceRow[];
  });

export const getRepsCourseEvidenceSignedUrl = createServerFn({ method: "POST" })
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
      .from("course-accreditations")
      .createSignedUrl(data.path, 60 * 15);
    if (error || !signed) throw new Error(error?.message ?? "Sign failed");
    return { url: signed.signedUrl };
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

const REPS_COURSE_SYSTEM = `You are the accreditation reviewer for REPS, a global register of exercise professionals. A provider has filled in a structured 10-field form describing a course they want REPS to accredit. You must draft the same fields Ofqual publishes for a regulated qualification — REPS is the awarding body here, and the admin will edit and publish your draft as the public specification.

Only use facts present in the provider's answers. Never invent hours, learning outcomes, tutor credentials, or content. British English. No exclamation marks, no marketing jargon.

LEVEL RUBRIC — apply this deterministic checklist to choose official_level.
Work through each checkpoint in order; the highest level for which ALL checkpoints hold wins.

  Level 2 — Supporting / assistant roles:
    (a) No formal prerequisites required.
    (b) Outcomes use "remember / describe / demonstrate under supervision" verbs.
    (c) TQT typically < 40 hours.

  Level 3 — Independent instructor (baseline PT, group ex):
    (a) Prerequisites: 16+ or Level 2 baseline in an adjacent area.
    (b) Outcomes use "apply / plan / deliver" verbs; independent delivery is expected.
    (c) TQT typically 40–200 hours.
    (d) Tutor holds Level 3 or higher and 1+ years teaching.

  Level 4 — Specialist (exercise referral, adv strength & conditioning):
    (a) Prerequisites: Level 3 baseline in the same domain.
    (b) Outcomes use "analyse / adapt / evaluate case / prescribe" verbs.
    (c) TQT typically 60–400 hours.
    (d) Tutor holds Level 4 or higher with a clinical/specialist background.

  Level 5 — Advanced specialist / lead:
    (a) Prerequisites: Level 4 or degree in a related field.
    (b) Outcomes use "critically evaluate / design programmes / lead teams" verbs.
    (c) TQT typically 150+ hours.

  Level 6 — Degree-equivalent.
  Level 7 — Postgraduate-equivalent.

If the provider's answers do not clearly satisfy every checkpoint at a level, pick the highest level whose checkpoints ARE satisfied and set official_level_confidence = "medium" or "low". Never round up "because the provider called it advanced".

Return ONLY valid JSON with this exact shape:
{
  "official_title": string,                       // Clean, formal title. Prefer sentence case with proper nouns. e.g. "REPS Level 3 Kettlebell Coach". If the provider's working title is fine, keep it.
  "official_level": number,                       // 1 to 7, chosen by applying the rubric above.
  "official_level_rationale": string,             // 1-2 sentences explaining which rubric checkpoints you matched. Reference prerequisites, verb depth, hours band, tutor credential floor. Do NOT be generic.
  "official_level_confidence": "high" | "medium" | "low",  // high = all rubric checkpoints clearly satisfied; medium = one gap; low = two or more gaps or contradictions.
  "spec_who_for": string,                          // "This course is for..." — 2-4 sentences.
  "spec_learning_outcomes": string[],              // 5-10 statements starting "On completion, learners will..." — one outcome per string. Use Bloom's verbs (demonstrate, apply, evaluate, design, coach, assess).
  "spec_how_youll_study": string,                  // Narrative combining hours, delivery mode, and structure. 2-4 sentences.
  "spec_how_youre_assessed": string,               // Assessment methods and pass criteria. 2-4 sentences.
  "spec_prerequisites": string,                    // What learners must hold or be able to do beforehand. Empty string if none.
  "spec_guided_learning_hours": number,            // GLH — tutor-led hours only. Estimate from the total learning hours the provider gave; typically 40-70% for in-person, lower for self-paced.
  "spec_total_qualification_time": number,         // TQT — all learner time including self-study. Use the provider's total learning hours if provided.
  "spec_delivery_mode": "in_person" | "online_live" | "online_self_paced" | "blended",
  "verdict": "recommend_approve" | "flagged" | "inconclusive",
  "red_flags": string[],                           // Concerns the admin must resolve before approving.
  "reviewer_notes": string                         // 1-3 sentences summarising what you found and any concerns.
}

Length rules (enforce yourself — the schema does NOT):
- Each learning outcome ≤ 200 chars.
- Long-text fields ≤ 1500 chars.
- level_rationale ≤ 500 chars.
- If the provider's answers are thin, contradictory, or leave gaps you cannot fill honestly, set verdict = "inconclusive" and list the gap in red_flags.`;

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
      "id, proposed_title, proposed_who_for, proposed_what_covered, proposed_learner_outcomes, proposed_delivery_mode, proposed_total_hours, proposed_how_assessed, proposed_prerequisites, proposed_tutor_credentials, proposed_extra_notes, status",
    )
    .eq("id", id)
    .single();
  if (error || !row) return;
  const r = row as {
    id: string;
    proposed_title: string;
    proposed_who_for: string | null;
    proposed_what_covered: string | null;
    proposed_learner_outcomes: string | null;
    proposed_delivery_mode: string | null;
    proposed_total_hours: number | null;
    proposed_how_assessed: string | null;
    proposed_prerequisites: string | null;
    proposed_tutor_credentials: string | null;
    proposed_extra_notes: string | null;
    status: string;
  };

  const claim = [
    `Working title: "${r.proposed_title}"`,
    r.proposed_who_for ? `Who this course is for:\n${r.proposed_who_for}` : null,
    r.proposed_what_covered ? `What the course covers:\n${r.proposed_what_covered}` : null,
    r.proposed_learner_outcomes
      ? `What learners will be able to do afterwards:\n${r.proposed_learner_outcomes}`
      : null,
    r.proposed_delivery_mode ? `Delivery mode: ${r.proposed_delivery_mode}` : null,
    r.proposed_total_hours != null ? `Total learning hours (provider estimate): ${r.proposed_total_hours}` : null,
    r.proposed_how_assessed ? `How learners are assessed:\n${r.proposed_how_assessed}` : null,
    r.proposed_prerequisites ? `Prerequisites:\n${r.proposed_prerequisites}` : null,
    r.proposed_tutor_credentials ? `Tutor name & credentials:\n${r.proposed_tutor_credentials}` : null,
    r.proposed_extra_notes ? `Additional notes from the provider:\n${r.proposed_extra_notes}` : null,
    "",
    "Draft the full public specification per the schema. Split the provider's total learning hours into guided learning hours (tutor-led) and total qualification time (all learner time). Rewrite the provider's rough outcomes as formal learning outcomes using Bloom's verbs, starting with \"On completion, learners will…\".",
  ]
    .filter(Boolean)
    .join("\n\n");

  const result = await callGemini(REPS_COURSE_SYSTEM, [{ text: claim }]);
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
  const deliveryMode: RepsCourseDeliveryMode | "online" | null =
    deliveryRaw === "in_person" ||
    deliveryRaw === "online_live" ||
    deliveryRaw === "online_self_paced" ||
    deliveryRaw === "online" ||
    deliveryRaw === "blended"
      ? (deliveryRaw as RepsCourseDeliveryMode | "online")
      : null;

  const confidenceRaw =
    typeof raw.official_level_confidence === "string"
      ? raw.official_level_confidence.toLowerCase()
      : null;
  const confidence: "high" | "medium" | "low" | null =
    confidenceRaw === "high" || confidenceRaw === "medium" || confidenceRaw === "low"
      ? confidenceRaw
      : null;

  // Only overwrite the official/spec fields when the row is a fresh draft or
  // admin explicitly requested a redraft. Never clobber admin edits.
  const shouldFillOfficial = options.overwrite || r.status === "submitted";

  const officialLevel = clampInt(raw.official_level, 1, 7);
  const glh = clampNum(raw.spec_guided_learning_hours, 0, 1000);
  const tqt = clampNum(raw.spec_total_qualification_time, 0, 2000);
  const specPrereq = clampStr(raw.spec_prerequisites, 1000);

  // Deterministic flag computer runs alongside the LLM — catches logical
  // inconsistencies the model may miss.
  const deterministicFlags = computeDeterministicFlags({
    proposed_prerequisites: r.proposed_prerequisites,
    proposed_how_assessed: r.proposed_how_assessed,
    proposed_tutor_credentials: r.proposed_tutor_credentials,
    spec_prerequisites: specPrereq,
    spec_guided_learning_hours: glh,
    spec_total_qualification_time: tqt,
    spec_delivery_mode: deliveryMode,
    official_level: officialLevel,
  });

  const update: Record<string, unknown> = {
    ai_draft: raw as never,
    ai_verdict: verdict,
    ai_red_flags: redFlags,
    ai_drafted_at: new Date().toISOString(),
    ai_deterministic_flags: deterministicFlags as never,
    reviewer_notes: clampStr(raw.reviewer_notes, 1500),
  };
  if (shouldFillOfficial) {
    update.official_title = clampStr(raw.official_title, 200) ?? r.proposed_title.slice(0, 200);
    update.official_level = officialLevel;
    update.official_level_rationale = clampStr(raw.official_level_rationale, 500);
    update.official_level_confidence = confidence;
    update.spec_who_for = clampStr(raw.spec_who_for, 2000);
    update.spec_learning_outcomes = clampStrArr(raw.spec_learning_outcomes, 30, 500);
    update.spec_how_youll_study = clampStr(raw.spec_how_youll_study, 2000);
    update.spec_how_youre_assessed = clampStr(raw.spec_how_youre_assessed, 2000);
    update.spec_prerequisites = specPrereq;
    update.spec_guided_learning_hours = glh;
    update.spec_total_qualification_time = tqt;
    update.spec_delivery_mode = deliveryMode;
  }
  if (r.status === "submitted") {
    update.status = "ai_drafted";
  }

  await supabaseAdmin.from("reps_courses").update(update as never).eq("id", id);
}

// ─────────────────────────────────────────────────────────────────────────────
// Deterministic red-flag computer — cheap, reliable checks that catch logical
// inconsistencies the LLM might miss.

function computeDeterministicFlags(input: {
  proposed_prerequisites: string | null;
  proposed_how_assessed: string | null;
  proposed_tutor_credentials: string | null;
  spec_prerequisites: string | null;
  spec_guided_learning_hours: number | null;
  spec_total_qualification_time: number | null;
  spec_delivery_mode: RepsCourseDeliveryMode | "online" | null;
  official_level: number | null;
}): string[] {
  const flags: string[] = [];
  const prereq = (input.spec_prerequisites ?? input.proposed_prerequisites ?? "").trim().toLowerCase();
  const noPrereq = prereq === "" || prereq === "none" || prereq === "n/a" || prereq === "no" || prereq === "-";
  if (noPrereq && (input.official_level ?? 0) >= 4) {
    flags.push("Prerequisites declared as none, but level is 4 or above.");
  }
  if (
    input.spec_guided_learning_hours != null &&
    input.spec_total_qualification_time != null &&
    input.spec_guided_learning_hours > input.spec_total_qualification_time
  ) {
    flags.push("Guided learning hours exceed total qualification time.");
  }
  const assessed = (input.proposed_how_assessed ?? "").toLowerCase();
  if (
    (input.spec_delivery_mode === "online_self_paced") &&
    /(practical|observation|in[- ]person|face[- ]to[- ]face)/.test(assessed)
  ) {
    flags.push("Delivery is self-paced but assessment mentions in-person or practical observation.");
  }
  const tutor = (input.proposed_tutor_credentials ?? "").trim();
  if (tutor.length > 0 && tutor.length < 30) {
    flags.push("Tutor credentials are unusually thin.");
  }
  return flags;
}
