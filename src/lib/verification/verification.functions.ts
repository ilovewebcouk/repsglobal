import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const submitInput = z.object({
  awarding_body: z.string().min(2).max(120),
  qualification: z.string().min(2).max(160),
  year: z.number().int().min(1990).max(2100).optional().nullable(),
  doc_paths: z.array(z.string().min(1)).min(1).max(10),
});

const reviewInput = z.object({
  id: z.string().uuid(),
  decision: z.enum(["approved", "rejected", "changes_requested"]),
  admin_note: z.string().max(1000).optional().nullable(),
  checklist: z.record(z.string(), z.boolean()).optional(),
  unlocked_tier: z.enum(["verified", "pro", "studio"]).optional().nullable(),
  gates_snapshot: z.record(z.string(), z.unknown()).optional().nullable(),
  override_reason: z.string().max(500).optional().nullable(),
});

export const submitVerification = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => submitInput.parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    // Ownership check: every doc_path must live under the caller's storage folder.
    for (const p of data.doc_paths) {
      if (!p.startsWith(`${userId}/`)) {
        throw new Error("Forbidden: doc_path does not belong to you");
      }
    }

    // Ensure a professional row exists (handle_new_user trigger should create it,
    // but a Google OAuth signup without signup_kind=professional may have skipped it).
    await supabase.from("professionals").upsert({ id: userId } as never, { onConflict: "id" });

    const { data: row, error } = await supabase
      .from("verification_submissions")
      .insert({
        professional_id: userId,
        awarding_body: data.awarding_body,
        qualification: data.qualification,
        year: data.year ?? null,
        doc_paths: data.doc_paths,
      } as never)
      .select("id, status, created_at")
      .single();
    if (error) throw new Error(error.message);

    // Mark professional as having uploaded a cert
    await supabase
      .from("professionals")
      .update({ cert_uploaded_at: new Date().toISOString() } as never)
      .eq("id", userId);

    return row;
  });

export const myVerificationSubmissions = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data, error } = await supabase
      .from("verification_submissions")
      .select(
        "id, awarding_body, qualification, qualification_number, year, expiry_date, status, admin_note, created_at, reviewed_at, doc_paths, regulator_verified, derived_title_slug",
      )
      .eq("professional_id", userId)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

const SUBMISSION_STATUSES = [
  "submitted",
  "approved",
  "rejected",
  "changes_requested",
] as const;

async function fetchSubmissionsByStatus(statuses: readonly string[]) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

  const { data, error } = await supabaseAdmin
    .from("verification_submissions")
    .select(
      "id, professional_id, awarding_body, qualification, year, status, admin_note, created_at, doc_paths, reviewed_at, reviewed_by, derived_title_slug, derived_specialism_slugs, regulator_verified, claimed_by, claimed_at",
    )
    .in("status", statuses as never)
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);

  const proIds = Array.from(new Set((data ?? []).map((r) => r.professional_id)));
  let profByPro: Record<string, { full_name: string | null; city: string | null }> = {};
  if (proIds.length) {
    const { data: pros } = await supabaseAdmin
      .from("professionals")
      .select("id, city")
      .in("id", proIds);
    const { data: profiles } = await supabaseAdmin
      .from("profiles")
      .select("id, full_name")
      .in("id", proIds);
    const profileMap = new Map((profiles ?? []).map((p) => [p.id, { full_name: p.full_name }]));
    profByPro = Object.fromEntries(
      (pros ?? []).map((p) => [
        p.id,
        { full_name: profileMap.get(p.id)?.full_name ?? null, city: p.city },
      ]),
    );
  }

  return (data ?? []).map((r) => ({ ...r, professional: profByPro[r.professional_id] ?? null }));
}

/**
 * Generic admin index of verification submissions filtered by status.
 * Used by the admin Verification page to switch between Pending / Approved /
 * Rejected / Changes-requested tabs.
 */
export const listVerifications = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        statuses: z.array(z.enum(SUBMISSION_STATUSES)).min(1).max(4),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: isAdmin } = await supabase.rpc("has_role", { _user_id: userId, _role: "admin" });
    if (!isAdmin) throw new Error("Forbidden");
    return fetchSubmissionsByStatus(data.statuses);
  });

export const listPendingVerifications = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data: isAdmin } = await supabase.rpc("has_role", {
      _user_id: userId,
      _role: "admin",
    });
    if (!isAdmin) throw new Error("Forbidden");
    return fetchSubmissionsByStatus(["submitted", "changes_requested"] as const);
  });


export const reviewVerification = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => reviewInput.parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: isAdmin } = await supabase.rpc("has_role", {
      _user_id: userId,
      _role: "admin",
    });
    if (!isAdmin) throw new Error("Forbidden");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { TITLES } = await import("@/lib/cpd/titles-catalog");
    const { deriveTitlesForSubmission } = await import("@/lib/cpd/title-rules");
    const {
      SPECIALISM_SLUGS,
      MAX_SPECIALISMS,
      mapLegacySpecialism,
      isSpecialismValidForProfession,
    } = await import("@/lib/specialisms");
    const { isProfessionSlug } = await import("@/lib/professions");

    const { data: sub, error: subErr } = await supabaseAdmin
      .from("verification_submissions")
      .select(
        "id, professional_id, qualification, awarding_body, awarding_body_slug, regulator_verified, derived_title_slug, derived_specialism_slugs",
      )
      .eq("id", data.id)
      .maybeSingle();
    if (subErr) throw new Error(subErr.message);
    if (!sub) throw new Error("Submission not found");

    // Sub-pass 0c: enforce hard gates on Approve. Reviewer must either pass
    // every hard gate or type an override reason (≥8 chars).
    if (data.decision === "approved") {
      const snap = (data.gates_snapshot ?? null) as { hardPassed?: boolean; blockingReasons?: string[] } | null;
      const overrideOk = (data.override_reason ?? "").trim().length >= 8;
      if (snap && snap.hardPassed === false && !overrideOk) {
        throw new Error(
          `Cannot approve — failing checks: ${(snap.blockingReasons ?? []).join(", ") || "unknown"}. Provide an override reason (≥8 chars).`,
        );
      }
    }

    const { error: updErr } = await supabaseAdmin
      .from("verification_submissions")
      .update({
        status: data.decision,
        admin_note: data.admin_note ?? null,
        reviewed_by: userId,
        reviewed_at: new Date().toISOString(),
        review_checklist: data.checklist ?? {},
        claimed_by: null,
        claimed_at: null,
      } as never)
      .eq("id", data.id);
    if (updErr) throw new Error(updErr.message);

    // Immutable audit log entry — always written, regardless of outcome.
    await supabaseAdmin.from("verification_decisions").insert({
      submission_id: data.id,
      professional_id: sub.professional_id,
      reviewer_id: userId,
      decision: data.decision,
      notes: data.admin_note ?? null,
      checklist: data.checklist ?? {},
      unlocked_tier: data.unlocked_tier ?? (data.decision === "approved" ? "verified" : null),
      gates_snapshot: data.gates_snapshot ?? null,
      override_reason: data.override_reason ?? null,
    } as never);

    if (data.decision === "approved") {
      // NOTE: We intentionally do NOT flip `professionals.verification` here.
      // The public "REPS Verified" credential is the 3-of-3 gate
      // (ID + qualification + in-date insurance) and is recomputed by the
      // `recompute_pro_verification` DB trigger whenever any input changes.
      // Approving the qualification on its own does not earn the badge.

      // Re-run the rules engine on the freshest server data (cheap, deterministic).
      // We deliberately do NOT trust client-supplied derived_* columns blindly.
      const rules = deriveTitlesForSubmission({
        qualification: (sub as { qualification?: string | null }).qualification,
        awarding_body: (sub as { awarding_body?: string | null }).awarding_body,
        awarding_body_slug: (sub as { awarding_body_slug?: string | null }).awarding_body_slug ?? null,
        ofqualVerified: !!(sub as { regulator_verified?: boolean | null }).regulator_verified,
      });

      // Commit each matched title EXCEPT those requiring external register
      // verification (admin must use the manual grant tool for those).
      const grantable = rules.titles.filter((t) => !t.requiresAdminReview);
      if (grantable.length > 0) {
        await supabaseAdmin
          .from("pro_titles")
          .upsert(
            grantable.map((t) => ({
              professional_id: sub.professional_id,
              title_slug: t.title_slug,
              source_submission_id: sub.id,
              granted_by: "system",
            })) as never,
            { onConflict: "professional_id, title_slug, source_submission_id" },
          );

        // If the pro doesn't have a primary title yet, set the highest-tier
        // matched title as their primary (and mirror into primary_profession).
        const { data: proRow } = await supabaseAdmin
          .from("professionals")
          .select("primary_title_slug")
          .eq("id", sub.professional_id)
          .maybeSingle();
        const currentPrimary =
          (proRow as { primary_title_slug?: string | null } | null)?.primary_title_slug ?? null;
        if (!currentPrimary) {
          const top = grantable[0]; // already tier-sorted by the rules engine
          const entry = TITLES.find((t) => t.slug === top.title_slug);
          if (entry) {
            await supabaseAdmin
              .from("professionals")
              .update({
                primary_title_slug: entry.slug,
                primary_profession: entry.professionSlug,
              } as never)
              .eq("id", sub.professional_id);
            await supabaseAdmin
              .from("pro_titles")
              .update({ is_primary: true } as never)
              .eq("professional_id", sub.professional_id)
              .eq("title_slug", entry.slug)
              .eq("source_submission_id", sub.id);
          }
        }
      }

      // Auto-add any newly derived specialisms to the pro's selection,
      // up to MAX_SPECIALISMS. Title rules emit "legacy" generic slugs
      // (e.g. "strength") — map them to the new profession-scoped slug
      // (e.g. "powerlifting" for a strength coach) before merging.
      const derivedLegacy = rules.specialisms.map((s) => s.slug);
      if (derivedLegacy.length > 0) {
        const { data: proSpec } = await supabaseAdmin
          .from("professionals")
          .select("specialisms, primary_profession")
          .eq("id", sub.professional_id)
          .maybeSingle();
        const row = proSpec as
          | { specialisms?: string[] | null; primary_profession?: string | null }
          | null;
        const proProfRaw = row?.primary_profession ?? null;
        const proProf = isProfessionSlug(proProfRaw) ? proProfRaw : null;

        const existing = (row?.specialisms ?? [])
          .filter((s) => (SPECIALISM_SLUGS as string[]).includes(s))
          .filter((s) => isSpecialismValidForProfession(s, proProf));

        const derivedMapped = proProf
          ? (derivedLegacy
              .map((legacy) => mapLegacySpecialism(legacy, proProf))
              .filter((s): s is string => Boolean(s)))
          : [];

        const merged = [...existing];
        for (const s of derivedMapped) {
          if (merged.length >= MAX_SPECIALISMS) break;
          if (!merged.includes(s)) merged.push(s);
        }
        if (
          merged.length !== existing.length ||
          merged.some((s, i) => s !== existing[i])
        ) {
          await supabaseAdmin
            .from("professionals")
            .update({ specialisms: merged } as never)
            .eq("id", sub.professional_id);
        }
      }
    }
    // NOTE: Rejected/changes_requested decisions do not touch the
    // `verification` column either — the DB trigger handles it.

    // Bell + email for the trainer on every review outcome.
    try {
      const { notifyVerificationEvent } = await import("./notifications.functions");
      const event =
        data.decision === "approved"
          ? "qualification.approved"
          : data.decision === "rejected"
            ? "qualification.rejected"
            : "qualification.changes_requested";
      await notifyVerificationEvent({
        professionalId: sub.professional_id,
        event,
        context: {
          submission_id: sub.id,
          qualification: (sub as { qualification?: string | null }).qualification ?? null,
          admin_note: data.admin_note ?? null,
        },
        alsoEmail: false,
      });
    } catch (e) {
      console.error("[reviewVerification] notify failed", (e as Error).message);
    }

    return { ok: true };
  });


export const getVerificationDocUrl = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ path: z.string().min(1) }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: isAdmin } = await supabase.rpc("has_role", {
      _user_id: userId,
      _role: "admin",
    });
    if (!isAdmin) throw new Error("Forbidden");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: signed, error } = await supabaseAdmin.storage
      .from("verification-docs")
      .createSignedUrl(data.path, 60 * 10); // 10 minutes
    if (error) throw new Error(error.message);
    return { url: signed.signedUrl };
  });

/* -------------------------------------------------------------------------- */
/* Claim / release optimistic lock                                            */
/* -------------------------------------------------------------------------- */

const CLAIM_TTL_MIN = 15;

async function assertAdmin(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  userId: string,
) {
  const { data: isAdmin } = await supabase.rpc("has_role", { _user_id: userId, _role: "admin" });
  if (!isAdmin) throw new Error("Forbidden");
}

export const claimVerification = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const cutoff = new Date(Date.now() - CLAIM_TTL_MIN * 60_000).toISOString();
    const { data: cur } = await supabaseAdmin
      .from("verification_submissions")
      .select("claimed_by, claimed_at")
      .eq("id", data.id)
      .maybeSingle();
    const c = cur as { claimed_by: string | null; claimed_at: string | null } | null;
    if (c?.claimed_by && c.claimed_by !== context.userId && c.claimed_at && c.claimed_at > cutoff) {
      throw new Error("Already claimed by another reviewer");
    }
    const { error } = await supabaseAdmin
      .from("verification_submissions")
      .update({ claimed_by: context.userId, claimed_at: new Date().toISOString() } as never)
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const releaseVerification = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin
      .from("verification_submissions")
      .update({ claimed_by: null, claimed_at: null } as never)
      .eq("id", data.id)
      .eq("claimed_by", context.userId);
    return { ok: true };
  });

/* -------------------------------------------------------------------------- */
/* Queue stats                                                                */
/* -------------------------------------------------------------------------- */

export const getQueueStats = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const since24h = new Date(Date.now() - 24 * 3600 * 1000).toISOString();
    const since7d = new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString();

    const [{ count: pending }, { count: approved24h }, { count: rejected7d }, { data: decisions }] = await Promise.all([
      supabaseAdmin
        .from("verification_submissions")
        .select("id", { count: "exact", head: true })
        .in("status", ["submitted", "changes_requested"]),
      supabaseAdmin
        .from("verification_decisions")
        .select("id", { count: "exact", head: true })
        .eq("decision", "approved")
        .gte("created_at", since24h),
      supabaseAdmin
        .from("verification_decisions")
        .select("id", { count: "exact", head: true })
        .eq("decision", "rejected")
        .gte("created_at", since7d),
      supabaseAdmin
        .from("verification_decisions")
        .select("created_at, submission_id")
        .gte("created_at", since7d)
        .limit(200),
    ]);

    let avgMinutes: number | null = null;
    if (decisions && decisions.length) {
      const subIds = decisions.map((d) => d.submission_id).filter(Boolean) as string[];
      if (subIds.length) {
        const { data: subs } = await supabaseAdmin
          .from("verification_submissions")
          .select("id, created_at")
          .in("id", subIds);
        const subMap = new Map((subs ?? []).map((s) => [s.id, new Date(s.created_at).getTime()]));
        const deltas = decisions
          .map((d) => {
            const sc = subMap.get(d.submission_id as string);
            return sc ? new Date(d.created_at).getTime() - sc : null;
          })
          .filter((x): x is number => x != null && x >= 0);
        if (deltas.length)
          avgMinutes = Math.round(deltas.reduce((a, b) => a + b, 0) / deltas.length / 60_000);
      }
    }

    const startToday = new Date();
    startToday.setHours(0, 0, 0, 0);
    const { count: mineToday } = await supabaseAdmin
      .from("verification_decisions")
      .select("id", { count: "exact", head: true })
      .eq("reviewer_id", context.userId)
      .gte("created_at", startToday.toISOString());

    return {
      pending: pending ?? 0,
      approved24h: approved24h ?? 0,
      rejected7d: rejected7d ?? 0,
      mineToday: mineToday ?? 0,
      avgMinutes,
    };
  });

/* -------------------------------------------------------------------------- */
/* Workspace — consolidated case payload                                      */
/* -------------------------------------------------------------------------- */

export const getReviewWorkspace = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: sub, error } = await supabaseAdmin
      .from("verification_submissions")
      .select("*")
      .eq("id", data.id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!sub) throw new Error("Not found");

    const pid = (sub as { professional_id: string }).professional_id;
    const [proR, profileR, identityR, insuranceR, historyR] = await Promise.all([
      supabaseAdmin
        .from("professionals")
        .select("id, city, primary_profession, primary_title_slug, verification, slug, identity_verified_name, account_type")
        .eq("id", pid)
        .maybeSingle(),
      supabaseAdmin.from("profiles").select("id, full_name, avatar_url").eq("id", pid).maybeSingle(),
      supabaseAdmin
        .from("identity_documents")
        .select("*")
        .eq("professional_id", pid)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabaseAdmin
        .from("insurance_policies")
        .select("*")
        .eq("professional_id", pid)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabaseAdmin
        .from("verification_decisions")
        .select("decision, notes, created_at, reviewer_id")
        .eq("professional_id", pid)
        .order("created_at", { ascending: false })
        .limit(10),
    ]);

    return {
      submission: sub,
      professional: proR.data,
      profile: profileR.data,
      identity: identityR.data,
      insurance: insuranceR.data,
      history: historyR.data ?? [],
    };
  });

/* -------------------------------------------------------------------------- */
/* Reminder email                                                             */
/* -------------------------------------------------------------------------- */

export const sendVerificationReminder = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        professional_id: z.string().uuid(),
        missing: z.array(z.enum(["identity", "selfie", "insurance", "cert"])),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: u } = await supabaseAdmin.auth.admin.getUserById(data.professional_id);
    const email = u?.user?.email;
    if (!email) throw new Error("No email on file");
    const { data: pro } = await supabaseAdmin
      .from("profiles")
      .select("full_name")
      .eq("id", data.professional_id)
      .maybeSingle();
    const proName = pro?.full_name ?? null;
    const { sendTransactionalEmailServer } = await import("@/lib/email/send.server");
    await sendTransactionalEmailServer({
      templateName: "verification-reminder",
      recipientEmail: email,
      idempotencyKey: `verification-reminder:${data.professional_id}:${new Date().toISOString().slice(0, 10)}`,
      templateData: { proName, missing: data.missing },
    });
    return { ok: true };
  });

/* -------------------------------------------------------------------------- */
/* Revoke an already-approved qualification                                   */
/* -------------------------------------------------------------------------- */

/**
 * Revoke a previously-approved qualification submission. Deletes any
 * `pro_titles` rows granted by that submission (titles came from this
 * qualification, so they go with it), writes a `verification_decisions`
 * audit row, and — if the pro has no remaining approved submissions —
 * flips `professionals.verification_status` back to `unverified` and
 * clears `primary_title_slug` if it pointed at a now-deleted title.
 */
export const revokeQualification = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        submission_id: z.string().uuid(),
        reason: z.string().min(8).max(1000),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: sub, error: subErr } = await supabaseAdmin
      .from("verification_submissions")
      .select("id, professional_id, status")
      .eq("id", data.submission_id)
      .maybeSingle();
    if (subErr) throw new Error(subErr.message);
    if (!sub) throw new Error("Submission not found");
    if ((sub as { status: string }).status !== "approved") {
      throw new Error("Only approved submissions can be revoked");
    }
    const proId = (sub as { professional_id: string }).professional_id;

    // 1. Capture which titles came from this submission (for primary cleanup).
    const { data: grantedTitles } = await supabaseAdmin
      .from("pro_titles")
      .select("title_slug, is_primary")
      .eq("source_submission_id", data.submission_id);
    const revokedSlugs = ((grantedTitles ?? []) as { title_slug: string; is_primary: boolean }[]).map(
      (t) => t.title_slug,
    );

    // 2. Delete the titles granted by this submission.
    await supabaseAdmin
      .from("pro_titles")
      .delete()
      .eq("source_submission_id", data.submission_id);

    // 3. Flip submission status back. Reuse 'rejected' + prefix admin_note so
    //    revocations are filterable in the admin list ("REVOKED:" prefix).
    await supabaseAdmin
      .from("verification_submissions")
      .update({
        status: "rejected",
        admin_note: `REVOKED: ${data.reason}`,
        reviewed_by: context.userId,
        reviewed_at: new Date().toISOString(),
      } as never)
      .eq("id", data.submission_id);

    // 4. Audit row.
    await supabaseAdmin.from("verification_decisions").insert({
      submission_id: data.submission_id,
      professional_id: proId,
      reviewer_id: context.userId,
      decision: "rejected",
      notes: `REVOKED: ${data.reason}`,
      checklist: {},
    } as never);

    // 5. If the pro has no remaining approved submissions, downgrade them.
    const { count: stillApproved } = await supabaseAdmin
      .from("verification_submissions")
      .select("id", { count: "exact", head: true })
      .eq("professional_id", proId)
      .eq("status", "approved");

    if (!stillApproved || stillApproved === 0) {
      // Clear the primary + secondary titles and let the recompute trigger reconcile both
      // `verification` and `verification_status` from the live 3-pillar check.
      // Never write the columns directly — that's the historical drift route.
      await supabaseAdmin
        .from("professionals")
        .update({ primary_title_slug: null, secondary_title_slug: null } as never)
        .eq("id", proId);
      await supabaseAdmin.rpc("recompute_pro_verification", { _pro_id: proId } as never);
    } else if (revokedSlugs.length > 0) {
      // Still has other approvals, but the primary or secondary title may have
      // been one of the revoked ones. If so, clear those slots — the pro can
      // re-pick from what's left.
      const { data: proRow } = await supabaseAdmin
        .from("professionals")
        .select("primary_title_slug, secondary_title_slug")
        .eq("id", proId)
        .maybeSingle();
      const proCols =
        (proRow as { primary_title_slug?: string | null; secondary_title_slug?: string | null } | null) ?? null;
      const updates: { primary_title_slug?: null; secondary_title_slug?: null } = {};
      if (proCols?.primary_title_slug && revokedSlugs.includes(proCols.primary_title_slug)) {
        updates.primary_title_slug = null;
      }
      if (proCols?.secondary_title_slug && revokedSlugs.includes(proCols.secondary_title_slug)) {
        updates.secondary_title_slug = null;
      }
      if (Object.keys(updates).length > 0) {
        await supabaseAdmin
          .from("professionals")
          .update(updates as never)
          .eq("id", proId);
      }
      await supabaseAdmin.rpc("recompute_pro_verification", { _pro_id: proId } as never);
    }

    return { ok: true, revoked_titles: revokedSlugs };
  });



/* -------------------------------------------------------------------------- */
/* Re-check Ofqual on demand (admin)                                          */
/* -------------------------------------------------------------------------- */

/**
 * Force a fresh Ofqual register lookup for an existing submission, bypassing
 * the 7-day cache. Updates `regulator_verified`, `regulator_record`, and the
 * `trust_signals.ofqual` block in place and returns the new state so the
 * admin UI can repaint without a full page reload.
 *
 * Admin-only. Never throws on Ofqual outage — returns the previous cached
 * record if the live fetch fails.
 */
export const recheckOfqualForSubmission = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({ submission_id: z.string().uuid() }).parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { lookupOfqualQualification } = await import("@/lib/cpd/ofqual.server");

    const { data: sub, error } = await supabaseAdmin
      .from("verification_submissions")
      .select(
        "id, qualification, qualification_number, awarding_body, awarding_body_slug, regulator_verified, regulator_record, trust_signals",
      )
      .eq("id", data.submission_id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!sub) throw new Error("Submission not found");

    const row = sub as {
      qualification: string | null;
      qualification_number: string | null;
      awarding_body: string | null;
      awarding_body_slug: string | null;
      regulator_verified: boolean | null;
      regulator_record: unknown;
      trust_signals: Record<string, unknown> | null;
    };

    if (!row.qualification_number) {
      return {
        ok: false as const,
        reason: "no_qualification_number" as const,
        regulator_verified: !!row.regulator_verified,
        record: null,
        matches: null,
      };
    }

    const result = await lookupOfqualQualification(
      row.qualification_number,
      {
        awardingBody: row.awarding_body,
        awardingBodySlug: row.awarding_body_slug,
        qualification: row.qualification,
      },
      { force: true },
    );

    const regulatorVerified =
      result.found && !!result.matches && result.matches.awardingBody && result.matches.title && result.matches.isLive;

    const trustSignals: Record<string, unknown> = { ...(row.trust_signals ?? {}) };
    trustSignals.ofqual = result.found
      ? {
          found: true,
          awarding_body_match: result.matches?.awardingBody ?? false,
          title_match: result.matches?.title ?? false,
          is_live: result.matches?.isLive ?? false,
          rechecked_at: new Date().toISOString(),
        }
      : { found: false, rechecked_at: new Date().toISOString() };

    await supabaseAdmin
      .from("verification_submissions")
      .update({
        regulator_verified: regulatorVerified,
        regulator_record: (result.record as unknown) as never,
        trust_signals: trustSignals as never,
      } as never)
      .eq("id", data.submission_id);

    return {
      ok: true as const,
      regulator_verified: regulatorVerified,
      record: result.record
        ? {
            qualificationNumber: result.record.qualificationNumber,
            title: result.record.title,
            awardingOrganisation: result.record.awardingOrganisation,
            level: result.record.level,
            status: result.record.status,
          }
        : null,
      matches: result.matches ?? null,
    };
  });

/* -------------------------------------------------------------------------- */
/* Verification column drift audit (admin)                                    */
/* -------------------------------------------------------------------------- */

/**
 * Returns professionals whose `verification` / `verification_status` cache
 * columns disagree, or whose canonical `verification='verified'` flag no
 * longer matches the live 3-pillar `is_pro_fully_verified()` check.
 *
 * Surfaces as a small chip on `/admin/verification` — count should be 0.
 */
export const auditVerificationDrift = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { data, error } = await context.supabase.rpc("audit_verification_drift");
    if (error) throw new Error(error.message);
    return (data ?? []) as Array<{
      professional_id: string;
      slug: string | null;
      verification: string;
      verification_status: string;
      fully_verified: boolean;
      reason: string;
    }>;
  });

/**
 * Force-recompute a single professional's verification columns from the
 * live 3-pillar check. Used by the drift-fix button on `/admin/verification`.
 */
export const recomputeProVerification = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({ professional_id: z.string().uuid() }).parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.rpc("recompute_pro_verification", {
      _pro_id: data.professional_id,
    } as never);
    if (error) throw new Error(error.message);
    return { ok: true as const };
  });
