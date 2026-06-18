import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuthWithImpersonation } from "@/integrations/supabase/auth-middleware-impersonation";

const identityInput = z.object({
  doc_type: z.enum(["passport", "driving_licence", "national_id"]),
  doc_country: z.string().min(2).max(64).optional().nullable(),
  doc_path_front: z.string().min(1),
  doc_path_back: z.string().optional().nullable(),
  selfie_path: z.string().optional().nullable(),
  name_on_doc: z.string().max(160).optional().nullable(),
  dob_on_doc: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable(),
  doc_expiry: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable(),
});

export const saveIdentity = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuthWithImpersonation])
  .inputValidator((d: unknown) => identityInput.parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    await supabase.from("professionals").upsert({ id: userId } as never, { onConflict: "id" });
    const { data: row, error } = await supabase
      .from("identity_documents")
      .insert({
        professional_id: userId,
        doc_type: data.doc_type,
        doc_country: data.doc_country ?? null,
        doc_path_front: data.doc_path_front,
        doc_path_back: data.doc_path_back ?? null,
        selfie_path: data.selfie_path ?? null,
        name_on_doc: data.name_on_doc ?? null,
        dob_on_doc: data.dob_on_doc ?? null,
        doc_expiry: data.doc_expiry ?? null,
        status: "pending",
      } as never)
      .select("id, status, created_at")
      .single();
    if (error) throw new Error(error.message);
    return row;
  });

export const myIdentity = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuthWithImpersonation])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data, error } = await supabase
      .from("identity_documents")
      .select("id, doc_type, doc_country, name_on_doc, dob_on_doc, doc_expiry, selfie_path, doc_path_front, doc_path_back, status, admin_note, created_at, reviewed_at, vendor, veriff_session_id, veriff_session_url, veriff_status, veriff_reason, stripe_vs_id, stripe_vs_url, stripe_status, stripe_reason")
      .eq("professional_id", userId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return data;
  });

export const getIdentityForPro = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuthWithImpersonation])
  .inputValidator((d: unknown) => z.object({ professional_id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: isAdmin } = await supabase.rpc("has_role", { _user_id: userId, _role: "admin" });
    if (!isAdmin) throw new Error("Forbidden");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: row } = await supabaseAdmin
      .from("identity_documents")
      .select("*")
      .eq("professional_id", data.professional_id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    return row;
  });

const IDENTITY_STATUSES = [
  "pending",
  "approved",
  "rejected",
  "needs_more_info",
  "expired",
] as const;

/**
 * Admin index of all identity_documents rows. Used by the Identity tab of
 * the admin Verification page so admins can see Stripe Identity outcomes,
 * pending checks, and historical decisions in one place.
 */
export const listIdentityChecks = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuthWithImpersonation])
  .inputValidator((d: unknown) =>
    z
      .object({
        statuses: z.array(z.enum(IDENTITY_STATUSES)).min(1).max(5),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: isAdmin } = await supabase.rpc("has_role", { _user_id: userId, _role: "admin" });
    if (!isAdmin) throw new Error("Forbidden");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: rows, error } = await supabaseAdmin
      .from("identity_documents")
      .select(
        "id, professional_id, doc_type, name_on_doc, dob_on_doc, status, vendor, stripe_status, stripe_reason, admin_note, created_at, reviewed_at, environment",
      )
      .in("status", data.statuses as never)
      .order("created_at", { ascending: false })
      .limit(500);
    if (error) throw new Error(error.message);

    const proIds = Array.from(new Set((rows ?? []).map((r) => r.professional_id)));
    let nameByPro: Record<string, string | null> = {};
    if (proIds.length) {
      const { data: profiles } = await supabaseAdmin
        .from("profiles")
        .select("id, full_name")
        .in("id", proIds);
      nameByPro = Object.fromEntries((profiles ?? []).map((p) => [p.id, p.full_name]));
    }
    return (rows ?? []).map((r) => ({ ...r, profile_name: nameByPro[r.professional_id] ?? null }));
  });

/**
 * Manual admin override of a Stripe Identity check. Use when Stripe gets
 * stuck, when a name-mismatch flag should be cleared after profile update,
 * or when a manually-uploaded ID needs a decision. Writes the reviewer's
 * reason into admin_note for the audit trail.
 */
export const adminOverrideIdentity = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuthWithImpersonation])
  .inputValidator((d: unknown) =>
    z
      .object({
        identity_id: z.string().uuid(),
        decision: z.enum(["approved", "rejected", "needs_more_info"]),
        reason: z.string().min(8).max(1000),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: isAdmin } = await supabase.rpc("has_role", { _user_id: userId, _role: "admin" });
    if (!isAdmin) throw new Error("Forbidden");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("identity_documents")
      .update({
        status: data.decision,
        admin_note: `Manual override by admin: ${data.reason}`,
        reviewed_at: new Date().toISOString(),
      } as never)
      .eq("id", data.identity_id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

