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
      .select("id, awarding_body, qualification, year, status, admin_note, created_at, reviewed_at, doc_paths")
      .eq("professional_id", userId)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
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

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data, error } = await supabaseAdmin
      .from("verification_submissions")
      .select(
        "id, professional_id, awarding_body, qualification, year, status, admin_note, created_at, doc_paths, reviewed_at, derived_title_slug, derived_specialism_slugs, regulator_verified",
      )
      .in("status", ["submitted", "changes_requested"])
      .order("created_at", { ascending: true });
    if (error) throw new Error(error.message);

    // Fetch professional + profile info in one go
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
      } as never)
      .eq("id", data.id);
    if (updErr) throw new Error(updErr.message);

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
