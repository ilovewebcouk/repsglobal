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
 *  - Provider REPS-accredited courses: `reps_courses` (submitted | ai_drafted)
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
        provider_courses: 0,
        items: [],
      };

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const [
      { data: qualRows, count: qualCount },
      { data: insRows, count: insCount },
      { data: nameRows, count: nameCount },
      { data: domainRows, count: domainCount },
      { data: regulatedRows, count: regulatedCount },
      { data: courseRows, count: coursesCount },
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
        .select("id, provider_id, requested_name, current_name, created_at", { count: "exact" })
        .eq("status", "pending")
        .order("created_at", { ascending: false })
        .limit(20),
      supabaseAdmin
        .from("provider_domain_verifications")
        .select("id, provider_id, domain, created_at", { count: "exact" })
        .eq("status", "pending_admin_review")
        .order("created_at", { ascending: false })
        .limit(20),
      supabaseAdmin
        .from("provider_regulated_permissions")
        .select("id, provider_id, awarding_body, qualification_title, created_at", {
          count: "exact",
        })
        .eq("status", "submitted")
        .order("created_at", { ascending: false })
        .limit(20),
      supabaseAdmin
        .from("reps_courses")
        .select("id, provider_id, title, status, created_at", { count: "exact" })
        .in("status", ["submitted", "ai_drafted"])
        .order("created_at", { ascending: false })
        .limit(20),
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
        .select("id, full_name")
        .in("id", proIds);
      for (const p of (profs ?? []) as Array<{
        id: string;
        full_name: string | null;
      }>) {
        const n = p.full_name?.trim();
        if (n) nameById.set(p.id, n);
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
        title: `${nameById.get(r.professional_id) ?? "Unnamed provider"} — qualification`,
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
        title: `${nameById.get(r.professional_id) ?? "Unnamed provider"} — insurance`,
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
    const provider_courses = coursesCount ?? 0;

    return {
      total:
        qualifications +
        insurance +
        provider_names +
        provider_domains +
        provider_regulated +
        provider_courses,
      qualifications,
      insurance,
      provider_names,
      provider_domains,
      provider_regulated,
      provider_courses,
      items: items.slice(0, 20),
    };
  });
