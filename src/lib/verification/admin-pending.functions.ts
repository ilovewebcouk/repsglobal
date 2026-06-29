import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/**
 * Admin-only feed of verification items awaiting review.
 *
 * Two queues:
 *  - Qualifications: `verification_submissions` with status submitted | changes_requested
 *  - Insurance: `insurance_policies` with status pending
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
    if (!isAdmin) return { total: 0, qualifications: 0, insurance: 0, items: [] };

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const [{ data: qualRows, count: qualCount }, { data: insRows, count: insCount }] =
      await Promise.all([
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

    return {
      total: (qualCount ?? 0) + (insCount ?? 0),
      qualifications: qualCount ?? 0,
      insurance: insCount ?? 0,
      items: items.slice(0, 20),
    };
  });
