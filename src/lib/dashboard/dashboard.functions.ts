import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuthWithImpersonation } from "@/integrations/supabase/auth-middleware-impersonation";

export const getDashboardStatus = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuthWithImpersonation])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;

    const [{ data: profile }, { data: identity }, { data: subs }, { data: lastSub }] =
      await Promise.all([
        supabase
          .from("professionals")
          .select(
            "slug, headline, bio, specialisms, city, hourly_rate_pence, is_published, verification_status, reps_level, cert_uploaded_at, insurance_valid_until, dbs_valid_until",
          )
          .eq("id", userId)
          .maybeSingle(),
        supabase
          .from("profiles")
          .select("full_name, business_name, avatar_url")
          .eq("id", userId)
          .maybeSingle(),
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
      identity?.business_name &&
      profile?.headline &&
      profile?.bio &&
      (profile?.specialisms?.length ?? 0) > 0 &&
      profile?.city
    );

    const tier = subs?.tier ?? "free";
    const liveStatuses = ["active", "trialing", "past_due", "unpaid"];
    const hasPaidTier =
      (tier === "verified" || tier === "pro" || tier === "studio") &&
      liveStatuses.includes(subs?.status ?? "");
    const isVerified = profile?.verification_status === "verified";
    const isPublished = profile?.is_published ?? false;

    return {
      userId,
      identity,
      profile,
      profileComplete,
      subscription: subs,
      lastSubmission: lastSub,
      entitlement: {
        tier,
        hasPaidTier,
        hasProAccess:
          (tier === "pro" || tier === "studio") &&
          liveStatuses.includes(subs?.status ?? ""),
      },
      onboarding: {
        plan: hasPaidTier,
        profile: profileComplete,
        credentials: isVerified,
        publish: isPublished,
        complete: hasPaidTier && profileComplete && isVerified && isPublished,
      },
    };
  });
