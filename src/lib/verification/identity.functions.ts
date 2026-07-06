import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuthWithImpersonation } from "@/integrations/supabase/auth-middleware-impersonation";

// Identity is captured exclusively via Stripe Identity. The legacy manual
// upload path (saveIdentity + identity_documents writes from the dashboard)
// has been retired — see createStripeIdentitySession in
// ./stripe-identity.functions.ts for the only entry point now.


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

const IDENTITY_STATUSES = ["pending", "approved", "rejected"] as const;

/**
 * Admin index of identity_documents rows. Read-only surface for the
 * Identity tab of admin Verification — Stripe Identity is the sole source
 * of truth for outcomes; admins cannot mutate these rows.
 */
export const listIdentityChecks = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuthWithImpersonation])
  .inputValidator((d: unknown) =>
    z
      .object({
        statuses: z.array(z.enum(IDENTITY_STATUSES)).min(1).max(3),
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
    const nowIso = new Date().toISOString();

    // 1. Update the identity_documents row (audit trail).
    const { data: idDoc, error } = await supabaseAdmin
      .from("identity_documents")
      .update({
        status: data.decision,
        admin_note: `Manual override by admin: ${data.reason}`,
        reviewed_at: nowIso,
        reviewed_by: userId,
      } as never)
      .eq("id", data.identity_id)
      .select("professional_id, name_on_doc")
      .single();
    if (error) throw new Error(error.message);

    // 2. Propagate the decision to the professional row so the trainer's
    //    Dashboard, Verification page, and public Trust block all reflect it.
    //    Without this, the doc was approved but the user still saw "In review".
    const proPid = (idDoc as { professional_id: string; name_on_doc: string | null }).professional_id;
    const nameOnDoc = (idDoc as { name_on_doc: string | null }).name_on_doc;

    const proPatch: Record<string, unknown> = { identity_status: data.decision };
    if (data.decision === "approved") {
      proPatch.identity_verified_at = nowIso;
      if (nameOnDoc) proPatch.identity_verified_name = nameOnDoc;
    }
    await supabaseAdmin.from("professionals").update(proPatch as never).eq("id", proPid);

    return { ok: true };
  });

