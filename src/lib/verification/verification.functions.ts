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
});

export const submitVerification = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => submitInput.parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

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
  let profByPro: Record<string, { full_name: string | null; trading_name: string | null; city: string | null }> = {};
  if (proIds.length) {
    const { data: pros } = await supabaseAdmin
      .from("professionals")
      .select("id, trading_name, city")
      .in("id", proIds);
    const { data: profiles } = await supabaseAdmin
      .from("profiles")
      .select("id, full_name")
      .in("id", proIds);
    const profileMap = new Map((profiles ?? []).map((p) => [p.id, p.full_name]));
    profByPro = Object.fromEntries(
      (pros ?? []).map((p) => [
        p.id,
        { full_name: profileMap.get(p.id) ?? null, trading_name: p.trading_name, city: p.city },
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
    const { SPECIALISM_SLUGS, MAX_SPECIALISMS } = await import("@/lib/specialisms");

    const { data: sub, error: subErr } = await supabaseAdmin
      .from("verification_submissions")
      .select(
        "id, professional_id, qualification, awarding_body, awarding_body_slug, regulator_verified, derived_title_slug, derived_specialism_slugs",
      )
      .eq("id", data.id)
      .maybeSingle();
    if (subErr) throw new Error(subErr.message);
    if (!sub) throw new Error("Submission not found");

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
    } as never);

    if (data.decision === "approved") {
      await supabaseAdmin
        .from("professionals")
        .update({
          verification: "verified",
          verification_status: "verified",
        } as never)
        .eq("id", sub.professional_id);

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
            { onConflict: "professional_id,title_slug,source_submission_id" },
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
      // up to MAX_SPECIALISMS. We don't remove existing picks.
      const derivedSpecs = rules.specialisms.map((s) => s.slug);
      if (derivedSpecs.length > 0) {
        const { data: proSpec } = await supabaseAdmin
          .from("professionals")
          .select("specialisms")
          .eq("id", sub.professional_id)
          .maybeSingle();
        const existing = ((proSpec as { specialisms?: string[] | null } | null)?.specialisms ?? [])
          .filter((s) => (SPECIALISM_SLUGS as string[]).includes(s));
        const merged = [...existing];
        for (const s of derivedSpecs) {
          if (merged.length >= MAX_SPECIALISMS) break;
          if (!merged.includes(s)) merged.push(s);
        }
        if (merged.length !== existing.length) {
          await supabaseAdmin
            .from("professionals")
            .update({ specialisms: merged } as never)
            .eq("id", sub.professional_id);
        }
      }
    } else if (data.decision === "rejected") {
      await supabaseAdmin
        .from("professionals")
        .update({
          verification: "rejected",
          verification_status: "unverified",
        } as never)
        .eq("id", sub.professional_id);
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
        .select("id, trading_name, city, primary_profession, primary_title_slug, verification, slug")
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
    await supabaseAdmin.rpc("enqueue_email", {
      queue_name: "transactional",
      payload: {
        template: "verification_reminder",
        to: email,
        data: { missing: data.missing },
      },
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
      await supabaseAdmin
        .from("professionals")
        .update({
          verification: "unverified",
          verification_status: "unverified",
          primary_title_slug: null,
        } as never)
        .eq("id", proId);
    } else if (revokedSlugs.length > 0) {
      // Still has other approvals, but the primary title may have been one of
      // the revoked ones. If so, clear it — the pro can re-pick from what's left.
      const { data: proRow } = await supabaseAdmin
        .from("professionals")
        .select("primary_title_slug")
        .eq("id", proId)
        .maybeSingle();
      const currentPrimary =
        (proRow as { primary_title_slug?: string | null } | null)?.primary_title_slug ?? null;
      if (currentPrimary && revokedSlugs.includes(currentPrimary)) {
        await supabaseAdmin
          .from("professionals")
          .update({ primary_title_slug: null } as never)
          .eq("id", proId);
      }
    }

    return { ok: true, revoked_titles: revokedSlugs };
  });


