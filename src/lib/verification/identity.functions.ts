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
        "id, professional_id, doc_type, name_on_doc, dob_on_doc, status, vendor, stripe_vs_id, stripe_status, stripe_reason, admin_note, created_at, reviewed_at, environment",
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


