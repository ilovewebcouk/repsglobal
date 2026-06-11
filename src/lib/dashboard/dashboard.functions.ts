import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const getDashboardStatus = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;

    const [{ data: profile }, { data: roles }, { data: subs }, { data: lastSub }] =
      await Promise.all([
        supabase
          .from("professionals")
          .select(
            "slug, trading_name, headline, bio, specialisms, city, hourly_rate_pence, is_published, verification_status",
          )
          .eq("id", userId)
          .maybeSingle(),
        supabase.from("user_roles").select("role").eq("user_id", userId),
        supabase
          .from("subscriptions")
          .select("tier, status, current_period_end")
          .eq("user_id", userId)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle(),
        supabase
          .from("verification_submissions")
          .select("status, created_at")
          .eq("professional_id", userId)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle(),
      ]);

    const profileComplete = !!(
      profile?.slug &&
      profile?.trading_name &&
      profile?.headline &&
      profile?.bio &&
      (profile?.specialisms?.length ?? 0) > 0 &&
      profile?.city
    );

    return {
      profile,
      profileComplete,
      isAdmin: (roles ?? []).some((r) => r.role === "admin"),
      subscription: subs,
      lastSubmission: lastSub,
    };
  });
