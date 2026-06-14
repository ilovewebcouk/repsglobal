import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type BdMigrationStats = {
  total: number;
  claim: { staged: number; invited: number; claimed: number; skipped: number };
  photo: { ok: number; pending: number; rejected: number; missing: number; fetch_error: number };
  rejectReasons: { category: string; count: number }[];
  countries: { country: string; count: number }[];
  plans: { plan: string; count: number }[];
  recentRejects: {
    bd_member_id: number;
    email: string;
    first_name: string | null;
    last_name: string | null;
    profile_photo_reject_category: string | null;
    profile_photo_reject_reason: string | null;
  }[];
};

export const getBdMigrationStats = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<BdMigrationStats> => {
    const { supabase, userId } = context;

    // Admin gate
    const { data: isAdmin } = await supabase.rpc("has_role", {
      _user_id: userId,
      _role: "admin",
    });
    if (!isAdmin) throw new Response("Forbidden", { status: 403 });

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const [{ count: total }, claimRows, photoRows, rejectRows, countryRows, planRows, recentRej] =
      await Promise.all([
        supabaseAdmin.from("bd_member_seed").select("*", { count: "exact", head: true }),
        supabaseAdmin.from("bd_member_seed").select("claim_status"),
        supabaseAdmin.from("bd_member_seed").select("profile_photo_status"),
        supabaseAdmin
          .from("bd_member_seed")
          .select("profile_photo_reject_category")
          .eq("profile_photo_status", "rejected"),
        supabaseAdmin.from("bd_member_seed").select("country_ln"),
        supabaseAdmin.from("bd_member_seed").select("legacy_plan"),
        supabaseAdmin
          .from("bd_member_seed")
          .select(
            "bd_member_id,email,first_name,last_name,profile_photo_reject_category,profile_photo_reject_reason",
          )
          .eq("profile_photo_status", "rejected")
          .order("bd_member_id", { ascending: false })
          .limit(20),
      ]);

    const tally = <T extends string | null>(rows: { [k: string]: T }[] | null, key: string) => {
      const m = new Map<string, number>();
      for (const r of rows ?? []) {
        const v = (r[key] ?? "unknown") as string;
        m.set(v, (m.get(v) ?? 0) + 1);
      }
      return m;
    };

    const claim = tally(claimRows.data, "claim_status");
    const photo = tally(photoRows.data, "profile_photo_status");
    const rej = tally(rejectRows.data, "profile_photo_reject_category");
    const ctry = tally(countryRows.data, "country_ln");
    const plans = tally(planRows.data, "legacy_plan");

    const num = (m: Map<string, number>, k: string) => m.get(k) ?? 0;

    return {
      total: total ?? 0,
      claim: {
        staged: num(claim, "staged"),
        invited: num(claim, "invited"),
        claimed: num(claim, "claimed"),
        skipped: num(claim, "skipped"),
      },
      photo: {
        ok: num(photo, "ok"),
        pending: num(photo, "pending"),
        rejected: num(photo, "rejected"),
        missing: num(photo, "missing"),
        fetch_error: num(photo, "fetch_error"),
      },
      rejectReasons: [...rej.entries()]
        .map(([category, count]) => ({ category, count }))
        .sort((a, b) => b.count - a.count),
      countries: [...ctry.entries()]
        .map(([country, count]) => ({ country, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 8),
      plans: [...plans.entries()]
        .map(([plan, count]) => ({ plan, count }))
        .sort((a, b) => b.count - a.count),
      recentRejects: (recentRej.data ?? []) as BdMigrationStats["recentRejects"],
    };
  });
