import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/**
 * Admin-only feed of verification items awaiting review.
 *
 * Counted queues (all surfaced on /admin/verification):
 *  - Trainer qualifications: `verification_submissions` (submitted | changes_requested)
 *  - Trainer insurance: `insurance_policies` (pending)
 *  - Provider name changes: `provider_name_requests` (pending)
 *  - Provider domain changes: `provider_domain_verifications` (pending_admin_review)
 *  - Provider regulated qualifications: `provider_regulated_permissions` (submitted)
 *  - Provider CPD accreditation: `cpd_courses` (submitted)
 *
 * Powers the sidebar badge on /admin/verification and the admin slice of the
 * NotificationsBell.
 */
export const getAdminVerificationPending = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data: isAdmin } = await supabase.rpc("has_role", {
      _user_id: userId,
      _role: "admin",
    });
    if (!isAdmin)
      return {
        total: 0,
        qualifications: 0,
        insurance: 0,
        provider_names: 0,
        provider_domains: 0,
        provider_regulated: 0,
        provider_cpd: 0,
        items: [],
      };

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const [
      { data: qualRows, count: qualCount },
      { data: insRows, count: insCount },
      { count: nameCount },
      { count: domainCount },
      { count: regulatedCount },
      { count: cpdCount },
    ] = await Promise.all([
      supabaseAdmin
        .from("verification_submissions")
        .select("id, professional_id, qualification, awarding_body, status, created_at", {
          count: "exact",
        })
        .in("status", ["submitted", "changes_requested"])
        .order("created_at", { ascending: false })
        .limit(20),
      supabaseAdmin
        .from("insurance_policies")
        .select("id, professional_id, provider, status, created_at", { count: "exact" })
        .eq("status", "pending")
        .order("created_at", { ascending: false })
        .limit(20),
      supabaseAdmin
        .from("provider_name_requests")
        .select("id", { count: "exact", head: true })
        .eq("status", "pending"),
      supabaseAdmin
        .from("provider_domain_verifications")
        .select("id", { count: "exact", head: true })
        .eq("status", "pending_admin_review"),
      supabaseAdmin
        .from("provider_regulated_permissions")
        .select("id", { count: "exact", head: true })
        .eq("status", "submitted"),
      supabaseAdmin
        .from("cpd_courses")
        .select("id", { count: "exact", head: true })
        .eq("status", "submitted"),
    ]);

    const proIds = Array.from(
      new Set(
        [
          ...(qualRows ?? []).map((r) => r.professional_id),
          ...(insRows ?? []).map((r) => r.professional_id),
        ].filter(Boolean) as string[],
      ),
    );
    const nameById = new Map<string, string>();
    if (proIds.length) {
      const { data: profs } = await supabaseAdmin
        .from("profiles")
        .select("id, full_name, display_name")
        .in("id", proIds);
      for (const p of (profs ?? []) as Array<{
        id: string;
        full_name: string | null;
        display_name: string | null;
      }>) {
        nameById.set(p.id, p.display_name || p.full_name || "Professional");
      }
    }

    type Item = {
      key: string;
      kind: "qualification" | "insurance";
      title: string;
      preview: string;
      createdAt: string;
      href: string;
    };

    const items: Item[] = [
      ...((qualRows ?? []) as Array<{
        id: string;
        professional_id: string;
        qualification: string | null;
        awarding_body: string | null;
        status: string;
        created_at: string;
      }>).map<Item>((r) => ({
        key: `qual-${r.id}`,
        kind: "qualification",
        title: `${nameById.get(r.professional_id) ?? "Pro"} — qualification`,
        preview: [r.qualification, r.awarding_body].filter(Boolean).join(" · ") || "Awaiting review",
        createdAt: r.created_at,
        href: "/admin/verification",
      })),
      ...((insRows ?? []) as Array<{
        id: string;
        professional_id: string;
        provider: string | null;
        status: string;
        created_at: string;
      }>).map<Item>((r) => ({
        key: `ins-${r.id}`,
        kind: "insurance",
        title: `${nameById.get(r.professional_id) ?? "Pro"} — insurance`,
        preview: r.provider ?? "Awaiting review",
        createdAt: r.created_at,
        href: "/admin/verification",
      })),
    ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const qualifications = qualCount ?? 0;
    const insurance = insCount ?? 0;
    const provider_names = nameCount ?? 0;
    const provider_domains = domainCount ?? 0;
    const provider_regulated = regulatedCount ?? 0;
    const provider_cpd = cpdCount ?? 0;

    return {
      total:
        qualifications +
        insurance +
        provider_names +
        provider_domains +
        provider_regulated +
        provider_cpd,
      qualifications,
      insurance,
      provider_names,
      provider_domains,
      provider_regulated,
      provider_cpd,
      items: items.slice(0, 20),
    };
  });
